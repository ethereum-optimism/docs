import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';

const rootDir = path.join(process.cwd(), 'pages');
const errors: string[] = [];

interface PageInfo {
  title: string;
  url: string;
}

async function getReferencedPages(breadcrumbContent: string): Promise<string[]> {
  // Extract URLs from Card components in the breadcrumb file
  const cardRegex = /<Card[^>]*href="([^"]+)"[^>]*>/g;
  const urls: string[] = [];
  let match;
  
  while ((match = cardRegex.exec(breadcrumbContent)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}

async function checkDirectory(dirPath: string): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  // First, find the breadcrumb file for this directory
  const dirName = path.basename(dirPath);
  const breadcrumbFile = path.join(dirPath, `${dirName}.mdx`);
  let referencedPages: string[] = [];
  
  try {
    const breadcrumbContent = await fs.readFile(breadcrumbFile, 'utf-8');
    referencedPages = await getReferencedPages(breadcrumbContent);
  } catch (error) {
    // Only check for missing references if not in root directory
    if (dirPath !== rootDir) {
      errors.push(`Missing breadcrumb file for directory: ${path.relative(rootDir, dirPath)}`);
      return;
    }
  }

  // Check each entry in the directory
  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively check subdirectories
      await checkDirectory(fullPath);
    } else if ((entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) && 
               entry.name !== `${dirName}.mdx`) {
      // Check if this page is referenced in the breadcrumb
      const relativePath = '/' + path.relative(rootDir, fullPath)
        .replace(/\.(md|mdx)$/, '');
      
      if (!referencedPages.includes(relativePath)) {
        errors.push(`Page not referenced in breadcrumb: ${relativePath}`);
      }
    }
  }
}

async function main() {
  try {
    await checkDirectory(rootDir);
    
    if (errors.length > 0) {
      console.error('Breadcrumb check failed:');
      errors.forEach(error => console.error(`- ${error}`));
      process.exit(1);
    } else {
      console.log('All pages are properly referenced in breadcrumb navigation.');
    }
  } catch (error) {
    console.error('Error checking breadcrumbs:', error);
    process.exit(1);
  }
}

main();