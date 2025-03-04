import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { MetadataResult, VALID_CATEGORIES, VALID_CONTENT_TYPES } from './types/metadata-types'

// Load YAML config
const yamlConfig = yaml.load(fs.readFileSync('keywords.config.yaml', 'utf8')) as {
  metadata_rules: {
    categories: {
      values: string[];
      file_patterns: {
        superchain_registry: string[];
        security_council: string[];
      };
    };
  };
};

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
 * Detects title from content by finding first h1 heading
 */
function detectTitle(content: string, filepath: string): string {
  // Try to find first h1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fallback to filename without extension
  const filename = path.basename(filepath, '.mdx');
  return filename
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Returns default personas based on content location and content analysis
 */
export function getDefaultPersonas(filepath: string, content: string = ''): string[] {
  const contentLower = content.toLowerCase()
  
  // Stack documentation is primarily for protocol developers and chain operators
  if (filepath.includes('/stack/')) {
    const personas = new Set<string>(['protocol-developer'])
    
    // Add chain-operator for operational content
    if (
      filepath.includes('/security/') ||
      filepath.includes('/rollup/') ||
      filepath.includes('/transactions/') ||
      contentLower.includes('operator') ||
      contentLower.includes('deployment') ||
      contentLower.includes('configuration') ||
      contentLower.includes('monitoring') ||
      contentLower.includes('maintenance')
    ) {
      personas.add('chain-operator')
    }

    // Add app-developer only for specific integration content
    if (
      filepath.includes('/interop/tutorials/') ||
      filepath.includes('/interop/tools/') ||
      filepath.includes('/getting-started') ||
      contentLower.includes('tutorial') ||
      contentLower.includes('guide') ||
      contentLower.includes('sdk') ||
      contentLower.includes('api')
    ) {
      personas.add('app-developer')
    }

    // Remove debug logging
    return Array.from(personas)
  }
  
  // Superchain content
  if (filepath.includes('/superchain/')) {
    const filename = path.basename(filepath);
    
    // Registry files are for chain operators
    const registryFiles = ['networks.mdx', 'addresses.mdx', 'registry.mdx', 'tokenlist.mdx', 'superchain-registry.mdx'];
    if (registryFiles.includes(filename)) {
      return ['chain-operator'];
    }
    
    // Security files are for chain operators
    const securityFiles = ['privileged-roles.mdx', 'standard-configuration.mdx'];
    if (securityFiles.includes(filename)) {
      return ['chain-operator'];
    }

    // Blockspace charter is for chain operators
    if (filename.includes('blockspace-charter')) {
      return ['chain-operator'];
    }

    // Default superchain content is for all personas
    return ['app-developer', 'chain-operator', 'node-operator'];
  }
  
  // Chain operator content
  if (filepath.includes('/chain-operators/')) {
    return ['chain-operator'];
  }
  
  // Node operator content
  if (filepath.includes('/node-operators/')) {
    return ['node-operator'];
  }
  
  // Default to app developer for other content
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
    addValidCategory(categories, 'standard-bridge');
    addValidCategory(categories, 'interoperable-message-passing');
  }
  
  if (filepath.includes('/tutorials/')) {
    // Don't automatically add devnets to tutorial landing pages
    if (content.toLowerCase().includes('testnet') || 
        content.toLowerCase().includes('local development')) {
      addValidCategory(categories, 'devnets');
    }
  }

  if (filepath.includes('/tools/')) {
    // Add relevant categories based on tool type
    if (filepath.includes('/build/')) {
      addValidCategory(categories, 'hardhat');
      addValidCategory(categories, 'foundry');
    }
    if (filepath.includes('/connect/')) {
      addValidCategory(categories, 'ethers');
      addValidCategory(categories, 'viem');
    }
  }

  if (filepath.includes('/supersim/')) {
    addValidCategory(categories, 'supersim');
  }

  // Add categories based on content keywords
  if (content.toLowerCase().includes('security') || 
      content.toLowerCase().includes('secure')) {
    addValidCategory(categories, 'security');
  }

  return categories;
}

/**
 * Validates that a category is in the allowed list
 */
function isValidCategory(category: string): boolean {
  return yamlConfig.metadata_rules.categories.values.includes(category);
}

/**
 * Adds a category if it's valid
 */
function addValidCategory(categories: Set<string>, category: string): void {
  if (isValidCategory(category)) {
    categories.add(category);
  }
}

// Helper functions for category detection
function detectStackCategories(filepath: string, content: string): Set<string> {
  const categories = new Set<string>();
  
  if (filepath.includes('/superchain/')) {
    const filename = path.basename(filepath);
    
    // Registry files
    const registryFiles = ['networks.mdx', 'addresses.mdx', 'registry.mdx', 'tokenlist.mdx', 'superchain-registry.mdx'];
    if (registryFiles.includes(filename)) {
      addValidCategory(categories, 'superchain-registry');
    }

    // Protocol and security files
    const securityFiles = ['privileged-roles.mdx', 'standard-configuration.mdx'];
    if (securityFiles.includes(filename)) {
      addValidCategory(categories, 'protocol');
      addValidCategory(categories, 'security');
    }

    // Blockspace charter
    if (filename.includes('blockspace-charter')) {
      addValidCategory(categories, 'blockspace-charters');
    }

    // Network types based on content
    const contentLower = content.toLowerCase();
    if (contentLower.includes('mainnet')) {
      addValidCategory(categories, 'mainnet');
    }
    if (contentLower.includes('testnet') || contentLower.includes('sepolia')) {
      addValidCategory(categories, 'testnet');
    }
  }

  return categories;
}

