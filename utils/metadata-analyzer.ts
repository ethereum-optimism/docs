import fs from 'fs'
import path from 'path'
import { MetadataResult, VALID_CATEGORIES, VALID_CONTENT_TYPES } from './types/metadata-types'

// Add interfaces for configuration
interface AnalyzerConfig {
  defaultLang: string;
  defaultTitle: string;
  defaultDescription: string;
  maxCategories: number;
  logger: (message: string) => void;
  priorityOrder: string[];
}

const DEFAULT_CONFIG: AnalyzerConfig = {
  defaultLang: 'en-US',
  defaultTitle: '',
  defaultDescription: '',
  maxCategories: 5,
  logger: console.log,
  priorityOrder: [
    'protocol',
    'infrastructure',
    'sequencer',
    'op-batcher',
    'rollup-node',
    'op-geth',
    'fault-proofs',
    'op-challenger',
    'cannon',
    'l1-deployment-upgrade-tooling',
    'l2-deployment-upgrade-tooling',
    'monitorism',
    'security',
    'automated-pause',
    'kubernetes-infrastructure',
    'cross-chain-messaging',
    'standard-bridge',
    'interoperable-message-passing',
    'hardhat',
    'foundry',
    'ethers',
    'viem',
    'supersim',
    'devnets',
    'mainnet',
    'testnet'
  ]
};

// Add interfaces for summary stats
interface AnalysisSummary {
  totalFiles: number;
  filesNeedingCategoryReview: number;
  filesNeedingContentTypeReview: number;
}

// Add error types
class MetadataAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MetadataAnalysisError';
  }
}

/**
 * Returns default personas for app developer content
 */
export function getDefaultPersonas(filepath: string): string[] {
  // Chain operator content
  if (filepath.includes('/chain-operators/')) {
    return ['chain-operator'];
  }
  
  // Node operator content
  if (filepath.includes('/node-operators/')) {
    return ['node-operator'];
  }
  
  // Default to app developer
  return ['app-developer'];
}

/**
 * Generates a topic from a title
 */
export function generateTopic(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'general';
}

/**
 * Enhanced landing page detection with Cards component awareness
 */
