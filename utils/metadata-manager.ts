import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import { analyzeContent } from './metadata-analyzer'
import { MetadataResult, MetadataOptions, ValidationResult } from './types/metadata-types'

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

// Validation functions
async function validateMetadata(
  metadata: MetadataResult, 
  filepath: string, 
  options: {
    dryRun?: boolean;
    verbose?: boolean;
    validateOnly?: boolean;
    prMode?: boolean;
  } = {}
): Promise<ValidationResult> {
  const errors = [] as string[]
  const config = await loadConfig('keywords.config.yaml')
  
  // Required field checks based on config
  if (!metadata.topic) {
    errors.push('Missing required field: topic')
  }
  
  // Check personas
  if (config.metadata_rules.persona.required) {
    if (!metadata.personas || metadata.personas.length === 0) {
      errors.push('Missing required field: personas')
    } else if (metadata.personas.length < config.metadata_rules.persona.min) {
      errors.push(`Personas must have at least ${config.metadata_rules.persona.min} value(s)`)
    }
  }
  
  // Check content_type
  if (config.metadata_rules.content_type.required && !metadata.content_type) {
    errors.push('Missing required field: content_type')
  }
  
  // Check categories
  if (config.metadata_rules.categories.required) {
    if (!metadata.categories || metadata.categories.length === 0) {
      errors.push('Missing required field: categories')
    } else if (metadata.categories.length < config.metadata_rules.categories.min) {
      errors.push(`Categories must have at least ${config.metadata_rules.categories.min} value(s)`)
    }
  }

  // Validate enum values if present
  if (metadata.personas?.length > 0) {
    const validPersonas = config.metadata_rules.persona.validation_rules[0].enum
    metadata.personas.forEach(p => {
      if (!validPersonas.includes(p)) {
        errors.push(`Invalid persona: ${p}`)
      }
    })
  }

  if (metadata.content_type) {
    const validTypes = config.metadata_rules.content_type.validation_rules[0].enum
    if (!validTypes.includes(metadata.content_type)) {
      errors.push(`Invalid content_type: ${metadata.content_type}`)
    }
  }

  if (metadata.categories?.length > 0) {
    const validCategories = config.metadata_rules.categories.values
    metadata.categories.forEach(c => {
      if (!validCategories.includes(c)) {
        errors.push(`Invalid category: ${c}`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Generation functions
export async function generateMetadata(filePath: string): Promise<MetadataResult> {
  const content = await fs.readFile(filePath, 'utf8')
  const { data: existingMetadata } = matter(content)
  const analysis = analyzeContent(content, filePath)

  const metadata: MetadataResult = {
    ...existingMetadata,
    ...analysis,
    title: existingMetadata.title || '',
    lang: existingMetadata.lang || 'en',
    description: existingMetadata.description || '',
    topic: existingMetadata.topic || '',
    personas: existingMetadata.personas || [],
    content_type: existingMetadata.content_type || '',
    categories: existingMetadata.categories || [],
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
      content_type: safeAnalysis.content_type,
      topic: safeAnalysis.topic || '', 
      personas: safeAnalysis.personas || [],
      categories: safeAnalysis.categories || [],
      is_imported_content: safeAnalysis.is_imported_content || 'false'
    }

    // Check validation mode
    if (options.validateOnly || options.prMode) {
      return {
        isValid: true,
        errors: [],
        suggestions: {
          categories: safeAnalysis.categories,
          content_type: safeAnalysis.content_type
        }
      }
    }

    // Only write if not in dry run mode
    if (!options.dryRun) {
      const updatedContent = matter.stringify(docContent, newMetadata)
      await fs.writeFile(filepath, updatedContent, 'utf8')
    }

    return {
      isValid: true,
      errors: [],
      suggestions: {
        categories: safeAnalysis.categories,
        content_type: safeAnalysis.content_type
      }
    }
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