#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import globby from 'globby'
import { updateMetadata } from './metadata-manager.js'
import { MetadataResult } from './types/metadata-types.js'

// Interface for processing summary
interface ProcessingSummary {
  path: string
  categories: string[]
  uncertainCategories: boolean
  contentType: string
  isImported: boolean
}

// Simplified color constants for CLI output
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',    // for file paths
  yellow: '\x1b[33m',  // for warnings
  red: '\x1b[31m',     // for errors
  green: '\x1b[32m'    // for success counts
}

// File system related interfaces
interface ParentMetadata {
  path: string
  categories: string[]
}

async function findMdxFiles(pattern: string): Promise<string[]> {
  const files = await globby(pattern, {
    absolute: true,
    expandDirectories: {
      files: ['*.mdx'],
      extensions: ['mdx']
    }
  })
  return files
}

async function findParentMetadata(filePath: string): Promise<ParentMetadata | null> {
  try {
    // First check for index.mdx in the same directory
    const dir = path.dirname(filePath)
    const parentFiles = ['index.mdx', 'README.mdx']
    
    // Try same directory first
    for (const file of parentFiles) {
      const sameDirPath = path.join(dir, file)
      try {
        const content = await fs.readFile(sameDirPath, 'utf8')
        const { data } = matter(content)
        return {
          path: sameDirPath,
          categories: data.categories || []
        }
      } catch (e) {
        continue
      }
    }
    
    // Try parent directory
    const parentDir = path.dirname(dir)
    for (const file of parentFiles) {
      const parentPath = path.join(parentDir, file)
      try {
        const content = await fs.readFile(parentPath, 'utf8')
        const { data } = matter(content)
        return {
          path: parentPath,
          categories: data.categories || []
        }
      } catch (e) {
        continue
      }
    }
    
    return null
  } catch (e) {
    return null
  }
}

async function updateFrontmatter(filePath: string, dryRun: boolean = false, verbose: boolean = false): Promise<{
  categories: string[]
  contentType: string
  isImported: boolean
}> {
  if (verbose) {
    console.log(`\nProcessing: ${filePath}`)
  }

  const result = await updateMetadata(filePath, { 
    dryRun,
    validateOnly: false
  })

  if (!result.metadata) {
    throw new Error(`Failed to process ${filePath}: ${result.errors.join(', ')}`)
  }

  if (verbose) {
    console.log('New metadata:', result.metadata)
    if (result.errors.length > 0) {
      console.log('Validation warnings:', result.errors)
    }
    if (dryRun) {
      console.log('Dry run - no changes made')
    }
  }

  return {
    categories: result.metadata.categories,
    contentType: result.metadata.content_type,
    isImported: result.metadata.is_imported_content === 'true'
  }
}

async function main() {
  try {
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run')
    const verbose = args.includes('--verbose')
    
    const targetPaths = args.filter(arg => !arg.startsWith('--'))
    if (targetPaths.length === 0) {
      console.error(`${colors.red}Please provide at least one path to process${colors.reset}`)
      process.exit(1)
    }

    const allMdxFiles = Array.from(
      new Set(
        (await Promise.all(targetPaths.map(pattern => findMdxFiles(pattern))))
          .flat()
      )
    )
    
    console.log(`Found ${allMdxFiles.length} .mdx files to process\n`)
    
    const summaries: ProcessingSummary[] = []
    
    // Process each file
    for (const file of allMdxFiles) {
      try {
        const result = await updateFrontmatter(file, dryRun, verbose)
        const relativePath = path.relative(process.cwd(), file)
        
        // Determine if categorization is uncertain
        const hasUncertainCategories = 
          !result.categories.length || 
          (result.categories.length === 1 && result.categories[0] === 'protocol')

        summaries.push({
          path: relativePath,
          categories: result.categories,
          uncertainCategories: hasUncertainCategories && !result.isImported,  // Don't flag imported content
          contentType: result.contentType,
          isImported: result.isImported
        })
      } catch (error) {
        console.error(`${colors.red}Error processing ${file}:${colors.reset}`, error)
      }
    }
    
    // Print summary
    console.log('\nProcessing Summary:')
    console.log('==================')
    
    summaries.forEach(summary => {
      // File path in blue
      console.log(`\n📄 ${colors.blue}${summary.path}${colors.reset}`)
      // Type in default color
      console.log(`   Type: ${summary.contentType}`)
      if (summary.isImported) {
        console.log('   Status: Imported content')
      }
      // Categories in default color
      console.log(`   Categories: ${summary.categories.join(', ') || 'none'}`)
      
      if (summary.uncertainCategories) {
        console.log(`   ${colors.yellow}⚠️  Categories may need manual review${colors.reset}`)
      }
    })
    
    const needsReview = summaries.filter(s => s.uncertainCategories).length
    const importedCount = summaries.filter(s => s.isImported).length
    
    console.log('\n=================')
    console.log('Final Summary:')
    console.log(`${colors.green}✓ Processed ${summaries.length} files${colors.reset}`)
    if (importedCount > 0) {
      console.log(`ℹ️  ${importedCount} imported files`)
    }
    if (needsReview > 0) {
      console.log(`${colors.yellow}⚠️  ${needsReview} files may need category review${colors.reset}`)
    }
    if (dryRun) {
      console.log(`${colors.blue}(Dry run - no changes made)${colors.reset}`)
    }
  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error)
    process.exit(1)
  }
}

// Run the script
main()