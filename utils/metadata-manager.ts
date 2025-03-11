import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import { MetadataResult, MetadataOptions, ValidationResult, loadConfig as loadMetadataConfig, MetadataConfig } from './types/metadata-types'

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

// Helper function to generate suggestions
function generateSuggestions(config: MetadataConfig) {
  return {
    validPersonas: config.metadata_rules.persona.validation_rules[0].enum,
    validContentTypes: config.metadata_rules.content_type.validation_rules[0].enum,
    validCategories: config.metadata_rules.categories.values
  }
}

// Validation functions
export async function validateMetadata(filepath: string, content: string): Promise<ValidationResult> {
  const { data: frontmatter } = matter(content)
  const errors: string[] = []
  
  // Load config
  const config = await loadMetadataConfig()
  
  // Check required fields
  if (!frontmatter.title) errors.push('Missing required field: title')
  if (!frontmatter.description) errors.push('Missing required field: description')
  if (!frontmatter.topic) errors.push('Missing required field: topic')
  
  // Check personas
  if (!frontmatter.personas || !Array.isArray(frontmatter.personas)) {
    errors.push('Missing or invalid personas array')
  } else {
    if (frontmatter.personas.length < config.metadata_rules.persona.min) {
      errors.push(`At least ${config.metadata_rules.persona.min} persona is required`)
    }
    const validPersonas = config.metadata_rules.persona.validation_rules[0].enum
    frontmatter.personas.forEach(persona => {
      if (!validPersonas.includes(persona)) {
        errors.push(`Invalid persona: ${persona}`)
      }
    })
  }

  // Check content_type
  if (!frontmatter.content_type) {
    errors.push('Missing content_type')
  } else {
    const validTypes = config.metadata_rules.content_type.validation_rules[0].enum
    if (!validTypes.includes(frontmatter.content_type)) {
      errors.push(`Invalid content_type: ${frontmatter.content_type}`)
    }
  }

  // Check categories
  if (!frontmatter.categories || !Array.isArray(frontmatter.categories)) {
    errors.push('Missing or invalid categories array')
  } else {
    // Check minimum categories
    if (frontmatter.categories.length < config.metadata_rules.categories.min) {
      errors.push(`At least ${config.metadata_rules.categories.min} category is required`)
    }
    // Check maximum categories
    if (frontmatter.categories.length > config.metadata_rules.categories.max) {
      errors.push(`Maximum ${config.metadata_rules.categories.max} categories allowed`)
    }
    // Check for duplicates
    const uniqueCategories = new Set(frontmatter.categories)
    if (uniqueCategories.size !== frontmatter.categories.length) {
      errors.push('Duplicate categories are not allowed')
    }
    const validCategories = config.metadata_rules.categories.values
    frontmatter.categories.forEach(category => {
      if (!validCategories.includes(category)) {
        errors.push(`Invalid category: ${category}`)
      }
    })
  }

  // Add this new check for is_imported_content
  if (frontmatter.is_imported_content === undefined) {
    errors.push('Missing is_imported_content field (required for duplicate page handling)')
  } else if (typeof frontmatter.is_imported_content !== 'string' || 
    !['true', 'false'].includes(frontmatter.is_imported_content)) {
    errors.push('is_imported_content must be a string: "true" or "false"')
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions: generateSuggestions(config)
  }
}

// Generation functions
export async function generateMetadata(filePath: string): Promise<MetadataResult> {
  const content = await fs.readFile(filePath, 'utf8')
  const { data: existingMetadata } = matter(content)

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
    const config = await loadMetadataConfig()

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

    // Validate metadata in all cases
    const validationResult = await validateMetadata(filepath, content)

    // Check validation mode
    if (options.validateOnly || options.prMode) {
      return {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        suggestions: generateSuggestions(config)
      }
    }

    // Only write if not in dry run mode and validation passed
    if (!options.dryRun && validationResult.isValid) {
      const updatedContent = matter.stringify(docContent, newMetadata)
      await fs.writeFile(filepath, updatedContent, 'utf8')
    }

    return {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      suggestions: generateSuggestions(config)
    }
  } catch (error) {
    const config = await loadMetadataConfig()
    return {
      isValid: false,
      errors: [`Failed to update metadata for ${filepath}: ${error.message}`],
      suggestions: generateSuggestions(config)
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
      const result = await updateMetadata(file, { 
        validateOnly: true, 
        prMode: true,
        dryRun: true,
        verbose: false,
        analysis: await generateMetadata(file)
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
      const result = await updateMetadata(file, { 
        validateOnly: true, 
        prMode: true,
        dryRun: true,
        verbose: false,
        analysis: await generateMetadata(file)
      })
      if (!result.isValid) {
        console.log('\x1b[33m⚠️  Metadata validation warnings:\x1b[0m')
        console.log(`\nFile: ${file}`)
        result.errors.forEach(error => console.log(`  → ${error}`))
        
        // Show suggestions if available
        if (result.suggestions?.validPersonas?.length || result.suggestions?.validContentTypes) {
          console.log('\nSuggested metadata:')
          if (result.suggestions.validContentTypes) {
            console.log(`  content_type: ${result.suggestions.validContentTypes}`)
          }
          if (result.suggestions.validPersonas?.length) {
            console.log(`  personas: ${result.suggestions.validPersonas.join(', ')}`)
          }
        }
        
        console.log('\nTo fix these warnings:')
        console.log('Add required metadata to your MDX file\'s frontmatter:')
        console.log('```yaml')
        console.log('---')
        console.log('title: Your Title')
        console.log('lang: en-US')
        console.log('description: A brief description')
        console.log('topic: Your Topic')
        console.log('personas: [Your Persona]')
        console.log('content_type: Your Content Type')
        console.log('categories: [Your Category]')
        console.log('is_imported_content: "false"')
        console.log('---')
        console.log('```')
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

export async function updateMetadataFile(
  filepath: string,
  options: {
    dryRun?: boolean;
    verbose?: boolean;
    analysis: MetadataResult;
    validateOnly: boolean;
    prMode: boolean;
  }
): Promise<{ isValid: boolean; errors: string[]; metadata: MetadataResult }> {
  try {
    const content = await fs.readFile(filepath, 'utf8')
    const { data: frontmatter } = matter(content)
    const result = await validateMetadata(filepath, content)
    
    // Return early if validation failed
    if (!result.isValid) {
      return {
        isValid: false,
        errors: result.errors,
        metadata: options.analysis
      }
    }

    // ... rest of function
  } catch (error) {
    throw new Error(`Failed to update metadata for ${filepath}: ${error.message}`)
  }
}