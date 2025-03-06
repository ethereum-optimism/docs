import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import { analyzeContent } from './metadata-analyzer'
import { MetadataResult, MetadataOptions, ValidationResult } from './types/metadata-types'
import * as fsStandard from 'fs'

// Add the interfaces at the top of the file
interface ValidationOptions {
  prMode?: boolean
  dryRun?: boolean
  validateOnly?: boolean
}

interface UpdateOptions {
  dryRun?: boolean
  validateOnly?: boolean
  prMode?: boolean
  verbose?: boolean
  analysis?: MetadataResult
}

// Load the config file
const configPath = path.resolve(process.cwd(), 'keywords.config.yaml')
const yamlConfig = yaml.load(fsStandard.readFileSync(configPath, 'utf8')) as {
  metadata_rules?: {
    categories?: {
      values?: string[]
    }
  }
} || {
  metadata_rules: {
    categories: {
      values: []
    }
  }
}

// Validation functions
function validateMetadata(metadata: any, filepath: string): ValidationResult {
  const errors: string[] = []
  const config = yamlConfig
  
  // Check for required fields
  if (!metadata.title) {
    errors.push('title is required')
  }
  
  if (!metadata.description) {
    errors.push('description is required')
  }
  
  if (!metadata.lang) {
    errors.push('lang is required')
  }
  
  // Check if this is a landing page (index.mdx)
  const isLandingPage = filepath.endsWith('index.mdx')
  
  if (!isLandingPage) {
    // Additional checks for non-landing pages
    if (!metadata.content_type) {
      errors.push('content_type is required')
    }
    
    if (!metadata.topic) {
      errors.push('topic is required')
    }
    
    // Check personas
    if (!metadata.personas || metadata.personas.length === 0) {
      errors.push('personas is required')
    }
    
    // Check categories
    let categories = metadata.categories || []
    if (typeof categories === 'string') {
      categories = categories.split(',').map(c => c.trim())
    }
    
    if (categories.length === 0) {
      errors.push('categories is required')
    } else {
      // Validate categories against allowed values
      const validCategories = config.metadata_rules?.categories?.values || []
      if (validCategories.length > 0) {
        const invalidCategories = categories.filter(c => !validCategories.includes(c))
        if (invalidCategories.length > 0) {
          errors.push(`Invalid categories: ${invalidCategories.join(', ')}`)
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions: {}
  }
}

// Generation functions
export async function generateMetadata(filePath: string): Promise<MetadataResult> {
  const content = await fs.readFile(filePath, 'utf8')
  const { data: existingMetadata } = matter(content)
  const analysis = analyzeContent(content, filePath)

  // Handle categories that might be string or array
  let categories = existingMetadata.categories || []
  if (typeof categories === 'string') {
    categories = categories.split(',').map(c => c.trim())
  }

  let personas = existingMetadata.personas || []
  if (typeof personas === 'string') {
    personas = [personas]
  }

  const metadata: MetadataResult = {
    ...existingMetadata,
    ...analysis,
    title: existingMetadata.title || '',
    lang: existingMetadata.lang || 'en',
    description: existingMetadata.description || '',
    topic: existingMetadata.topic || '',
    personas: personas,
    content_type: existingMetadata.content_type || '',
    categories: categories,
    is_imported_content: existingMetadata.is_imported_content || 'false',
    content: content
  }

  return metadata
}

// Combined update function with validation and atomic writes
export async function updateMetadata(
  filepath: string,
  options: MetadataOptions
): Promise<ValidationResult> {
  try {
    const content = await fs.readFile(filepath, 'utf8')
    const { data: frontmatter, content: docContent } = matter(content)

    // Guard against undefined analysis with optional chaining
    const safeAnalysis = options?.analysis || {} as MetadataResult
    
    // Create new metadata object with all fields
    const newMetadata = {
      title: safeAnalysis.title || frontmatter.title || '',
      description: frontmatter.description || safeAnalysis.description || '',
      lang: frontmatter.lang || safeAnalysis.lang || 'en-US',
      content_type: safeAnalysis.suggestions?.content_type || safeAnalysis.content_type || '',
      topic: safeAnalysis.suggestions?.topic || safeAnalysis.topic || '', 
      personas: safeAnalysis.suggestions?.personas || safeAnalysis.personas || [],
      categories: safeAnalysis.suggestions?.categories || safeAnalysis.categories || [],
      is_imported_content: safeAnalysis.is_imported_content || 'false'
    }

    // Validate metadata in all cases
    const validationResult = validateMetadata(newMetadata, filepath)

    // Check validation mode - don't log here, let the batch CLI handle it
    if (options.validateOnly || options.prMode) {
      return validationResult
    }

    // Only write if not in dry run mode and validation passed
    if (!options.dryRun && validationResult.isValid) {
      const updatedContent = matter.stringify(docContent, newMetadata)
      await fs.writeFile(filepath, updatedContent, 'utf8')
    }

    return validationResult
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to update metadata for ${filepath}: ${error.message}`],
      suggestions: {}
    }
  }
}

// PR validation function
export async function validatePRChanges(): Promise<boolean> {
  try {
    const gitOutput = process.env.CHANGED_FILES || ''
    const modifiedFiles = gitOutput
      .split('\n')
      .filter(file => file.endsWith('.mdx'))
      .map(file => path.resolve(process.cwd(), file))

    if (modifiedFiles.length === 0) {
      return true
    }

    let hasErrors = false
    for (const file of modifiedFiles) {
      const content = await fs.readFile(file, 'utf8')
      const analysis = analyzeContent(content, file)
      const result = await updateMetadata(file, { 
        validateOnly: true, 
        prMode: true,
        dryRun: true,
        verbose: false,
        analysis
      })
      if (!result.isValid) {
        hasErrors = true
        console.error(`\n${file}:`)
        result.errors.forEach(error => console.error(`  - ${error}`))
      }
    }

    return !hasErrors
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const gitOutput = process.env.CHANGED_FILES || ''
  const modifiedFiles = gitOutput
    .split('\n')
    .filter(file => file.endsWith('.mdx'))
    .map(file => path.resolve(process.cwd(), file))

  if (modifiedFiles.length === 0) {
    console.log('\x1b[32m✓ Metadata validation: no files to check\x1b[0m')
    process.exit(0)
  }

  const validateFiles = async () => {
    let hasErrors = false
    for (const file of modifiedFiles) {
      const content = await fs.readFile(file, 'utf8')
      const analysis = analyzeContent(content, file)
      const result = await updateMetadata(file, { 
        validateOnly: true, 
        prMode: true,
        dryRun: true,
        verbose: false,
        analysis
      })
      if (!result.isValid) {
        console.log('\x1b[33m⚠️  Metadata validation warnings:\x1b[0m')
        console.log(`\nFile: ${file}`)
        result.errors.forEach(error => console.log(`  → ${error}`))
        
        // Show suggestions if available
        if (result.suggestions?.categories?.length || result.suggestions?.content_type) {
          console.log('\nSuggested metadata:')
          if (result.suggestions.content_type) {
            console.log(`  content_type: ${result.suggestions.content_type}`)
          }
          if (result.suggestions.categories?.length) {
            console.log(`  categories: ${result.suggestions.categories.join(', ')}`)
          }
        }
        
        console.log('\nTo fix these warnings:')
        console.log('1. Add required metadata to your MDX file\'s frontmatter:')
        console.log('```yaml')
        console.log('---')
        console.log('title: Your Title')
        console.log('lang: en-US')
        console.log('description: A brief description')
        console.log('---')
        console.log('```')
        console.log('\n2. Or run these commands to auto-fix:')
        console.log('pnpm metadata-batch-cli:dry    # See what would change')
        console.log('pnpm metadata-batch-cli        # Apply the changes')
        hasErrors = true
      }
    }
    // Always exit with 0 to make it non-blocking
    process.exit(0)
  }

  validateFiles().catch(error => {
    console.error('\x1b[33m⚠️  Metadata validation error occurred (non-blocking)\x1b[0m')
    console.error(error)
    // Exit with 0 even on error to make it non-blocking
    process.exit(0)
  })
}

async function loadConfig(configPath: string): Promise<any> {
  const content = await fs.readFile(configPath, 'utf8')
  return yaml.load(content)
}

async function validateConfig(configPath: string): Promise<void> {
  const config = await loadConfig(configPath)
  if (!config.metadata_rules) {
    throw new Error('Invalid config: missing metadata_rules')
  }
  // Silently validate - no console output at all
}

/**
 * Updates the metadata in a markdown file
 * @param filepath Path to the markdown file
 * @param options Options for updating the metadata
 * @returns Validation result
 */
export async function updateMetadataFile(
  filepath: string,
  options: {
    dryRun?: boolean;
    verbose?: boolean;
    analysis: MetadataResult;
    validateOnly?: boolean;
    prMode?: boolean;
  }
): Promise<ValidationResult> {
  try {
    const content = await fs.readFile(filepath, 'utf8')
    const { data: frontmatter, content: docContent } = matter(content)
    
    // Create new metadata object with all fields
    const newMetadata = {
      title: options.analysis.title || frontmatter.title || '',
      description: frontmatter.description || options.analysis.description || '',
      lang: frontmatter.lang || options.analysis.lang || 'en-US',
      content_type: options.analysis.suggestions?.content_type || options.analysis.content_type || '',
      topic: options.analysis.suggestions?.topic || options.analysis.topic || '',
      personas: options.analysis.suggestions?.personas || options.analysis.personas || [],
      categories: options.analysis.suggestions?.categories || options.analysis.categories || [],
      is_imported_content: frontmatter.is_imported_content !== undefined 
        ? frontmatter.is_imported_content 
        : options.analysis.is_imported_content || false
    }

    // Validate the metadata
    const validationResult = validateMetadata(newMetadata, filepath)
    
    if (options.validateOnly) {
      return validationResult
    }

    if (!validationResult.isValid && options.prMode) {
      if (options.verbose) {
        console.log(`Skipping ${filepath} due to validation errors in PR mode`)
      }
      return validationResult
    }

    // If dry run, just return the validation result
    if (options.dryRun) {
      if (options.verbose) {
        console.log(`Would update ${filepath} with:`, newMetadata)
      }
      return validationResult
    }

    // Create the new file content with updated frontmatter
    const updatedFileContent = matter.stringify(docContent, newMetadata)
    
    try {
      // Write to a temporary file first
      const tempFilePath = `${filepath}.tmp`
      await fs.writeFile(tempFilePath, updatedFileContent, 'utf8')
      
      // Verify the temp file was written successfully
      const tempFileStats = await fs.stat(tempFilePath)
      if (tempFileStats.size === 0) {
        throw new Error(`Failed to write to temporary file ${tempFilePath}`)
      }
      
      // Rename the temp file to the original file
      await fs.rename(tempFilePath, filepath)
      
      if (options.verbose) {
        console.log(`✅ Successfully wrote metadata to ${filepath}`);
      }
      
      return {
        isValid: true,
        errors: [],
        suggestions: {}
      }
    } catch (writeError) {
      console.error(`❌ Failed to write to ${filepath}:`, writeError);
      throw writeError;
    }
  } catch (error) {
    console.error(`Error processing ${filepath}:`, error);
    return {
      isValid: false,
      errors: [`Failed to update metadata for ${filepath}: ${error.message}`],
      suggestions: {}
    }
  }
}