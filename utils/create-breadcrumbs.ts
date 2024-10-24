import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';

const targetFolders: string[] = ['builders', 'chain', 'stack', 'connect'];
const rootDir: string = path.join(__dirname, '..', 'pages');

interface FileInfo {
  title: string;
  url: string;
}

function updateOPTerminology(description: string): string {
  // Skip if already contains "OP Stack"
  if (description.includes('OP Stack')) {
    return description;
  }
  
  // Replace variations of "OP Mainnet" with "OP Stack"
  return description
    .replace(/\bOP Mainnet\b/gi, 'OP Stack')
    .replace(/\bOptimism Mainnet\b/gi, 'OP Stack')
    .replace(/\bOptimism mainnet\b/gi, 'OP Stack');
}

const updateBreadcrumbFile = async (filePath: string): Promise<void> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontMatter, content: fileContent } = matter(content);

    // Only process if there's a description that contains OP Mainnet but not OP Stack
    if (frontMatter.description &&
        frontMatter.description.match(/\bOP Mainnet\b|\bOptimism Mainnet\b/gi) &&
        !frontMatter.description.includes('OP Stack')) {
      
      // Update the description
      frontMatter.description = updateOPTerminology(frontMatter.description);
      
      // Write back to file
      const updatedContent = matter.stringify(fileContent, frontMatter);
      await fs.writeFile(filePath, updatedContent);
      console.log(`Updated description in breadcrumb file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
};

const processFolder = async (folderPath: string): Promise<void> => {
  try {
    const files = await fs.readdir(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        // Process breadcrumb file for this directory if it exists
        const breadcrumbFile = path.join(folderPath, `${file}.mdx`);
        try {
          await fs.access(breadcrumbFile);
          await updateBreadcrumbFile(breadcrumbFile);
        } catch (error) {
          // Breadcrumb file doesn't exist, skip
        }
        
        // Continue processing subdirectories
        await processFolder(filePath);
      }
    }
  } catch (error) {
    console.error(`Error processing folder ${folderPath}:`, error);
  }
};

const main = async (): Promise<void> => {
  console.log('Starting breadcrumb description update process...');
  console.log('Root directory:', rootDir);

  for (const folder of targetFolders) {
    const folderPath = path.join(rootDir, folder);
    await processFolder(folderPath);
  }

  console.log('Finished updating breadcrumb descriptions.');
};

main().catch(error => {
  console.error('Error in main process:', error);
  process.exit(1);
});