#!/usr/bin/env node
// Save this file as utils/redirects.ts

import * as fs from 'fs/promises';
import * as path from 'path';

const rootDir = path.join(process.cwd(), 'pages');
const redirectsPath = path.join(process.cwd(), 'public', '_redirects');
const warnings: string[] = [];

// ANSI color codes
const WHITE = '\x1b[37m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

interface Redirect {
  from: string;
  to: string;
}

interface Summary {
  total: number;
  ok: number;
  errors: number;
}

function formatWarning(filePath: string, fromLink: string, toLink: string): string {
  return `${WHITE}File "${filePath}" contains outdated link ${YELLOW}"${fromLink}"${WHITE} - should be updated to ${GREEN}"${toLink}"${RESET}`;
}

async function getRedirects(): Promise<Redirect[]> {
  try {
    const content = await fs.readFile(redirectsPath, 'utf-8');
    return content.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const [from, to] = line.split(/\s+/);
        return { from, to };
      });
  } catch (error) {
    console.error(`${YELLOW}${BOLD}Error reading redirects file:${RESET}`, error);
    return [];
  }
}

async function findMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('_')) {
        files.push(...await findMdxFiles(fullPath));
      } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`${YELLOW}${BOLD}Error reading directory ${dir}:${RESET}`, error);
  }
  
  return files;
}

function extractLinks(content: string): string[] {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const hrefRegex = /href="([^"]+)"/g;
  const links: string[] = [];
  
  let match;
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    if (!match[2].startsWith('http')) {
      links.push(match[2]);
    }
  }
  while ((match = hrefRegex.exec(content)) !== null) {
    if (!match[1].startsWith('http')) {
      links.push(match[1]);
    }
  }
  return links;
}

async function checkFile(filePath: string, redirects: Redirect[]): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const links = extractLinks(content);
    const relativeFilePath = path.relative(rootDir, filePath);

    for (const link of links) {
      const redirect = redirects.find(r => r.from === link);
      if (redirect) {
        warnings.push(formatWarning(relativeFilePath, link, redirect.to));
      }
    }
  } catch (error) {
    console.error(`${YELLOW}${BOLD}Error checking file ${filePath}:${RESET}`, error);
  }
}

function printSummary(summary: Summary) {
  console.log('\nSummary:');
  console.log(`${WHITE}Total pages 🔍 - ${summary.total}`);
  console.log(`${YELLOW}Pages with outdated links 🚫 - ${summary.errors}`);
  console.log(`${GREEN}Pages OK ✅ - ${summary.ok}${RESET}`);
}

async function main() {
  const summary: Summary = {
    total: 0,
    ok: 0,
    errors: 0
  };

  console.log('Starting redirect link check...');
  console.log('Root directory:', rootDir);

  try {
    // Check if directories exist
    try {
      await fs.access(rootDir);
    } catch (error) {
      console.error(`${YELLOW}${BOLD}Error: Root directory not found at ${rootDir}${RESET}`);
      console.log('Current working directory:', process.cwd());
      process.exit(1);
    }

    try {
      await fs.access(redirectsPath);
    } catch (error) {
      console.error(`${YELLOW}${BOLD}Error: Redirects file not found at ${redirectsPath}${RESET}`);
      process.exit(1);
    }

    const redirects = await getRedirects();
    console.log(`Loaded ${redirects.length} redirects from ${redirectsPath}`);
    
    const files = await findMdxFiles(rootDir);
    console.log(`Found ${files.length} MDX files to check`);
    
    summary.total = files.length;

    for (const file of files) {
      await checkFile(file, redirects);
    }

    // Count files with errors, not total errors
    const filesWithErrors = new Set(warnings.map(w => w.split('"')[1])).size;
    summary.errors = filesWithErrors;
    summary.ok = summary.total - filesWithErrors;

    if (warnings.length > 0) {
      console.log(`${YELLOW}${BOLD}Found ${warnings.length} links that need updating:${RESET}`);
      warnings.forEach(warning => console.log(warning));
      printSummary(summary);
      process.exit(1);
    } else {
      console.log(`${GREEN}All internal links are up to date.${RESET}`);
      printSummary(summary);
    }
  } catch (error) {
    console.error(`${YELLOW}${BOLD}Error checking redirects:${RESET}`, error);
    process.exit(1);
  }
}

// Execute the script
main().catch(error => {
  console.error(`${YELLOW}${BOLD}Error in main process:${RESET}`, error);
  process.exit(1);
});