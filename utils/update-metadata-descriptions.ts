import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

// Simple script to update only descriptions without touching other metadata
async function updateDescriptions() {
  // Get all MDX files in the stack directory
  const stackDir = path.join(process.cwd(), 'pages/stack');
  const files = getAllFiles(stackDir);
  
  let updated = 0;
  let skipped = 0;
  
  for (const file of files) {
    try {
      // Read file content
      const content = fs.readFileSync(file, 'utf8');
      const { data, content: docContent } = matter(content);
      
      // Check if description exists and is not empty
      if (!data.description || data.description.trim() === '' || data.description === '>-') {
        // Generate a description based on title
        const title = data.title || path.basename(file, '.mdx');
        const description = `Learn about ${title} in the OP Stack.`;
        
        // Update frontmatter
        data.description = description;
        
        // Write back to file
        const updatedContent = matter.stringify(docContent, data);
        fs.writeFileSync(file, updatedContent);
        
        console.log(`✅ Updated description for ${file}`);
        updated++;
      } else {
        console.log(`⏭️ Skipped ${file} (already has description)`);
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }
  
  console.log(`\nSummary: Updated ${updated} files, skipped ${skipped} files`);
}

// Helper function to get all files recursively
function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively get files from subdirectories
      results = results.concat(getAllFiles(filePath));
    } else if (filePath.endsWith('.mdx')) {
      results.push(filePath);
    }
  }
  
  return results;
}

updateDescriptions().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});