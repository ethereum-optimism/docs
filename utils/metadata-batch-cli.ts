#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { updateMetadata as updateMetadataFile } from './metadata-manager'
import matter from 'gray-matter'
import { analyzeContent } from './metadata-analyzer'
import { MetadataResult } from './types/metadata-types'
import { generateMetadata } from './metadata-manager'
import globby from 'globby'

// @ts-ignore
const globModule = await import('glob')
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

interface CliOptions {
  dryRun: boolean
  verbose: boolean
}

async function findMdxFiles(pattern: string): Promise<string[]> {
  const files = await globModule.glob(pattern, { ignore: ['pages/_*.mdx'] })
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

async function validateMetadata(
  filepath: string,
  options: {
    dryRun?: boolean;
    verbose?: boolean;
    analysis: MetadataResult;
    validateOnly: boolean;
    prMode: boolean;
  }
): Promise<{ isValid: boolean; errors: string[]; metadata: MetadataResult }> {
  const errors: string[] = [];
  
  // Validate required fields using proper types
  if (!options.analysis?.topic || typeof options.analysis.topic !== 'string') {
    errors.push('Missing required field: topic');
  }
  if (!Array.isArray(options.analysis?.personas) || options.analysis.personas.length === 0) {
    errors.push('Missing required field: personas');
  }
  if (!Array.isArray(options.analysis?.categories)) {
    errors.push('Missing required field: categories');
  }
  if (!options.analysis?.content_type) {
    errors.push('Missing required field: content_type');
  }

  return {
    isValid: errors.length === 0,
    errors,
    metadata: options.analysis
  };
}

async function validateFilePaths(files: string[]): Promise<string[]> {
  const validFiles = []
  const errors = []

  for (const file of files) {
    try {
      await fs.access(file, fs.constants.R_OK)
      const stats = await fs.stat(file)
      if (stats.isFile()) {
        validFiles.push(file)
      } else {
        errors.push(`${file} is not a file`)
      }
    } catch (error) {
      errors.push(`Cannot access ${file}: ${error.message}`)
    }
  }

  if (errors.length > 0) {
    console.log(`${colors.yellow}Warning: Some files were skipped:${colors.reset}`)
    errors.forEach(error => console.log(`  ${colors.yellow}→${colors.reset} ${error}`))
  }

  return validFiles
}

function truncateString(str: string, maxLength: number = 80): string {
  return str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str
}

async function processFiles(files: string[], options: CliOptions): Promise<{
  hasErrors: boolean;
  stats: {
    total: number;
    successful: number;
    needsReview: number;
    failed: number;
  };
}> {
  const stats = {
    total: files.length,
    successful: 0,
    needsReview: 0,
    failed: 0
  }

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8')
      const { data: frontmatter } = matter(content)
      const analysis = analyzeContent(content, file, options.verbose)
      const result = await updateMetadataFile(file, {
        dryRun: options.dryRun,
        verbose: options.verbose,
        analysis,
        validateOnly: false,
        prMode: false
      })

      console.log(`\n${colors.blue}📄 ${file}${colors.reset}`)
      console.log(`   Title: ${analysis.title || frontmatter.title || ''}`)
      console.log(`   Description: ${truncateString(frontmatter.description || '')}`)
      console.log(`   Lang: ${frontmatter.lang || analysis.lang || 'en-US'}`)
      console.log(`   Content Type: ${analysis.content_type}`)
      console.log(`   Topic: ${analysis.topic}`)
      console.log(`   Personas: ${analysis.personas.join(', ')}`)
      console.log(`   Categories: ${analysis.categories?.length ? analysis.categories.join(', ') : 'none'}`)

      if (!result.isValid) {
        console.log('   ⚠️  Review needed:')
        result.errors.forEach(error => {
          console.log(`     → ${error}`)
        })
        stats.needsReview++
      } else {
        if (!options.dryRun) {
          await updateMetadataFile(file, {
            dryRun: false,
            verbose: options.verbose || false,
            analysis,
            validateOnly: false,
            prMode: false
          })
          console.log('   ✓ Updates applied')
        }
        stats.successful++
      }
    } catch (e) {
      stats.failed++
      console.log(`${colors.yellow}⚠️  Error processing ${file}:${colors.reset} ${e}`)
    }
  }

  // Print summary
  console.log('\nSummary:')
  console.log(`${colors.green}✓ ${stats.successful} files processed${colors.reset}`)
  if (stats.needsReview > 0) {
    console.log(`${colors.yellow}⚠️  ${stats.needsReview} files need review${colors.reset}`)
  }
  if (stats.failed > 0) {
    console.log(`${colors.yellow}⚠️  ${stats.failed} files need manual updates${colors.reset}`)
  }

  return { hasErrors: stats.failed > 0, stats }
}

async function main() {
  try {
    const isDryRun = process.argv.includes('--dry-run')
    const isVerbose = process.argv.includes('--verbose')
    
    // Get files from either CHANGED_FILES or command line glob patterns
    let mdxFiles = []
    if (process.env.CHANGED_FILES) {
      mdxFiles = process.env.CHANGED_FILES.split('\n').filter(Boolean)
    } else {
      // Get glob patterns from command line args (skip the first two args)
      const patterns = process.argv.slice(2).filter(arg => !arg.startsWith('--'))
      if (patterns.length > 0) {
        mdxFiles = await globby(patterns)
      }
    }
    
    mdxFiles = mdxFiles.filter(file => file.endsWith('.mdx'))
    
    if (mdxFiles.length === 0) {
      console.log('✓ No MDX files to check')
      process.exit(0)
    }

    console.log(`Found ${mdxFiles.length} valid files to check\n`)
    
    let processedCount = 0
    let needsReviewCount = 0
    
    for (const file of mdxFiles) {
      try {
        const metadata = await generateMetadata(file)
        const result = await updateMetadataFile(file, {
          dryRun: isDryRun,
          verbose: isVerbose,
          validateOnly: false,
          prMode: false,
          analysis: metadata
        })
        
        processedCount++
        
        // Show metadata for each file
        console.log(`\nFile: ${file}`)
        console.log('Categories:', metadata.categories?.join(', ') || 'none')
        
        if (!result.isValid) {
          needsReviewCount++
          console.log('\x1b[33m⚠️  Review needed:\x1b[0m')
          result.errors.forEach(error => console.log(`  → ${error}`))
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error)
      }
    }
    
    // Summary with colors
    console.log(`\n${processedCount} files processed`)
    if (needsReviewCount === 0) {
      console.log('\x1b[32m✓ All files have valid metadata\x1b[0m')
    } else {
      console.log(`\x1b[33m⚠️  ${needsReviewCount} files need review\x1b[0m`)
    }
  } catch (error) {
    console.error('\x1b[31mError:\x1b[0m', error)
    process.exit(1)
  }
}

// Force output buffering
console.log = console.log.bind(console)
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error}${colors.reset}`)
  process.exit(1)
})