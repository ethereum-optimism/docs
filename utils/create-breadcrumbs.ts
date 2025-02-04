import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';

const rootDir: string = path.join(__dirname, '..', 'pages');

interface FileInfo {
  title: string;
  url: string;
  description?: string;
  content: string;
}

// Pages to exclude
const excludedPages = [
  '400.mdx',
  '500.mdx',
  'index.mdx',
  '404.mdx',
  '_app.tsx',
  '_document.tsx',
  '_meta.json'
];

function toTitleCase(str: string): string {
  return str.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractFirstParagraph(content: string): string {
  // Remove frontmatter
  content = content.replace(/^---[\s\S]*?---/, '');
  
  // Remove import statements
  content = content.replace(/^import[\s\S]*?\n/gm, '');

  // Remove HTML/MDX tags
  content = content.replace(/<[^>]+>/g, ' ');

  // Remove markdown links but keep text
  content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove headers
  content = content.replace(/^#.+$/gm, '');
  
  const paragraphs = content.split(/\n\n+/);
  const firstParagraph = paragraphs.find(p => {
    const cleaned = p.trim();
    return cleaned.length > 30 && // Minimum length
           !cleaned.startsWith('import') &&
           !cleaned.startsWith('export');
  });

  if (firstParagraph) {
    const cleaned = firstParagraph.replace(/\s+/g, ' ').trim();
    return cleaned.length > 150 ? cleaned.slice(0, 147) + '...' : cleaned;
  }

  return '';
}

async function generateFolderDescription(folderName: string, files: FileInfo[]): Promise<string> {
  if (files.length === 0) {
    return `Documentation for ${toTitleCase(folderName)} is coming soon.`;
  }

  // Try to find overview or introduction file
  const overviewFile = files.find(file => 
    file.url.toLowerCase().includes('overview') || 
    file.url.toLowerCase().includes('introduction')
  );

  if (overviewFile && overviewFile.content) {
    const desc = extractFirstParagraph(overviewFile.content);
    if (desc) return desc;
  }

  // Generate description from files if no overview is found
  const topics = files.map(file => toTitleCase(path.basename(file.url))).join(', ');
  return `Documentation covering ${topics} in the ${toTitleCase(folderName)} section of the OP Stack ecosystem.`;
}

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
        const fileTitle = frontMatter.title || toTitleCase(fileName);
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

async function getExistingBreadcrumbContent(breadcrumbPath: string): Promise<{
  existingContent: string;
  existingCards: Set<string>;
} | null> {
  try {
    const content = await fs.readFile(breadcrumbPath, 'utf-8');
    const cardMatches = content.match(/<Card[^>]*href="([^"]+)"[^>]*>/g) || [];
    const existingCards = new Set(
      cardMatches.map(match => {
        const hrefMatch = match.match(/href="([^"]+)"/);
        return hrefMatch ? hrefMatch[1] : '';
      }).filter(Boolean)
    );
    return { existingContent: content, existingCards };
  } catch (error) {
    return null;
  }
}

async function createOrUpdateBreadcrumb(parentPath: string, folderName: string): Promise<void> {
  const folderPath = path.join(parentPath, folderName);
  const breadcrumbPath = path.join(parentPath, `${folderName}.mdx`);
  
  // Get current files in the folder
  const files = await getContentFiles(folderPath);
  
  // Check existing breadcrumb
  const existing = await getExistingBreadcrumbContent(breadcrumbPath);
  
  if (existing) {
    // If breadcrumb exists, only add new cards
    const newCards: string[] = [];
    let content = existing.existingContent;
    
    files.forEach(({ title: fileTitle, url }) => {
      if (!existing.existingCards.has(url)) {
        newCards.push(`  <Card title="${fileTitle}" href="${url}" />`);
      }
    });
    
    if (newCards.length > 0) {
      // Find the closing </Cards> tag and insert new cards before it
      const cardsSectionEnd = content.lastIndexOf('</Cards>');
      if (cardsSectionEnd !== -1) {
        content = content.slice(0, cardsSectionEnd) + 
                 '\n' + newCards.join('\n') + '\n' +
                 content.slice(cardsSectionEnd);
        
        await fs.writeFile(breadcrumbPath, content);
        console.log(`Added ${newCards.length} new cards to: ${folderName}.mdx`);
      }
    } else {
      console.log(`No new cards needed for: ${folderName}.mdx`);
    }
  } else {
    // If breadcrumb doesn't exist, create new one
    const title = toTitleCase(folderName);
    const description = await generateFolderDescription(folderName, files);
    
    let content = `---
title: ${title}
description: ${description}
lang: en-US
---

import { Card, Cards } from 'nextra/components'

# ${title}

${description}

`;

    if (files.length > 0) {
      content += '<Cards>\n';
      files.forEach(({ title: fileTitle, url }) => {
        content += `  <Card title="${fileTitle}" href="${url}" />\n`;
      });
      content += '</Cards>';
    } else {
      content += 'Documentation for this section is coming soon.';
    }
    
    await fs.writeFile(breadcrumbPath, content);
    console.log(`Created new breadcrumb file: ${folderName}.mdx`);
  }
}

async function processSubfolders(parentPath: string): Promise<void> {
  try {
    const entries = await fs.readdir(parentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('_')) {
        continue;
      }

      const folderName = entry.name;
      console.log(`Processing folder: ${folderName}`);
      
      try {
        await createOrUpdateBreadcrumb(parentPath, folderName);
      } catch (error) {
        console.error(`Error processing breadcrumb for ${folderName}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing folders:', error);
  }
}

const main = async (): Promise<void> => {
  console.log('Starting breadcrumb update process...');
  console.log('Root directory:', rootDir);

  try {
    // Process main sections: builders, chain, connect, stack
    const mainSections = ['app-developers', 'operators', 'superchain', 'stack'];
    for (const section of mainSections) {
      const sectionPath = path.join(rootDir, section);
      try {
        await fs.access(sectionPath);
        await processSubfolders(sectionPath);
        console.log(`Completed processing ${section} section`);
      } catch (error) {
        console.log(`Skipping ${section} - directory not found`);
      }
    }
    console.log('Finished updating all breadcrumbs.');
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
};

main().catch(error => {
  console.error('Error in main process:', error);
  process.exit(1);
});