#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { updateMetadata } from './metadata-manager'
import matter from 'gray-matter'

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
    prMode: !verbose
  })

  if (!result.isValid) {
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

async function validateFilePaths(files: string[]): Promise<string[]> {
  const validFiles = []
  const errors = []

  for (const file of files) {
    try {
      // Check if file exists and is readable
      await fs.access(file, fs.constants.R_OK)
      // Check if it's actually a file (not a directory)
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

async function processFiles(files: string[]): Promise<boolean> {
  let hasErrors = false
  let processedCount = 0

  for (const file of files) {
    try {
      const result = await updateMetadata(file, { dryRun: true, prMode: true })
      if (!result.isValid) {
        hasErrors = true
        console.log(`\n${colors.red}Error in ${file}:${colors.reset}`)
        result.errors.forEach(error => {
          console.log(`  ${colors.yellow}→${colors.reset} ${error}`)
        })
      }
      processedCount++
    } catch (e) {
      console.log(`\n${colors.red}Failed to process ${file}: ${e}${colors.reset}`)
      hasErrors = true
    }
  }

  console.log(
    hasErrors
      ? `\n${colors.red}✖ Found metadata issues in some files${colors.reset}`
      : `\n${colors.green}✓ Validated ${processedCount} files successfully${colors.reset}`
  )

  return hasErrors
}

async function main() {
  try {
    console.log('Checking metadata...')
    
    // Get modified files from git and validate input
    const gitOutput = process.env.CHANGED_FILES || ''
    if (!gitOutput.trim()) {
      console.log(`${colors.green}✓ No files to check${colors.reset}`)
      process.exit(0)
    }

    const modifiedFiles = gitOutput
      .split('\n')
      .filter(file => file.trim()) // Remove empty lines
      .filter(file => file.endsWith('.mdx'))
      .map(file => path.resolve(process.cwd(), file))

    if (modifiedFiles.length === 0) {
      console.log(`${colors.green}✓ No MDX files modified${colors.reset}`)
      process.exit(0)
    }

    // Validate file paths
    const validFiles = await validateFilePaths(modifiedFiles)
    
    if (validFiles.length === 0) {
      console.log(`${colors.red}✖ No valid files to check${colors.reset}`)
      process.exit(1)
    }

    console.log(`Found ${validFiles.length} valid files to check`)
    
    const hasErrors = await processFiles(validFiles)
    process.exit(hasErrors ? 1 : 0)
  } catch (error) {
    console.error(`${colors.red}Error: ${error}${colors.reset}`)
    process.exit(1)
  }
}

// Force output buffering
console.log = console.log.bind(console)
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error}${colors.reset}`)
  process.exit(1)
})