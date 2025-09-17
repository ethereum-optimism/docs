#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all .mdx files
function findMdxFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile() && item.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

// Function to check if file contains <Steps>
function containsSteps(content) {
  return content.includes('<Steps');
}

// Function to check if file already has the import
function hasStepsImport(content) {
  return content.includes('import { Steps } from "/snippets/steps.jsx"');
}

// Function to add the import after frontmatter
function addStepsImport(content) {
  // Split content by lines
  const lines = content.split('\n');
  
  // Find the end of frontmatter (second occurrence of ---)
  let frontmatterEnd = -1;
  let dashCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      dashCount++;
      if (dashCount === 2) {
        frontmatterEnd = i;
        break;
      }
    }
  }
  
  if (frontmatterEnd === -1) {
    console.log('Warning: Could not find frontmatter end');
    return content;
  }
  
  // Insert the import after frontmatter
  const beforeFrontmatter = lines.slice(0, frontmatterEnd + 1);
  const afterFrontmatter = lines.slice(frontmatterEnd + 1);
  
  // Add import with proper spacing
  const importLine = 'import { Steps } from "/snippets/steps.jsx"';
  
  // Find the first non-empty line after frontmatter to maintain spacing
  let insertIndex = 0;
  for (let i = 0; i < afterFrontmatter.length; i++) {
    if (afterFrontmatter[i].trim() !== '') {
      insertIndex = i;
      break;
    }
  }
  
  // Insert import with blank line after
  const newContent = [
    ...beforeFrontmatter,
    '',
    importLine,
    ...afterFrontmatter
  ].join('\n');
  
  return newContent;
}

// Main function
function main() {
  console.log('🔍 Searching for .mdx files that contain <Steps>...\n');
  
  const mdxFiles = findMdxFiles('.');
  let processedCount = 0;
  let updatedFiles = [];
  
  mdxFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (containsSteps(content)) {
        console.log(`📝 Found <Steps> in: ${filePath}`);
        
        if (hasStepsImport(content)) {
          console.log(`   ✅ Already has import - skipping\n`);
        } else {
          console.log(`   ➕ Adding Steps import...`);
          
          const updatedContent = addStepsImport(content);
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          
          processedCount++;
          updatedFiles.push(filePath);
          console.log(`   ✅ Updated successfully\n`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  });
  
  console.log('📊 Summary:');
  console.log(`   Total .mdx files scanned: ${mdxFiles.length}`);
  console.log(`   Files with <Steps>: ${updatedFiles.length + (mdxFiles.filter(f => {
    try {
      const content = fs.readFileSync(f, 'utf8');
      return containsSteps(content) && hasStepsImport(content);
    } catch {
      return false;
    }
  }).length)}`);
  console.log(`   Files updated: ${processedCount}`);
  
  if (updatedFiles.length > 0) {
    console.log('\n📄 Updated files:');
    updatedFiles.forEach(file => console.log(`   - ${file}`));
  }
  
  console.log('\n🎉 Script completed successfully!');
  console.log('\n🗑️  Deleting this script file...');
  
  // Delete this script file
  try {
    fs.unlinkSync(__filename);
    console.log('✅ Script file deleted successfully!');
  } catch (error) {
    console.error('❌ Could not delete script file:', error.message);
  }
}

// Run the script
if (require.main === module) {
  main();
}
