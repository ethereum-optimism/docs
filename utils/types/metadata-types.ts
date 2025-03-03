import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

// Load and parse keywords.config.yaml
const configPath = path.join(process.cwd(), 'keywords.config.yaml')
const yamlContent = yaml.load(fs.readFileSync(configPath, 'utf8')) as MetadataConfig

// Type guard to ensure the config has the expected structure
function isValidConfig(config: any): config is MetadataConfig {
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

export const VALID_PERSONAS = yamlContent.metadata_rules.persona.validation_rules[0].enum as readonly string[]
export const VALID_CONTENT_TYPES = yamlContent.metadata_rules.content_type.validation_rules[0].enum as readonly string[]
export const VALID_CATEGORIES = [
  'protocol',
  'infrastructure',
  'sequencer',
  'op-batcher',
  'rollup-node',
  'op-geth',
  'fault-proofs',
  'op-challenger',
  'cannon',
  'l1-deployment-upgrade-tooling',
  'l2-deployment-upgrade-tooling',
  'monitorism',
  'security',
  'automated-pause',
  'kubernetes-infrastructure',
  'cross-chain-messaging',
  'standard-bridge',
  'interoperable-message-passing',
  'hardhat',
  'foundry',
  'ethers',
  'viem',
  'supersim',
  'devnets',
  'mainnet',
  'testnet',
  'superchain-registry',
  'security-council',
  'blockspace-charters'
] as const;

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
        no_metadata_overlap?: {
          fields: string[]
        }
      }>
      values: string[]
    }
  }
}

// Type for metadata results
export interface MetadataResult {
  title: string
  lang: string
  description: string
  topic: string
  personas: Array<string>
  content_type: typeof VALID_CONTENT_TYPES[number]
  categories: Array<string>
  is_imported_content: string
  content?: string
  detectionLog?: Array<string>
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
  isValid: boolean;
  errors: string[];
  suggestions?: {
    categories?: string[];
    content_type?: string;
  };
}