function isLandingPage(content: string, filepath: string, detectedPages: Set<string>): boolean {
  // If we've already detected this file, return false
  if (detectedPages.has(filepath)) {
    return false;
  }

  // Only consider root-level operator pages as landing pages
  const isOperatorLanding = filepath.endsWith('chain-operators.mdx') || 
                           filepath.endsWith('node-operators.mdx');

  // Only consider overview pages in first-level subdirectories
  const isOverviewPage = filepath.match(/\/operators\/[^/]+\/overview\.mdx$/);

  // Exclude deeper subdirectories from being landing pages
  const isTooDeep = (filepath.match(/\//g) || []).length > 3;

  const hasMultipleCards = content.includes('<Cards>') && 
                          content.includes('</Cards>') &&
                          (content.match(/<Card\s/g) || []).length > 1;

  // Exclude specific paths that look like landing pages but aren't
  const notLandingPage = [
    'get-started.mdx',
    'building-apps.mdx',
    'testing-apps.mdx',
    '/tutorials/',
    '/reference/',
    '/chain-env/',
    '/getting-started/'
  ].some(path => filepath.includes(path));

  const isLanding = (isOperatorLanding || (isOverviewPage && hasMultipleCards)) && !isTooDeep && !notLandingPage;

  if (isLanding) {
    detectedPages.add(filepath);
    console.log(`Landing page detected: ${filepath}`);
  }

  return isLanding;
}

/**
 * Get categories for landing pages based on their location and content
 */
function getLandingPageCategories(filepath: string, content: string): Set<string> {
  const categories = new Set<string>();
  
  // Add categories based on directory path
  if (filepath.includes('/bridging/')) {
    categories.add('standard-bridge');
    categories.add('interoperable-message-passing');
  }
  
  if (filepath.includes('/tutorials/')) {
    // Don't automatically add devnets to tutorial landing pages
    if (content.toLowerCase().includes('testnet') || 
        content.toLowerCase().includes('local development')) {
      categories.add('devnets');
    }
  }

  if (filepath.includes('/tools/')) {
    // Add relevant categories based on tool type
    if (filepath.includes('/build/')) {
      categories.add('hardhat');
      categories.add('foundry');
    }
    if (filepath.includes('/connect/')) {
      categories.add('ethers');
      categories.add('viem');
    }
  }

  if (filepath.includes('/supersim/')) {
    categories.add('supersim');
  }

  // Add categories based on content keywords
  if (content.toLowerCase().includes('security') || 
      content.toLowerCase().includes('secure')) {
    categories.add('security');
  }

  return categories;
}

// Helper functions for category detection
function detectStackCategories(filepath: string, content: string): Set<string> {
  const categories = new Set<string>();
  
  // Base protocol content
  if (filepath.match(/\/(rollup|transactions|components|differences|smart-contracts)\//)) {
    categories.add('protocol');
  }

  // Research and specs
  if (filepath.includes('/research/')) {
    categories.add('protocol');
    if (content.toLowerCase().includes('block time')) {
      categories.add('block-times');
    }
  }

  // Root stack pages
  if (filepath.match(/\/stack\/[^/]+\.mdx$/)) {
    if (filepath.endsWith('features.mdx') || filepath.endsWith('beta-features.mdx')) {
      categories.add('protocol');
      if (content.toLowerCase().includes('gas')) {
        categories.add('custom-gas-token');
      }
      if (content.toLowerCase().includes('data availability')) {
        categories.add('alt-da');
      }
    }

    // Core protocol pages
    if (['rollup.mdx', 'transactions.mdx', 'components.mdx', 'differences.mdx', 'smart-contracts.mdx']
        .some(file => filepath.endsWith(file))) {
      categories.add('protocol');
    }

    // Development pages
    if (['dev-node.mdx', 'getting-started.mdx', 'public-devnets.mdx']
        .some(file => filepath.endsWith(file))) {
      categories.add('devnets');
    }

    // Security pages
    if (filepath.endsWith('security.mdx')) {
      categories.add('security');
    }

    // Research pages
    if (['research.mdx', 'fact-sheet.mdx', 'design-principles.mdx']
        .some(file => filepath.endsWith(file))) {
      categories.add('protocol');
    }

    // Interop pages
    if (filepath.endsWith('interop.mdx')) {
      categories.add('interop');
      categories.add('cross-chain-messaging');
    }
  }

  return categories;
}

function detectOperatorCategories(filepath: string, content: string): Set<string> {
  const categories = new Set<string>();

  // Chain operator categories
  if (filepath.includes('/chain-operators/')) {
    categories.add('protocol');
    
    if (content.toLowerCase().includes('sequencer') ||
        content.toLowerCase().includes('batch') ||
        content.toLowerCase().includes('proposer')) {
      categories.add('sequencer');
      categories.add('op-batcher');
    }
    
    if (content.toLowerCase().includes('fault proof') ||
        content.toLowerCase().includes('challenger')) {
      categories.add('fault-proofs');
      categories.add('op-challenger');
    }

    if (content.toLowerCase().includes('deploy') ||
        content.toLowerCase().includes('genesis') ||
        content.toLowerCase().includes('configuration')) {
      categories.add('l1-deployment-upgrade-tooling');
      categories.add('l2-deployment-upgrade-tooling');
    }
  }

  // Node operator categories
  if (filepath.includes('/node-operators/')) {
    categories.add('infrastructure');
    
    if (content.toLowerCase().includes('rollup node') ||
        content.toLowerCase().includes('op-node')) {
      categories.add('rollup-node');
    }
    
    if (content.toLowerCase().includes('op-geth')) {
      categories.add('op-geth');
    }

    if (content.toLowerCase().includes('monitoring') ||
        content.toLowerCase().includes('metrics') ||
        content.toLowerCase().includes('health')) {
      categories.add('monitorism');
    }
  }

  return categories;
}

function detectAppDeveloperCategories(filepath: string, content: string): Set<string> {
  const categories = new Set<string>();

  if (filepath.includes('/app-developers/')) {
    // Bridging content
    if (filepath.includes('/bridging/') || 
        content.toLowerCase().includes('bridge') ||
        content.toLowerCase().includes('token transfer')) {
      categories.add('standard-bridge');
      categories.add('cross-chain-messaging');
    }

    // Tools content
    if (filepath.includes('/tools/')) {
      if (filepath.includes('/build/')) {
        categories.add('hardhat');
        categories.add('foundry');
      }
      if (filepath.includes('/connect/')) {
        categories.add('ethers');
        categories.add('viem');
      }
    }

    // SuperSim content
    if (filepath.includes('/supersim/')) {
      categories.add('supersim');
    }

    // Add devnets for tutorials
    if (filepath.includes('/tutorials/')) {
      categories.add('devnets');
    }
  }

  return categories;
}

function detectCommonCategories(content: string, filepath: string): Set<string> {
  const categories = new Set<string>();

  // Common infrastructure
  if (content.toLowerCase().includes('kubernetes') ||
      content.toLowerCase().includes('k8s')) {
    categories.add('kubernetes-infrastructure');
  }

  // Superchain content
  if (filepath.includes('/superchain/')) {
    if (filepath.includes('blockspace')) {
      categories.add('blockspace-charters');
    }
    if (filepath.includes('registry') || 
        filepath.includes('addresses') ||
        filepath.includes('networks')) {
      categories.add('superchain-registry');
    }
    if (content.toLowerCase().includes('security') ||
        content.toLowerCase().includes('privileged')) {
      categories.add('security-council');
    }
  }

  return categories;
}

/**
 * Detects categories based on content signals
 */
function detectCategories(
  content: string, 
  filepath: string, 
  detectionLog: string[],
  config: AnalyzerConfig
): string[] {
  const categories = new Set<string>();

  // Landing page categories
  if (isLandingPage(content, filepath, new Set())) {
    const landingCategories = getLandingPageCategories(filepath, content);
    landingCategories.forEach(category => categories.add(category));
  }

  // Stack categories
  if (filepath.includes('/stack/')) {
    const stackCategories = detectStackCategories(filepath, content);
    stackCategories.forEach(category => categories.add(category));
  }

  // Operator categories
  const operatorCategories = detectOperatorCategories(filepath, content);
  operatorCategories.forEach(category => categories.add(category));

  // App developer categories
  const appDevCategories = detectAppDeveloperCategories(filepath, content);
  appDevCategories.forEach(category => categories.add(category));

  // Common categories
  const commonCategories = detectCommonCategories(content, filepath);
  commonCategories.forEach(category => categories.add(category));

  // Sort by priority and limit categories
  const sortedCategories = Array.from(categories)
    .sort((a, b) => config.priorityOrder.indexOf(a) - config.priorityOrder.indexOf(b))
    .slice(0, config.maxCategories);

  return sortedCategories;
}

/**
 * Counts signals that indicate reference content
 */
function countReferenceSignals(content: string, filepath: string): number {
  let score = 0;
  
  // Technical content indicators
  score += (content.match(/\|.*\|/g) || []).length * 2; // Tables
  score += (content.match(/```[^`]+```/g) || []).length; // Code blocks
  score += (content.match(/\{.*?\}/g) || []).length; // Special syntax
  score += (content.match(/\b(API|RPC|SDK|JSON|HTTP|URL|ETH)\b/g) || []).length;
  
  // Reference structure indicators
  score += (content.match(/^Parameters:/gm) || []).length * 3;
  score += (content.match(/^Returns:/gm) || []).length * 3;
  score += (content.match(/^Type:/gm) || []).length * 2;
  score += (content.match(/^Endpoint:/gm) || []).length * 2;
  
  // API-specific indicators
  score += (content.match(/\bend?points?\b/gi) || []).length * 2;
  score += content.includes('## API Reference') ? 5 : 0;
  score += filepath.includes('/api/') ? 5 : 0;
  
  return score;
}

/**
 * Counts signals that indicate guide content
 */
function countGuideSignals(content: string): number {
  let score = 0;
  
  // Tutorial/How-to structure indicators
  score += content.includes('<Steps>') ? 5 : 0;
  score += content.toLowerCase().includes('how to') ? 3 : 0;
  score += (content.match(/^\d+\.\s/gm) || []).length * 2; // Numbered steps
  
  // Instructional content indicators
  score += (content.match(/^First|Next|Then|Finally/gm) || []).length * 2;
  score += (content.match(/you'll need to|you will need to|you need to/g) || []).length * 2;
  score += (content.match(/let's|we'll|we will/g) || []).length;
  
  // Explainer content indicators
  score += content.toLowerCase().includes('overview') ? 3 : 0;
  score += content.toLowerCase().includes('architecture') ? 3 : 0;
  score += content.toLowerCase().includes('understand') ? 2 : 0;
  score += content.toLowerCase().includes('concept') ? 2 : 0;
  score += (content.match(/\bis\b|\bare\b|\bmeans\b/g) || []).length;
  score += (content.match(/for example|such as|like/g) || []).length;
  score += (content.match(/consists of|composed of|comprises/g) || []).length;
  
  // Visual explanation indicators
  score += (content.match(/<Image|<Fig/g) || []).length * 2;
  score += (content.match(/```mermaid/g) || []).length * 2;
  
  return score;
}

/**
 * Detects content type based on content structure and signals
 */
function detectContentType(
  content: string, 
  detectionLog: string[], 
  filepath: string,
  detectedPages: Set<string>
): typeof VALID_CONTENT_TYPES[number] {
  // Check for landing pages first
  if (isLandingPage(content, filepath, detectedPages)) {
    return 'landing-page'
  }

  // Check for notices
  if (filepath.includes('/notices/')) {
    return 'notice'
  }

  // Check for tutorials
  if (filepath.includes('/tutorials/')) {
    return 'tutorial'
  }

  // Check for reference docs
  if (filepath.includes('/reference/')) {
    return 'reference'
  }

  // Default to guide
  return 'guide'
}

/**
 * Analyzes content to determine metadata
 */
export function analyzeContent(
  content: string, 
  filepath: string, 
  verbose: boolean = false,
  config: AnalyzerConfig = DEFAULT_CONFIG
): MetadataResult {
  // Validate inputs
  if (!filepath || typeof filepath !== 'string') {
    throw new MetadataAnalysisError('Invalid file path provided');
  }
  if (!content || typeof content !== 'string') {
    throw new MetadataAnalysisError('Invalid content provided');
  }
  if (typeof verbose !== 'boolean') {
    throw new MetadataAnalysisError('Invalid verbose flag provided');
  }

  const detectionLog: string[] = [];
  const warnings: string[] = [];
  const detectedPages = new Set<string>();
  
  try {
    const contentType = detectContentType(content, detectionLog, filepath, detectedPages);
    const categories = detectCategories(content, filepath, detectionLog, config);

    // Only track warnings if verbose mode is on
    if (contentType === 'NEEDS_REVIEW') {
      warnings.push('Content type needs manual review');
    }
    if (categories.length === 0) {
      warnings.push('Categories may need manual review');
    }

    // Only log if verbose mode is on
    if (verbose) {
      config.logger(`\n📄 ${filepath}`);
      config.logger(`   Type: ${contentType}`);
      config.logger(`   Categories: ${categories.length ? categories.join(', ') : 'none'}`);
      warnings.forEach(warning => {
        config.logger(`   ⚠️  ${warning}`);
      });
    }

    return {
      content_type: contentType as typeof VALID_CONTENT_TYPES[number],
      categories,
      detectionLog,
      title: config.defaultTitle,
      lang: config.defaultLang,
      description: config.defaultDescription,
      topic: generateTopic(config.defaultTitle),
      personas: getDefaultPersonas(filepath),
      is_imported_content: 'false'
    };
  } catch (error) {
    throw new MetadataAnalysisError(`Failed to analyze ${filepath}: ${error.message}`);
  }
}

/**
 * Prints a summary of the analysis results
 */
export function printSummary(summary: AnalysisSummary, config: AnalyzerConfig = DEFAULT_CONFIG): void {
  config.logger(`
Final Summary:
✓ Processed ${summary.totalFiles} files
⚠️  ${summary.filesNeedingCategoryReview} files may need category review
⚠️  ${summary.filesNeedingContentTypeReview} files may need content type review
(Dry run - no changes made)
`);
}

// Export for testing
export const testing = {
  DEFAULT_CONFIG,
  detectStackCategories,
  detectOperatorCategories,
  detectAppDeveloperCategories,
  detectCommonCategories,
  detectCategories,
  detectContentType,
  isLandingPage,
  getLandingPageCategories,
  MetadataAnalysisError
};