import * as fs from 'fs/promises';
import * as path from 'path';

const targetFolders: string[] = ['builders', 'chain', 'stack', 'connect'];
const rootDir: string = path.join(__dirname, '..', 'pages');

interface FileInfo {
  title: string;
  url: string;
}

function toTitleCase(str: string): string {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

const createMdxFile = async (parentFolderPath: string, folderName: string): Promise<void> => {
  const folderPath = path.join(parentFolderPath, folderName);
  const files = await fs.readdir(folderPath);
  const mdFiles = files.filter(file => 
    (file.endsWith('.md') || file.endsWith('.mdx')) && 
    !file.startsWith('_')
  );
  
  const title = toTitleCase(folderName);
  
  let content = `---
title: ${title}
lang: en-US
---

import { Card, Cards } from 'nextra/components'

# ${title}

Welcome to the ${title} section. Here you'll find resources and information related to ${title}.

<Cards>
`;

  const fileInfos: FileInfo[] = [];

  for (const file of mdFiles) {
    const filePath = path.join(folderPath, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    let fileTitle = fileContent.match(/^#\s+(.+)/m)?.[1] || path.basename(file, path.extname(file));
    fileTitle = toTitleCase(fileTitle);
    const relativeUrl = `/${path.relative(rootDir, folderPath)}/${path.basename(file, path.extname(file))}`.replace(/\\/g, '/');
    
    if (!fileInfos.some(info => info.url === relativeUrl)) {
      fileInfos.push({ title: fileTitle, url: relativeUrl });
    }
  }

  fileInfos.forEach(({ title, url }) => {
    content += `  <Card title="${title}" href="${url}" />\n`;
  });

  content += '</Cards>';

  const mdxFileName = `${folderName}.mdx`;
  const mdxFilePath = path.join(parentFolderPath, mdxFileName);

  // Check if the file already exists and has the same content
  try {
    const existingContent = await fs.readFile(mdxFilePath, 'utf-8');
    if (existingContent.trim() === content.trim()) {
      console.log(`${mdxFileName} in ${parentFolderPath} is up to date. Skipping.`);
      return;
    }
  } catch (error) {
    // File doesn't exist, we'll create it
  }

  await fs.writeFile(mdxFilePath, content);
  console.log(`Created/Updated ${mdxFileName} in ${parentFolderPath}`);
};

const processFolder = async (folderPath: string): Promise<void> => {
  try {
    const files = await fs.readdir(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        await createMdxFile(folderPath, file);
        await processFolder(filePath);
      }
    }
  } catch (error) {
    console.error(`Error processing folder ${folderPath}:`, error);
  }
};

const main = async (): Promise<void> => {
  for (const folder of targetFolders) {
    const folderPath = path.join(rootDir, folder);
    await processFolder(folderPath);
  }
};

main().catch(console.error);

// Log the root directory for debugging
console.log('Root directory:', rootDir);