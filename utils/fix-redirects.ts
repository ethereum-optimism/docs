import * as fs from 'fs/promises';
import * as path from 'path';

const rootDir = path.join(process.cwd(), 'pages');
const redirectsPath = path.join(process.cwd(), 'public', '_redirects');
const fixed: string[] = [];

// ANSI color codes
const WHITE = '\x1b[37m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

interface Redirect {
  from: string;
  to: string;
}

interface Summary {
  total: number;
  fixed: number;
  unchanged: number;
}

async function getRedirects(): Promise<Redirect[]> {
  try {
    const content = await fs.readFile(redirectsPath, 'utf-8');
    return content.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const [from, to] = line.split(/\s+/);
        return { from, to };
      });
  } catch (error) {
    console.error(`${YELLOW}${BOLD}Error reading redirects file:${RESET}`, error);
    return [];
  }
}

async function findMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('_')) {
        files.push(...await findMdxFiles(fullPath));
      } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`${YELLOW}${BOLD}Error reading directory ${dir}:${RESET}`, error);
  }
  
  return files;
}

async function fixFile(filePath: string, redirects: Redirect[]): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const relativeFilePath = path.relative(rootDir, filePath);
    let fileChanged = false;

    // Fix markdown links - [text](link)
    redirects.forEach(redirect => {
      const markdownLinkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${redirect.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      if (markdownLinkRegex.test(content)) {
        content = content.replace(markdownLinkRegex, `[$1](${redirect.to})`);
        fixed.push(`${WHITE}Fixed in "${relativeFilePath}": ${YELLOW}"${redirect.from}"${WHITE} → ${GREEN}"${redirect.to}"${RESET}`);
        fileChanged = true;
      }
    });

    // Fix HTML links - href="link"
    redirects.forEach(redirect => {
      const hrefRegex = new RegExp(`href="${redirect.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
      if (hrefRegex.test(content)) {
        content = content.replace(hrefRegex, `href="${redirect.to}"`);
        fixed.push(`${WHITE}Fixed in "${relativeFilePath}": ${YELLOW}"${redirect.from}"${WHITE} → ${GREEN}"${redirect.to}"${RESET}`);
        fileChanged = true;
      }
    });

    if (fileChanged) {
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`${YELLOW}${BOLD}Error fixing file ${filePath}:${RESET}`, error);
    return false;
  }
}

function printSummary(summary: Summary) {
  console.log('\nSummary:');
  console.log(`${WHITE}Total pages checked 🔍 - ${summary.total}`);
  console.log(`${GREEN}Pages fixed ✅ - ${summary.fixed}`);
  console.log(`${WHITE}Pages unchanged ⏩ - ${summary.unchanged}${RESET}`);
}

async function main() {
  const summary: Summary = {
    total: 0,
    fixed: 0,
    unchanged: 0
  };

  console.log('Starting automatic redirect fix...');
  console.log('Root directory:', rootDir);

  try {
    // Check if directories exist
    try {
      await fs.access(rootDir);
    } catch (error) {
      console.error(`${YELLOW}${BOLD}Error: Root directory not found at ${rootDir}${RESET}`);
      console.log('Current working directory:', process.cwd());
      process.exit(1);
    }

    try {
      await fs.access(redirectsPath);
    } catch (error) {
      console.error(`${YELLOW}${BOLD}Error: Redirects file not found at ${redirectsPath}${RESET}`);
      process.exit(1);
    }

    const redirects = await getRedirects();
    console.log(`Loaded ${redirects.length} redirects from ${redirectsPath}`);
    
    const files = await findMdxFiles(rootDir);
    console.log(`Found ${files.length} MDX files to check`);
    
    summary.total = files.length;

    for (const file of files) {
      const wasFixed = await fixFile(file, redirects);
      if (wasFixed) {
        summary.fixed++;
      } else {
        summary.unchanged++;
      }
    }

    if (fixed.length > 0) {
      console.log(`${GREEN}${BOLD}Fixed ${fixed.length} outdated links:${RESET}`);
      fixed.forEach(message => console.log(message));
    } else {
      console.log(`${GREEN}All internal links are already up to date.${RESET}`);
    }
    
    printSummary(summary);
  } catch (error) {
    console.error(`${YELLOW}${BOLD}Error fixing redirects:${RESET}`, error);
    process.exit(1);
  }
}

// Execute the script
main().catch(error => {
  console.error(`${YELLOW}${BOLD}Error in main process:${RESET}`, error);
  process.exit(1);
});