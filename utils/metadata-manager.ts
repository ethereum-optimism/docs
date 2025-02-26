import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import { analyzeContent } from './metadata-analyzer.js'
import type { MetadataResult } from './types/metadata-types'

// Add the interfaces at the top of the file
interface ValidationOptions {
  prMode?: boolean
  dryRun?: boolean
  validateOnly?: boolean
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Validation functions
async function validateMetadata(metadata: MetadataResult, filepath: string, options: ValidationOptions = {}): Promise<ValidationResult> {
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
export async function updateMetadata(filePath: string, options: {
  dryRun?: boolean
  validateOnly?: boolean
  prMode?: boolean
} = {}): Promise<{
  isValid: boolean
  errors: string[]
  metadata?: MetadataResult
}> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const { data: currentMetadata } = matter(content)

    if (options.validateOnly) {
      const validationResult = await validateMetadata(currentMetadata as MetadataResult, filePath)
      return {
        isValid: validationResult.isValid,
        errors: validationResult.errors
      }
    }

    const newMetadata = await generateMetadata(filePath)
    const validationResult = await validateMetadata(newMetadata, filePath)

    if (!options.dryRun && validationResult.isValid) {
      const updatedContent = matter.stringify(content, newMetadata)
      const tempPath = `${filePath}.tmp`
      
      try {
        await fs.writeFile(tempPath, updatedContent)
        await fs.rename(tempPath, filePath)
      } catch (writeError) {
        try {
          await fs.unlink(tempPath)
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw writeError
      }
    }

    if (validationResult.errors.length > 0 && !options.prMode) {
      console.log(`\nMetadata validation errors in ${filePath}:`)
      validationResult.errors.forEach(error => console.log(`- ${error}`))
    }

    return {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      metadata: newMetadata
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`Error processing file: ${error.message}`]
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
      const result = await updateMetadata(file, { validateOnly: true, prMode: true })
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
      const result = await updateMetadata(file, { validateOnly: true, prMode: true })
      if (!result.isValid) {
        console.log('\x1b[33m⚠️  Metadata validation warnings:\x1b[0m')
        console.log(`\nFile: ${file}`)
        result.errors.forEach(error => console.log(`  → ${error}`))
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