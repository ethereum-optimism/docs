import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';

const targetFolders: string[] = ['builders', 'chain', 'stack', 'connect'];
const rootDir: string = path.join(__dirname, '..', 'pages');

interface FileInfo {
  title: string;
  url: string;
  content: string;
  description?: string;
}

interface FrontMatter {
  title?: string;
  description?: string;
  lang?: string;
}

function toTitleCase(str: string): string {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function uniqueArray(arr: string[]): string[] {
  return arr.filter((value, index, self) => self.indexOf(value) === index);
}

function generateDescription(content: string, title: string): string {
  // Remove HTML/MDX tags
  const cleanContent = content.replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();

  // Find the first paragraph that's not empty and not a title
  const paragraphs = cleanContent.split(/\n\n+/);
  let firstRelevantParagraph = paragraphs.find(p => 
    p.trim() && 
    !p.startsWith('#') && 
    p.length > 30 &&
    !p.includes('import') &&
    !p.includes('export')
  );

  if (!firstRelevantParagraph) {
    return `Learn about ${title.toLowerCase()} in the Optimism ecosystem. This guide provides detailed information and resources about ${title.toLowerCase()}.`;
  }

  firstRelevantParagraph = firstRelevantParagraph
    .replace(/\s+/g, ' ')
    .trim();

  if (firstRelevantParagraph.length > 150) {
    firstRelevantParagraph = firstRelevantParagraph.substr(0, 150).split(' ').slice(0, -1).join(' ') + '...';
  }

  return firstRelevantParagraph;
}

function generateOverview(fileInfos: FileInfo[]): string {
  const topics = fileInfos.map(file => file.title.toLowerCase());
  const uniqueTopics = uniqueArray(topics);
  
  let overview = `This section provides information on ${uniqueTopics.slice(0, -1).join(', ')}`;
  if (uniqueTopics.length > 1) {
    overview += ` and ${uniqueTopics[uniqueTopics.length - 1]}`;
  }
  overview += '. ';

  const keywordRegex = /\b(guide|tutorial|overview|introduction|tool|concept|api|reference)\b/i;
  const keywords = uniqueArray(
    fileInfos.flatMap(file => {
      const matches = file.content.match(keywordRegex);
      return matches ? matches.map(keyword => keyword.toLowerCase()) : [];
    })
  );

  if (keywords.length > 0) {
    overview += `You'll find ${keywords.join(', ')} to help you understand and work with these topics.`;
  }

  return overview;
}

const processMdxFile = async (filePath: string, fileContent: string): Promise<string> => {
  const { data: frontMatter, content } = matter(fileContent);
  
  // Only generate and add description if it's completely missing
  if (!frontMatter.description) {
    const title = frontMatter.title || path.basename(filePath, path.extname(filePath));
    frontMatter.description = generateDescription(content, title);
    
    // Reconstruct the file with the new frontmatter
    const updatedContent = matter.stringify(content, frontMatter);
    await fs.writeFile(filePath, updatedContent);
    console.log(`Added description to ${filePath}`);
    return updatedContent;
  }
  
  return fileContent;
};

const createMdxFile = async (parentFolderPath: string, folderName: string): Promise<void> => {
  const folderPath = path.join(parentFolderPath, folderName);
  const files = await fs.readdir(folderPath);
  const mdFiles = files.filter(file => 
    (file.endsWith('.md') || file.endsWith('.mdx')) && 
    !file.startsWith('_')
  );
  
  const title = toTitleCase(folderName);
  const fileInfos: FileInfo[] = [];

  for (const file of mdFiles) {
    const filePath = path.join(folderPath, file);
    let fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Process individual files to add missing descriptions
    fileContent = await processMdxFile(filePath, fileContent);
    
    const { data: frontMatter } = matter(fileContent);
    let fileTitle = frontMatter.title || fileContent.match(/^#\s+(.+)/m)?.[1] || path.basename(file, path.extname(file));
    fileTitle = toTitleCase(fileTitle);
    const relativeUrl = `/${path.relative(rootDir, folderPath)}/${path.basename(file, path.extname(file))}`.replace(/\\/g, '/');
    
    if (!fileInfos.some(info => info.url === relativeUrl)) {
      fileInfos.push({ 
        title: fileTitle, 
        url: relativeUrl, 
        content: fileContent,
        description: frontMatter.description 
      });
    }
  }

  const overview = generateOverview(fileInfos);
  const mdxFileName = `${folderName}.mdx`;
  const mdxFilePath = path.join(parentFolderPath, mdxFileName);

  // Check if the overview file already exists and has a description
  let existingDescription: string | undefined;
  try {
    const existingContent = await fs.readFile(mdxFilePath, 'utf-8');
    const { data: existingFrontMatter } = matter(existingContent);
    existingDescription = existingFrontMatter.description;
  } catch (error) {
    // File doesn't exist yet
  }

  let content = `---
title: ${title}
${existingDescription ? `description: ${existingDescription}` : `description: ${generateDescription(overview, title)}`}
lang: en-US
---

import { Card, Cards } from 'nextra/components'

# ${title}

${overview}

<Cards>
`;

  fileInfos.forEach(({ title, url }) => {
    content += `  <Card title="${title}" href="${url}" />\n`;
  });

  content += '</Cards>';

  // Only write if the file doesn't exist or if it exists but has no description
  if (!existingDescription) {
    await fs.writeFile(mdxFilePath, content);
    console.log(`Created/Updated ${mdxFileName} in ${parentFolderPath}`);
  } else {
    console.log(`Skipping ${mdxFileName} in ${parentFolderPath} - existing description preserved`);
  }
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

console.log('Root directory:', rootDir);