import * as fs from 'fs/promises';
import * as path from 'path';

const targetFolders: string[] = ['builders', 'chain', 'stack', 'connect'];
const rootDir: string = path.join(__dirname, '..', 'pages');

interface FileInfo {
  title: string;
  url: string;
}

const createMdxFile = async (folderPath: string, folderName: string): Promise<void> => {
  const files = await fs.readdir(folderPath);
  const mdFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
  
  const title = folderName.charAt(0).toUpperCase() + folderName.slice(1);
  
  let content = `---
title: ${title}
lang: en-US
---

import { Card, Cards } from 'nextra/components'

# ${title}

Welcome to the ${title} section. Here you'll find resources and information related to ${folderName}.

<Cards>
`;

  const filePromises: Promise<FileInfo>[] = mdFiles.map(async (file) => {
    const filePath = path.join(folderPath, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const fileTitle = fileContent.match(/^#\s+(.+)/m)?.[1] || path.basename(file, '.md');
    const relativeUrl = `/${path.relative(rootDir, folderPath)}/${path.basename(file, path.extname(file))}`.replace(/\\/g, '/');
    
    return { title: fileTitle, url: relativeUrl };
  });

  const fileInfos = await Promise.all(filePromises);

  fileInfos.forEach(({ title, url }) => {
    content += `  <Card title="${title}" href="${url}" />\n`;
  });

  content += '</Cards>';

  const mdxFileName = `${folderName}.mdx`;
  await fs.writeFile(path.join(folderPath, mdxFileName), content);
  console.log(`Created ${mdxFileName} in ${folderPath}`);
};

const processFolder = async (folderPath: string): Promise<void> => {
  try {
    const files = await fs.readdir(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        await createMdxFile(filePath, file);
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