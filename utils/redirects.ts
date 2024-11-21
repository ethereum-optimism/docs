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
 const content = await fs.readFile(redirectsPath, 'utf-8');
 return content.split('\n')
   .filter(line => line.trim() && !line.startsWith('#'))
   .map(line => {
     const [from, to] = line.split(/\s+/);
     return { from, to };
   });
}

async function findMdxFiles(dir: string): Promise<string[]> {
 const files: string[] = [];
 const entries = await fs.readdir(dir, { withFileTypes: true });

 for (const entry of entries) {
   const fullPath = path.join(dir, entry.name);
   if (entry.isDirectory() && !entry.name.startsWith('_')) {
     files.push(...await findMdxFiles(fullPath));
   } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
     files.push(fullPath);
   }
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
 const content = await fs.readFile(filePath, 'utf-8');
 const links = extractLinks(content);
 const relativeFilePath = path.relative(rootDir, filePath);

 links.forEach(link => {
   const redirect = redirects.find(r => r.from === link);
   if (redirect) {
     warnings.push(formatWarning(relativeFilePath, link, redirect.to));
   }
 });
}

function printSummary(summary: Summary) {
 console.log('\nSummary:');
 console.log(`${WHITE}Total pages 🔍 - ${summary.total}`);
 console.log(`${YELLOW}Pages broken 🚫 - ${summary.errors}`);
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
   const redirects = await getRedirects();
   const files = await findMdxFiles(rootDir);
   
   summary.total = files.length;

   for (const file of files) {
     await checkFile(file, redirects);
   }

   summary.errors = warnings.length;
   summary.ok = summary.total - summary.errors;

   if (warnings.length > 0) {
     console.log(`${YELLOW}${BOLD}Links that need updating:${RESET}`);
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

main().catch(error => {
 console.error(`${YELLOW}${BOLD}Error in main process:${RESET}`, error);
 process.exit(1);
});