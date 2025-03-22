#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import { validateMetadata } from './metadata-manager'
import { loadConfig } from './types/metadata-types'

async function main() {
  try {
    // Load config first to ensure it's available
    await loadConfig()
    
    const changedFiles = process.env.CHANGED_FILES?.split('\n').filter(f => f.endsWith('.mdx')) || []
    
    if (changedFiles.length === 0) {
      console.log('✓ No MDX files to check')
      process.exit(0)
    }

    console.log('Changed files:', changedFiles)
    let hasErrors = false

    for (const file of changedFiles) {
      try {
        console.log(`\nChecking file: ${file}`)
        const content = await fs.readFile(file, 'utf8')
        console.log('File content loaded')
        const result = await validateMetadata(file, content)
        console.log('Validation completed')

        if (!result.isValid) {
          hasErrors = true
          console.log(`\nFile: ${file}`)
          console.log('Validation errors:')
          result.errors.forEach(error => console.log(`  ❌ ${error}`))
          console.log('\nValid options can be found in keywords.config.yaml:')
          console.log('  - Personas:', result.suggestions?.validPersonas.join(', '))
          console.log('  - Content Types:', result.suggestions?.validContentTypes.join(', '))
          console.log('  - Categories:', result.suggestions?.validCategories.join(', '))
          console.log('  - Is Imported Content: true, false')
        } else {
          console.log(`✓ ${file} passed validation`)
        }
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError)
        hasErrors = true
      }
    }

    if (hasErrors) {
      process.exit(1)
    }
    
    console.log('✓ All files passed validation')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Use top-level await pattern for better error handling
main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