function detectOperatorCategories(filepath: string, content: string): Set<string> {
  const categories = new Set<string>();

  // Chain operator categories
  if (filepath.includes('/chain-operators/')) {
    addValidCategory(categories, 'protocol');
    
    if (content.toLowerCase().includes('sequencer') ||
        content.toLowerCase().includes('batch') ||
        content.toLowerCase().includes('proposer')) {
      addValidCategory(categories, 'sequencer');
      addValidCategory(categories, 'op-batcher');
    }
    
    if (content.toLowerCase().includes('fault proof') ||
        content.toLowerCase().includes('challenger')) {
      addValidCategory(categories, 'fault-proofs');
      addValidCategory(categories, 'op-challenger');
    }

    if (content.toLowerCase().includes('deploy') ||
        content.toLowerCase().includes('genesis') ||
        content.toLowerCase().includes('configuration')) {
      addValidCategory(categories, 'l1-deployment-upgrade-tooling');
      addValidCategory(categories, 'l2-deployment-upgrade-tooling');
    }
  }

  // Node operator categories
  if (filepath.includes('/node-operators/')) {
    addValidCategory(categories, 'infrastructure');
    
    if (content.toLowerCase().includes('rollup node') ||
        content.toLowerCase().includes('op-node')) {
      addValidCategory(categories, 'rollup-node');
    }
    
    if (content.toLowerCase().includes('op-geth')) {
      addValidCategory(categories, 'op-geth');
    }

    if (content.toLowerCase().includes('monitoring') ||
        content.toLowerCase().includes('metrics') ||
        content.toLowerCase().includes('health')) {
      addValidCategory(categories, 'monitorism');
    }
  }

  return categories;
}

function detectAppDeveloperCategories(filepath: string, content: string): Set<string> {
  const categories = new Set<string>();

  if (filepath.includes('/app-developers/')) {
    // Extract potential category from directory name
    const pathParts = filepath.split('/');
    const directoryCategory = pathParts[pathParts.length - 2]; // Get parent directory name
    
    // Only add if it exists in config
    if (yamlConfig.metadata_rules.categories.values.includes(directoryCategory)) {
      categories.add(directoryCategory);
    }

    // Tools content
    if (filepath.includes('/tools/')) {
      if (filepath.includes('/build/')) {
        addValidCategory(categories, 'devops-tooling');
        addValidCategory(categories, 'testnet-tooling');
        
        // Add monitoring/analytics for relevant tools
        if (content.toLowerCase().includes('monitor') || 
            content.toLowerCase().includes('analytics') ||
            content.toLowerCase().includes('explorer')) {
          addValidCategory(categories, 'monitoring');
          addValidCategory(categories, 'analytics');
        }
      }
      
      if (filepath.includes('/connect/')) {
        addValidCategory(categories, 'infrastructure');
      }
    }
  }
  return categories;
}

function detectCommonCategories(content: string, filepath: string): Set<string> {
  const categories = new Set<string>();

  // Common infrastructure
  if (content.toLowerCase().includes('kubernetes') ||
      content.toLowerCase().includes('k8s')) {
    addValidCategory(categories, 'kubernetes-infrastructure');
  }

  // Network types
  if (content.toLowerCase().includes('mainnet')) {
    addValidCategory(categories, 'mainnet');
  }
  if (content.toLowerCase().includes('testnet') ||
      content.toLowerCase().includes('sepolia')) {
    addValidCategory(categories, 'testnet');
  }

  return categories;
}

/**
 * Detects categories based on content signals
 */
function detectCategories(content: string, filepath: string, detectionLog: string[]): string[] {
  const categories = new Set<string>()
  
  // Add categories based on content keywords
  if (content.toLowerCase().includes('mainnet')) {
    categories.add('mainnet')
  }
  if (content.toLowerCase().includes('testnet') || content.toLowerCase().includes('devnet')) {
    categories.add('testnet')
  }
  
  // Add categories based on filepath
  if (filepath.includes('/security/')) {
    categories.add('security')
  }
  if (filepath.includes('/fault-proofs/')) {
    categories.add('protocol')
  }
  if (filepath.includes('/interop/')) {
    categories.add('protocol')
  }
  if (filepath.includes('/transactions/')) {
    categories.add('protocol')
  }
  
  // Always include protocol for stack documentation
  if (filepath.includes('/stack/')) {
    categories.add('protocol')
  }
  
  detectionLog.push(`Detected categories: ${Array.from(categories).join(', ')}`)
  return Array.from(categories)
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
  try {
    // Initialize detection tracking
    const detectionLog: string[] = [];
    const detectedPages = new Set<string>();

    // Get current values and suggestions
    const title = detectTitle(content, filepath);
    const topic = generateTopic(title);
    const personas = getDefaultPersonas(filepath, content);
    const contentType = detectContentType(content, detectionLog, filepath, detectedPages);
    const categories = detectCategories(content, filepath, detectionLog);

    detectionLog.push(`Detected personas: ${personas.join(', ')}`);

    // Return MetadataResult with empty required fields for validation
    return {
      title: title,
      lang: config.defaultLang,
      description: config.defaultDescription,
      content_type: '',  // Empty for validation
      topic: '',         // Empty for validation
      personas: [],      // Empty for validation
      categories: [],    // Empty for validation
      is_imported_content: 'false',
      detectionLog,
      suggestions: {     
        content_type: contentType,
        categories: categories,
        topic: topic,
        personas: personas  // Make sure this is being used
      }
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