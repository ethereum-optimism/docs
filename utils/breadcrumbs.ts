import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';

const rootDir: string = path.join(__dirname, '..', 'pages');
const warnings: string[] = [];

// ANSI color codes
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

interface FileInfo {
  title: string;
  url: string;
  description?: string;
  content: string;
}

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

async function getContentFiles(folderPath: string): Promise<FileInfo[]> {
  const files = await fs.readdir(folderPath, { withFileTypes: true });
  const fileInfos: FileInfo[] = [];
  const folderName = path.basename(folderPath);

  for (const file of files) {
    if (file.name.startsWith('_') || 
        file.name.startsWith('.') || 
        excludedPages.includes(file.name)) {
      continue;
    }

    const filePath = path.join(folderPath, file.name);

    if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.mdx'))) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { data: frontMatter } = matter(content);
        const fileName = path.basename(file.name, path.extname(file.name));
        const fileTitle = frontMatter.title || fileName;
        const relativeUrl = `/${path.relative(rootDir, filePath)}`.replace(/\.(md|mdx)$/, '');

        fileInfos.push({
          title: fileTitle,
          url: relativeUrl,
          description: frontMatter.description,
          content: content
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
  }

  return fileInfos;
}

async function getBreadcrumbCards(breadcrumbPath: string): Promise<Set<string>> {
  try {
    const content = await fs.readFile(breadcrumbPath, 'utf-8');
    const cardMatches = content.match(/<Card[^>]*href="([^"]+)"[^>]*>/g) || [];
    return new Set(
      cardMatches.map(match => {
        const hrefMatch = match.match(/href="([^"]+)"/);
        return hrefMatch ? hrefMatch[1] : '';
      }).filter(Boolean)
    );
  } catch (error) {
    return new Set();
  }
}

async function checkDirectory(dirPath: string): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
      const folderPath = path.join(dirPath, entry.name);
      const breadcrumbPath = path.join(dirPath, `${entry.name}.mdx`);

      // Get all content files in the folder
      const files = await getContentFiles(folderPath);
      
      // Get existing cards in breadcrumb
      const existingCards = await getBreadcrumbCards(breadcrumbPath);

      // Check for missing pages
      files.forEach(({ title, url }) => {
        if (!existingCards.has(url)) {
          warnings.push(
            `Page "${title}" at ${url} needs to be added to the breadcrumb file ${entry.name}.mdx`
          );
        }
      });

      // Recursively check subdirectories
      await checkDirectory(folderPath);
    }
  }
}

async function main() {
  console.log('Starting breadcrumb check process...');
  console.log('Root directory:', rootDir);

  try {
    // Process main sections: builders, chain, connect, stack
    const mainSections = ['app-developers', 'operators', 'superchain', 'stack'];
    for (const section of mainSections) {
      const sectionPath = path.join(rootDir, section);
      try {
        await fs.access(sectionPath);
        await checkDirectory(sectionPath);
        console.log(`Completed checking ${section} section`);
      } catch (error) {
        console.log(`Skipping ${section} - directory not found`);
      }
    }

    if (warnings.length > 0) {
      console.log(`${YELLOW}${BOLD}Missing pages in breadcrumb navigation:${RESET}`);
      warnings.forEach(warning => console.log(`${YELLOW}- ${warning}${RESET}`));
      process.exit(1);
    } else {
      console.log('All pages are properly referenced in breadcrumb files.');
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
