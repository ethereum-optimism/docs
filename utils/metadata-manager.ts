import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import { analyzeContent } from './metadata-analyzer'
import { 
  MetadataResult, 
  VALID_PERSONAS, 
  VALID_CONTENT_TYPES, 
  VALID_CATEGORIES 
} from './types/metadata-types'

// Validation functions
export function validateMetadata(metadata: MetadataResult, filePath: string): string[] {
  const errors: string[] = []
  const isLandingPage = filePath.includes('index.mdx') || 
                       (metadata.content && metadata.content.includes('<Cards>'))

  // Required fields for all pages
  if (!metadata.title) errors.push('Missing title')
  if (!metadata.lang) errors.push('Missing lang')
  if (!metadata.description) errors.push('Missing description')
  if (!metadata.topic) errors.push('Missing topic')

  // Additional validations for non-landing pages
  if (!isLandingPage) {
    // Validate personas
    if (!metadata.personas || metadata.personas.length === 0) {
      errors.push('Missing personas')
    } else {
      const invalidPersonas = metadata.personas.filter(p => !VALID_PERSONAS.includes(p as any))
      if (invalidPersonas.length > 0) {
        errors.push(`Invalid personas: ${invalidPersonas.join(', ')}`)
      }
    }

    // Validate content_type
    if (!metadata.content_type) {
      errors.push('Missing content_type')
    } else if (!VALID_CONTENT_TYPES.includes(metadata.content_type as any)) {
      errors.push(`Invalid content_type: ${metadata.content_type}`)
    }

    // Validate categories
    if (!metadata.categories || metadata.categories.length === 0) {
      errors.push('Missing categories')
    } else {
      const invalidCategories = metadata.categories.filter(c => !VALID_CATEGORIES.includes(c as any))
      if (invalidCategories.length > 0) {
        errors.push(`Invalid categories: ${invalidCategories.join(', ')}`)
      }
    }
  }

  return errors
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
    content_type: existingMetadata.content_type || analysis.content_type || 'guide',
    categories: existingMetadata.categories || analysis.categories || [],
    is_imported_content: existingMetadata.is_imported_content || 'false',
    content: content  // Include content for landing page detection
  }

  return metadata
}

// Combined update function with validation
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

    // If validate only, just return validation results
    if (options.validateOnly) {
      const errors = validateMetadata(currentMetadata as MetadataResult, filePath)
      return {
        isValid: errors.length === 0,
        errors
      }
    }

    // Generate new metadata
    const newMetadata = await generateMetadata(filePath)
    
    // Validate the new metadata
    const errors = validateMetadata(newMetadata, filePath)

    // If not dry run and valid, update the file
    if (!options.dryRun && errors.length === 0) {
      const updatedContent = matter.stringify(content, newMetadata)
      await fs.writeFile(filePath, updatedContent)
    }

    return {
      isValid: errors.length === 0,
      errors,
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
      console.log('No .mdx files modified')
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

// CLI support - update to use import.meta.url instead of require.main
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  if (args.includes('--pr')) {
    validatePRChanges().then(success => {
      process.exit(success ? 0 : 1)
    })
  }
}