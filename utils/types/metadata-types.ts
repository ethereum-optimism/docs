import yaml from 'js-yaml'
import { promises as fs } from 'node:fs'
import path from 'node:path'

let config: MetadataConfig | null = null;

export async function loadConfig(): Promise<MetadataConfig> {
  if (config) return config;
  
  const configPath = path.join(process.cwd(), 'keywords.config.yaml')
  const configContent = await fs.readFile(configPath, 'utf8')
  const loadedConfig = yaml.load(configContent) as MetadataConfig

  if (!isValidConfig(loadedConfig)) {
    throw new Error('Invalid keywords.config.yaml structure')
  }

  config = loadedConfig
  return config
}

// Type guard to ensure the config has the expected structure
function isValidConfig(config: any): config is MetadataConfig {
  return (
    config &&
    config.metadata_rules &&
    config.metadata_rules.persona?.validation_rules?.[0]?.enum &&
    config.metadata_rules.content_type?.validation_rules?.[0]?.enum &&
    config.metadata_rules.categories?.values &&
    config.metadata_rules.is_imported_content?.validation_rules?.[0]?.enum
  )
}

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
      }>
      values: string[]
    }
    is_imported_content: {
      required: boolean
      multiple: boolean
      validation_rules: Array<{
        enum: ['true', 'false']
        description: string
      }>
    }
  }
}

export interface MetadataResult {
  title: string
  lang: string
  description: string
  topic: string
  personas: Array<string>
  content_type: string
  categories: Array<string>
  is_imported_content: string
  content?: string
  detectionLog?: Array<string>
  suggestions?: {
    content_type?: string
    categories?: string[]
    topic?: string
    personas?: string[]
  }
}

export interface ProcessedFile {
  file: string
  topic: string
  is_imported: boolean
}

export interface Manifest {
  timestamp: string
  processed_files: Array<ProcessedFile>
}

export interface MetadataOptions {
  dryRun: boolean;
  verbose: boolean;
  analysis: MetadataResult;
  validateOnly: boolean;
  prMode: boolean;
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  suggestions?: {
    validPersonas: string[]
    validContentTypes: string[]
    validCategories: string[]
  }
}

export const getConfig = () => {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.')
  }
  return config
}