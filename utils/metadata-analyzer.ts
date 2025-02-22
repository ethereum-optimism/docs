import fs from 'fs'
import path from 'path'
import { MetadataResult, VALID_CATEGORIES, VALID_CONTENT_TYPES } from './types/metadata-types'

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

// Fix duplicate landing page detection
let detectedLandingPages = new Set<string>();

/**
 * Enhanced landing page detection with Cards component awareness
 */
function isLandingPage(content: string, filepath: string): boolean {
  // If we've already detected this file, return false
  if (detectedLandingPages.has(filepath)) {
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
    detectedLandingPages.add(filepath);
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

/**
 * Detects categories based on content signals
 */
function detectCategories(content: string, filepath: string, detectionLog: string[]): string[] {
  detectionLog.push(`Analyzing categories for: ${filepath}`);
  
  const categories = new Set<string>();

  // Connect section categories
  if (filepath.includes('/connect/')) {
    if (filepath.includes('/contribute/')) {
      if (filepath.includes('docs-contribute')) {
        categories.add('typescript');
        categories.add('javascript');
      }
      if (filepath.includes('stack-contribute')) {
        categories.add('go');
        categories.add('rust');
      }
    }
    if (filepath.includes('/resources/')) {
      categories.add('protocol');
    }
    return Array.from(categories);
  }

  // Notice categories
  if (filepath.includes('/notices/')) {
    if (filepath.includes('holocene')) {
      categories.add('holocene');
      categories.add('network-upgrade');
    }
    if (filepath.includes('pectra')) {
      categories.add('security');
      categories.add('protocol');
    }
    if (filepath.includes('sdk')) {
      categories.add('typescript');
      categories.add('javascript');
    }
    return Array.from(categories);
  }

  // Get started categories
  if (filepath.includes('/get-started/')) {
    if (filepath.includes('interop')) {
      categories.add('interop');
      categories.add('cross-chain-messaging');
    }
    if (filepath.includes('op-stack')) {
      categories.add('protocol');
      categories.add('devnets');
    }
    if (filepath.includes('superchain')) {
      categories.add('blockspace-charters');
      categories.add('superchain-registry');
    }
    return Array.from(categories);
  }

  // Stack-specific categories
  if (filepath.includes('/stack/')) {
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
      // Landing pages
      if (filepath.endsWith('features.mdx') || 
          filepath.endsWith('beta-features.mdx')) {
        categories.add('protocol');
        if (content.toLowerCase().includes('gas')) {
          categories.add('custom-gas-token');
        }
        if (content.toLowerCase().includes('data availability')) {
          categories.add('alt-da');
        }
      }

      // Core protocol pages
      if (filepath.endsWith('rollup.mdx') ||
          filepath.endsWith('transactions.mdx') ||
          filepath.endsWith('components.mdx') ||
          filepath.endsWith('differences.mdx') ||
          filepath.endsWith('smart-contracts.mdx')) {
        categories.add('protocol');
      }

      // Development pages
      if (filepath.endsWith('dev-node.mdx') ||
          filepath.endsWith('getting-started.mdx') ||
          filepath.endsWith('public-devnets.mdx')) {
        categories.add('devnets');
      }

      // Security pages
      if (filepath.endsWith('security.mdx')) {
        categories.add('security');
      }

      // Research pages
      if (filepath.endsWith('research.mdx') ||
          filepath.endsWith('fact-sheet.mdx')) {
        categories.add('protocol');
      }

      // Design pages
      if (filepath.endsWith('design-principles.mdx')) {
        categories.add('protocol');
      }

      // Interop pages
      if (filepath.endsWith('interop.mdx')) {
        categories.add('interop');
        categories.add('cross-chain-messaging');
      }
    }

    // Rollup content
    if (filepath.includes('/rollup/')) {
      categories.add('protocol');
      categories.add('rollup-node');
      if (content.toLowerCase().includes('sequencer')) {
        categories.add('sequencer');
      }
    }

    // Features and beta features
    if (filepath.includes('/features/') || filepath.includes('/beta-features/')) {
      categories.add('protocol');
      if (content.toLowerCase().includes('gas')) {
        categories.add('custom-gas-token');
      }
      if (content.toLowerCase().includes('data availability')) {
        categories.add('alt-da');
      }
    }

    // Interop content
    if (filepath.includes('/interop/')) {
      categories.add('interop');
      categories.add('cross-chain-messaging');
      if (content.toLowerCase().includes('supervisor')) {
        categories.add('op-supervisor');
      }
      if (content.toLowerCase().includes('bridge') || 
          content.toLowerCase().includes('erc20')) {
        categories.add('interoperable-assets');
      }
    }

    // Fault proof content
    if (filepath.includes('/fault-proofs/') || content.toLowerCase().includes('fault proof')) {
      categories.add('fault-proofs');
      categories.add('op-challenger');
      if (content.toLowerCase().includes('cannon')) {
        categories.add('cannon');
      }
    }

    // Protocol content
    if (filepath.includes('/protocol/')) {
      categories.add('protocol');
      if (content.toLowerCase().includes('sequencer')) {
        categories.add('sequencer');
      }
      if (content.toLowerCase().includes('batcher')) {
        categories.add('op-batcher');
      }
      if (content.toLowerCase().includes('derivation')) {
        categories.add('rollup-node');
      }
    }

    // Bridge content
    if (filepath.includes('/bridge/')) {
      categories.add('standard-bridge');
      categories.add('cross-chain-messaging');
      if (content.toLowerCase().includes('message passing')) {
        categories.add('interoperable-message-passing');
      }
    }

    // Security content
    if (filepath.includes('/security/')) {
      categories.add('security');
      if (content.toLowerCase().includes('pause')) {
        categories.add('automated-pause');
      }
    }

    // Node content
    if (filepath.includes('/node/')) {
      categories.add('rollup-node');
      categories.add('op-geth');
      if (content.toLowerCase().includes('derivation')) {
        categories.add('protocol');
      }
    }

    // Transaction content
    if (filepath.includes('/transactions/')) {
      categories.add('protocol');
      if (content.toLowerCase().includes('cross') || 
          content.toLowerCase().includes('deposit') ||
          content.toLowerCase().includes('withdrawal')) {
        categories.add('cross-chain-messaging');
      }
    }

    return Array.from(categories);
  }

  // App developer categories - simpler version
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

    return Array.from(categories);
  }

  // Chain operator categories - keep existing logic
  if (filepath.endsWith('chain-operators.mdx')) {
    categories.add('protocol');
    categories.add('sequencer');
    categories.add('op-batcher');
    categories.add('fault-proofs');
    categories.add('op-challenger');
    return Array.from(categories);
  }

  if (filepath.endsWith('node-operators.mdx')) {
    categories.add('infrastructure');
    categories.add('rollup-node');
    categories.add('op-geth');
    categories.add('monitorism');
    return Array.from(categories);
  }

  // Chain operator content
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

  // Node operator content
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

  // Common categories
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

  // Limit to 5 most relevant categories
  const priorityOrder = [
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
  ];

  const sortedCategories = Array.from(categories)
    .sort((a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b))
    .slice(0, 5);

  detectionLog.push(`Final categories: ${sortedCategories.join(', ')}`);
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
function detectContentType(content: string, detectionLog: string[], filepath: string): typeof VALID_CONTENT_TYPES[number] {
  // Check for landing pages first
  if (isLandingPage(content, filepath)) {
    detectionLog.push("Detected as landing page based on structure");
    return 'landing-page';
  }

  // Check for configuration content
  if (filepath.includes('/configuration/') || 
      filepath.match(/config\.(mdx?|tsx?)$/)) {
    detectionLog.push("Detected as reference based on configuration content");
    return 'reference';
  }

  // Check for overview/landing pages
  if (filepath.match(/\/(overview|index)\.(mdx?|tsx?)$/) ||
      filepath.endsWith('chain-operators.mdx') ||
      filepath.endsWith('node-operators.mdx') ||
      filepath.endsWith('tools.mdx') ||
      filepath.endsWith('features.mdx')) {
    detectionLog.push("Detected as landing page based on path");
    return 'landing-page';
  }

  // Check for tutorials
  if (filepath.includes('/tutorials/') || 
      content.toLowerCase().includes('step-by-step') ||
      content.match(/Step \d+:/g)) {
    detectionLog.push("Detected as tutorial based on content structure");
    return 'tutorial';
  }

  // Check for troubleshooting content
  if (filepath.includes('/troubleshooting') || 
      content.toLowerCase().includes('common problems') ||
      content.toLowerCase().includes('common issues') ||
      (content.match(/problem:|solution:|error:|warning:/gi) || []).length > 2) {
    detectionLog.push("Detected as troubleshooting content");
    return 'troubleshooting';
  }

  // Check for notices/announcements
  if (content.toLowerCase().includes('breaking change') ||
      content.toLowerCase().includes('deprecation notice') ||
      content.toLowerCase().includes('upgrade notice')) {
    detectionLog.push("Detected as technical notice");
    return 'notice';
  }

  // Reference vs Guide scoring
  const referenceScore = countReferenceSignals(content, filepath);
  const guideScore = countGuideSignals(content);

  if (referenceScore > guideScore * 1.5) {
    detectionLog.push(`Detected as reference (scores: ref=${referenceScore}, guide=${guideScore})`);
    return 'reference';
  }

  detectionLog.push(`Detected as guide (scores: ref=${referenceScore}, guide=${guideScore})`);
  return 'guide';
}

/**
 * Analyzes content to determine metadata
 */
export function analyzeContent(content: string, filepath: string, verbose: boolean = false): MetadataResult {
  const detectionLog: string[] = [];
  const warnings: string[] = [];
  
  const contentType = detectContentType(content, detectionLog, filepath);
  const categories = detectCategories(content, filepath, detectionLog);

  // Track files needing review
  if (contentType === 'NEEDS_REVIEW') {
    warnings.push('Content type needs manual review');
    global.filesNeedingContentTypeReview = (global.filesNeedingContentTypeReview || 0) + 1;
  }
  if (categories.length === 0) {
    warnings.push('Categories may need manual review');
    global.filesNeedingCategoryReview = (global.filesNeedingCategoryReview || 0) + 1;
  }
  
  // Track total files processed
  global.totalFiles = (global.totalFiles || 0) + 1;

  if (verbose) {
    console.log(`\n📄 ${filepath}`);
    console.log(`   Type: ${contentType}`);
    console.log(`   Categories: ${categories.length ? categories.join(', ') : 'none'}`);
    warnings.forEach(warning => {
      console.log(`   ⚠️  ${warning}`);
    });
  }

  return {
    content_type: contentType as typeof VALID_CONTENT_TYPES[number],
    categories,
    detectionLog,
    title: '',
    lang: 'en-US',
    description: '',
    topic: '',
    personas: getDefaultPersonas(filepath),
    is_imported_content: 'false'
  };
}

// Export the summary function to be called at the end of processing
export function printSummary(): void {
  console.log(`
Final Summary:
✓ Processed ${global.totalFiles} files
⚠️  ${global.filesNeedingCategoryReview || 0} files may need category review
⚠️  ${global.filesNeedingContentTypeReview || 0} files may need content type review
(Dry run - no changes made)
`);
}