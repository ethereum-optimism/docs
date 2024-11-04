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
  '404.mdx'
];

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
  const currentDir = path.basename(dirPath);
  
  // Skip the root directory check
  if (dirPath !== rootDir) {
    const breadcrumbPath = path.join(dirPath, `${currentDir}.mdx`);
    const referencedPages = await getReferencedPagesFromBreadcrumb(breadcrumbPath);

    // Check all .mdx and .md files in the current directory
    for (const entry of entries) {
      if (entry.isFile() && 
          (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) &&
          !excludedPages.includes(entry.name) &&
          entry.name !== `${currentDir}.mdx`) {
        
        const pageName = entry.name.replace(/\.(md|mdx)$/, '');
        // Dynamically construct the path relative to the pages directory
        const relativePath = '/' + path.relative(rootDir, path.join(dirPath, pageName))
          .replace(/\\/g, '/');
        
        if (!referencedPages.includes(relativePath)) {
          const humanReadableName = pageName.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          warnings.push(
            `Page "${humanReadableName}" at path "${relativePath}" is not listed in the breadcrumb navigation of ${currentDir}.mdx`
          );
        }
      }
    }
  }

  // Process subdirectories
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
      await checkDirectory(path.join(dirPath, entry.name));
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
      console.log('All pages are properly listed in their respective breadcrumb navigation files.');
    }
  } catch (error) {
    console.log(`${YELLOW}${BOLD}Error checking breadcrumbs:${RESET}`, error);
    process.exit(1);
  }
}

main();