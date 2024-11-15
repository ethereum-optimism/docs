import * as fs from 'fs/promises';
import * as path from 'path';

const rootDir = path.join(process.cwd(), 'pages');
const redirectsPath = path.join(process.cwd(), 'public', '_redirects');
const updates: string[] = [];

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
  skipped: number;
}

async function getRedirects(): Promise<Redirect[]> {
  const content = await fs.readFile(redirectsPath, 'utf-8');
  return content.split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const [from, to] = line.split(/\s+/);
      return { from, to };
    });
}

async function findMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      files.push(...await findMdxFiles(fullPath));
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function fixFile(filePath: string, redirects: Redirect[]): Promise<boolean> {
  let content = await fs.readFile(filePath, 'utf-8');
  let hasChanges = false;
  const relativeFilePath = path.relative(rootDir, filePath);

  redirects.forEach(redirect => {
    const markdownRegex = new RegExp(`\\[([^\\]]+)\\]\\(${redirect.from}\\)`, 'g');
    const hrefRegex = new RegExp(`href="${redirect.from}"`, 'g');

    if (content.match(markdownRegex) || content.match(hrefRegex)) {
      content = content
        .replace(markdownRegex, `[$1](${redirect.to})`)
        .replace(hrefRegex, `href="${redirect.to}"`);
      
      updates.push(`${WHITE}Fixed in "${relativeFilePath}": ${YELLOW}${redirect.from}${WHITE} → ${GREEN}${redirect.to}${RESET}`);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    await fs.writeFile(filePath, content);
  }
  
  return hasChanges;
}

function printSummary(summary: Summary) {
  console.log('\nSummary:');
  console.log(`${WHITE}Total files 🔍 - ${summary.total}`);
  console.log(`${GREEN}Files fixed ✅ - ${summary.fixed}`);
  console.log(`${WHITE}Files skipped ⏭️  - ${summary.skipped}${RESET}`);
}

async function main() {
  const summary: Summary = {
    total: 0,
    fixed: 0,
    skipped: 0
  };

  console.log('Starting to fix redirect links...');
  console.log('Root directory:', rootDir);

  try {
    const redirects = await getRedirects();
    const files = await findMdxFiles(rootDir);
    
    summary.total = files.length;

    for (const file of files) {
      const wasFixed = await fixFile(file, redirects);
      if (wasFixed) {
        summary.fixed++;
      } else {
        summary.skipped++;
      }
    }

    if (updates.length > 0) {
      console.log(`${GREEN}${BOLD}Fixed links:${RESET}`);
      updates.forEach(update => console.log(update));
      printSummary(summary);
    } else {
      console.log(`${GREEN}No broken links found. Everything is up to date.${RESET}`);
      printSummary(summary);
    }
  } catch (error) {
    console.error(`${YELLOW}${BOLD}Error fixing redirects:${RESET}`, error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${YELLOW}${BOLD}Error in main process:${RESET}`, error);
  process.exit(1);
});