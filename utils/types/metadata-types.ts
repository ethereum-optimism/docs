import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

// Load and parse keywords.config.yaml
const configPath = path.join(process.cwd(), 'keywords.config.yaml')
const yamlContent = yaml.load(fs.readFileSync(configPath, 'utf8'))

// Add debug logging
console.log('Config structure:', JSON.stringify(yamlContent, null, 2))

// Type guard to ensure the config has the expected structure
function isValidConfig(config: any): config is {
  metadata_rules: {
    persona: {
      required: boolean
      multiple: boolean
      min: number
      validation_rules: Array<{
        enum: string[]
        description: string
      }>
    }
    content_type: {
      required: boolean
      multiple: boolean
      validation_rules: Array<{
        enum: string[]
        description: string
      }>
    }
    categories: {
      required: boolean
      multiple: boolean
      min: number
      max: number
      validation_rules: Array<{
        no_duplicates: boolean
        description: string
        no_metadata_overlap?: {
          fields: string[]
        }
      }>
      values: string[]
    }
  }
} {
  // Add debug logging
  console.log('Checking config structure...')
  console.log('Has metadata_rules:', !!config?.metadata_rules)
  console.log('Has persona:', !!config?.metadata_rules?.persona)
  console.log('Has content_type:', !!config?.metadata_rules?.content_type)
  console.log('Has categories:', !!config?.metadata_rules?.categories)

  return (
    config &&
    config.metadata_rules &&
    config.metadata_rules.persona?.validation_rules?.[0]?.enum &&
    config.metadata_rules.content_type?.validation_rules?.[0]?.enum &&
    config.metadata_rules.categories?.values
  )
}

if (!isValidConfig(yamlContent)) {
  throw new Error('Invalid keywords.config.yaml structure')
}

// Define the arrays with their literal types
export const VALID_PERSONAS: readonly string[] = yamlContent.metadata_rules.persona.validation_rules[0].enum
export const VALID_CONTENT_TYPES: readonly string[] = yamlContent.metadata_rules.content_type.validation_rules[0].enum
export const VALID_CATEGORIES: readonly string[] = yamlContent.metadata_rules.categories.values

export interface ValidationRule {
  pattern?: string
  description?: string
  enum?: string[]
}

export interface MetadataField {
  required?: boolean
  multiple?: boolean
  validation_rules?: ValidationRule[]
}

export interface MetadataConfig {
  metadata_rules?: {
    topic?: MetadataField
    persona?: MetadataField
    content_type?: MetadataField
    categories?: MetadataField
    timeframe?: MetadataField
  }
}

// Type for metadata results
export interface MetadataResult {
  title: string
  lang: string
  description: string
  topic: string
  personas: typeof VALID_PERSONAS[number][]
  content_type: typeof VALID_CONTENT_TYPES[number]
  categories: typeof VALID_CATEGORIES[number][]
  is_imported_content: string
  content?: string  // Added for landing page detection
  timeframe?: string
  detectionLog?: string[] // Added for content analysis logging
}

export interface ProcessedFile {
  file: string
  topic: string
  is_imported: boolean
}

export interface Manifest {
  timestamp: string
  processed_files: ProcessedFile[]
}