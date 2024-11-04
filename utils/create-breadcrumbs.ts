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

function toTitleCase(str: string): string {
  return str.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractFirstParagraph(content: string): string {

  content = content.replace(/^---[\s\S]*?---/, '');
  
  content = content.replace(/^import[\s\S]*?\n/gm, '');

  content = content.replace(/<[^>]+>/g, ' ');

  content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
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

async function generateFolderDescription(files: FileInfo[]): Promise<string> {
  if (files.length === 0) {
    return 'Documentation for this section is coming soon.';
  }

  const overviewFile = files.find(file => 
    file.url.toLowerCase().includes('overview') || 
    file.url.toLowerCase().includes('introduction')
  );

  if (overviewFile && overviewFile.content) {
    const desc = extractFirstParagraph(overviewFile.content);
    if (desc) return desc;
  }

  const folderName = toTitleCase(path.basename(path.dirname(files[0].url)));
  const topics = files.map(file => toTitleCase(path.basename(file.url))).join(', ');
  
  return `Documentation covering ${topics} in the ${folderName} section of the OP Stack ecosystem.`;
}

async function getContentFiles(folderPath: string): Promise<FileInfo[]> {
  const files = await fs.readdir(folderPath);
  const fileInfos: FileInfo[] = [];
  const folderName = path.basename(folderPath);

  for (const file of files) {
    if (file.startsWith('_') || 
        file === `${folderName}.mdx` || 
        file.startsWith('.') || 
        file.endsWith('.tsx') ||
        file.endsWith('.json')) {
      continue;
    }

    const filePath = path.join(folderPath, file);
    const stats = await fs.stat(filePath);

    if (!stats.isDirectory() && (file.endsWith('.md') || file.endsWith('.mdx'))) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { data: frontMatter } = matter(content);
        const fileName = path.basename(file, path.extname(file));
        const fileTitle = frontMatter.title || toTitleCase(fileName);
        const relativeUrl = `/${path.relative(rootDir, filePath)}`.replace(/\.(md|mdx)$/, '');

        fileInfos.push({
          title: fileTitle,
          url: relativeUrl,
          description: frontMatter.description,
          content: content
        });
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
  }

  return fileInfos;
}

async function createBreadcrumb(folderPath: string, folderName: string): Promise<string> {
  const files = await getContentFiles(folderPath);
  const title = toTitleCase(folderName);
  const description = await generateFolderDescription(files);

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

  return content;
}

async function processStackSubfolders(stackPath: string): Promise<void> {
  try {
    const entries = await fs.readdir(stackPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('_')) {
        continue;
      }

      const subfolderPath = path.join(stackPath, entry.name);
      const breadcrumbPath = path.join(subfolderPath, `${entry.name}.mdx`);

      console.log(`Processing stack subfolder: ${entry.name}`);
      
      try {
        const content = await createBreadcrumb(subfolderPath, entry.name);
        await fs.writeFile(breadcrumbPath, content);
        console.log(`Created/Updated breadcrumb for: ${entry.name}`);
      } catch (error) {
        console.error(`Error creating breadcrumb for ${entry.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing stack subfolders:', error);
  }
}

const main = async (): Promise<void> => {
  console.log('Starting stack subfolder breadcrumb update process...');
  console.log('Root directory:', rootDir);

  try {
    const stackPath = path.join(rootDir, 'stack');
    await fs.access(stackPath);
    await processStackSubfolders(stackPath);
    console.log('Finished updating stack subfolder breadcrumbs.');
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
};

main().catch(error => {
  console.error('Error in main process:', error);
  process.exit(1);
});