import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';

const rootDir = path.join(process.cwd(), 'pages');
const warnings: string[] = [];

// ANSI color codes
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Pages to exclude from checks
const excludedPages = [
  '400.mdx',
  '500.mdx',
  'index.mdx',
  '404.mdx',
  'console',
  'block-explorer',
  'bridge',
  'sdk',
  'faucet',
  'gas',
  'bug-bounty',
  'live-support',
  'governance',
  'changelog',
  'experimental'
];

// Paths to exclude from checks (full paths)
const excludedPaths = [
  '/builders/app-developers/tools/console',
  '/builders/tools/op-tools/block-explorer',
  '/builders/tools/op-tools/bridge',
  '/builders/tools/op-tools/sdk',
  '/builders/tools/op-tools/faucet',
  '/builders/tools/op-tools/console',
  '/builders/tools/op-tools/gas',
  '/chain/security/bug-bounty',
  '/connect/live-support',
  '/connect/governance',
  '/connect/resources/changelog',
  '/stack/--- Experimental'
];

interface MetaJson {
  [key: string]: {
    title?: string;
    display?: string;
  } | string;
}

function shouldExcludePage(pageName: string, fullPath: string): boolean {
  // Check if the page name is in excludedPages
  if (excludedPages.includes(pageName)) {
    return true;
  }

  // Check if the full path is in excludedPaths
  if (excludedPaths.includes(fullPath)) {
    return true;
  }

  // Skip pages with special characters or patterns
  if (pageName.includes('---') || pageName.startsWith('_')) {
    return true;
  }

  return false;
}

async function getMetaJsonPages(dirPath: string): Promise<string[]> {
  try {
    const metaPath = path.join(dirPath, '_meta.json');
    const metaContent = await fs.readFile(metaPath, 'utf-8');
    const meta: MetaJson = JSON.parse(metaContent);
    
    return Object.keys(meta).filter(key => 
      !excludedPages.includes(key) && 
      !key.startsWith('_') &&
      !key.includes('---') &&
      typeof meta[key] !== 'string'
    );
  } catch (error) {
    return [];
  }
}

async function getReferencedPagesFromBreadcrumb(breadcrumbPath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(breadcrumbPath, 'utf-8');
    const cardMatches = content.match(/<Card[^>]*href="([^"]+)"[^>]*>/g) || [];
    return cardMatches.map(match => {
      const hrefMatch = match.match(/href="([^"]+)"/);
      return hrefMatch ? hrefMatch[1] : '';
    }).filter(Boolean);
  } catch (error) {
    return [];
  }
}

async function checkDirectory(dirPath: string): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
      const folderPath = path.join(dirPath, entry.name);
      const breadcrumbPath = path.join(dirPath, `${entry.name}.mdx`);
      
      const metaPages = await getMetaJsonPages(folderPath);
      const referencedPages = await getReferencedPagesFromBreadcrumb(breadcrumbPath);
      
      for (const page of metaPages) {
        const expectedPath = `/${path.relative(rootDir, folderPath)}/${page}`;
        const normalizedExpectedPath = expectedPath.replace(/\\/g, '/');
        
        // Skip if the page or path should be excluded
        if (shouldExcludePage(page, normalizedExpectedPath)) {
          continue;
        }

        if (!referencedPages.some(ref => ref.endsWith(page))) {
          const humanReadableName = page.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          warnings.push(
            `Page "${humanReadableName}" (${normalizedExpectedPath}) is in _meta.json but not referenced in the breadcrumb file ${entry.name}.mdx`
          );
        }
      }
      
      await checkDirectory(folderPath);
    }
  }
}

async function main() {
  try {
    await checkDirectory(rootDir);
    
    if (warnings.length > 0) {
      console.log(`${YELLOW}${BOLD}Missing pages in breadcrumb navigation:${RESET}`);
      warnings.forEach(warning => console.log(`${YELLOW}- ${warning}${RESET}`));
      process.exit(1);
    } else {
      console.log('All pages listed in _meta.json are properly referenced in their breadcrumb files.');
    }
  } catch (error) {
    console.log(`${YELLOW}${BOLD}Error checking breadcrumbs:${RESET}`, error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error in main process:', error);
  process.exit(1);
});
