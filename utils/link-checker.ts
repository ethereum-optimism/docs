import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as glob from 'glob';
import matter from 'gray-matter';

// Promisify fs functions
const readFile = promisify(fs.readFile);

// Types
interface BrokenLink {
  sourcePath: string;
  linkPath: string;
  lineNumber: number;
}

interface AuditReport {
  timestamp: string;
  totalFiles: number;
  totalLinks: number;
  brokenLinks: BrokenLink[];
  summary: {
    totalBrokenLinks: number;
    affectedFiles: number;
  };
  elapsedTime: string;
}

// Configuration
const config = {
  rootDir: path.resolve(process.cwd(), 'pages'),
  fileExtensions: ['.mdx', '.md', '.tsx', '.jsx', '.ts', '.js'],
  excludePatterns: [
    /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)($|\?)/i,
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)($|\?)/i,
    /\.(css|scss|less|sass)($|\?)/i,
    /\.(js|jsx|ts|tsx)($|\?)/i,
    /^(https?|ftp|mailto):/i,
    /^#/,  // Anchor links
  ],
};

/**
 * Main function to run the link checker
 */
async function runLinkChecker(): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Get all documentation files
    const allFiles = await findAllDocFiles();
    
    // Extract all internal links from files
    const { allLinks, brokenLinks } = await checkLinks(allFiles);
    
    // Generate report
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const report = generateReport(allFiles.length, allLinks, brokenLinks, duration);
    
    // Display report
    displayReport(report);
    
  } catch (error) {
    console.error('❌ Error running link checker:', error);
    process.exit(1);
  }
}

/**
 * Find all documentation files in the pages directory
 */
async function findAllDocFiles(): Promise<string[]> {
  const patterns = config.fileExtensions.map(ext => `${config.rootDir}/**/*${ext}`);
  const filesArrays = await Promise.all(patterns.map(pattern => glob.glob(pattern)));
  
  // Flatten arrays and filter out node_modules if any exist
  return filesArrays
    .flat()
    .filter(file => !file.includes('node_modules'));
}

/**
 * Extract and validate all links from the files
 */
async function checkLinks(files: string[]): Promise<{
  allLinks: string[];
  brokenLinks: BrokenLink[];
}> {
  const allLinks: string[] = [];
  const brokenLinks: BrokenLink[] = [];
  const existingPaths = new Set<string>();
  
  // First, collect all valid paths
  for (const file of files) {
    const relativePath = path.relative(config.rootDir, file);
    
    // Add the file path without extension
    const pathWithoutExt = removeExtension(relativePath);
    existingPaths.add(normalizeFilePath(pathWithoutExt));
    
    // Handle index files
    if (pathWithoutExt.endsWith('/index') || pathWithoutExt === 'index') {
      const dirPath = pathWithoutExt.replace(/index$/, '').replace(/\/$/, '');
      if (dirPath) existingPaths.add(normalizeFilePath(dirPath));
    }
  }
  
  // Now check all links
  for (const file of files) {
    const fileContent = await readFile(file, 'utf8');
    const relativePath = path.relative(config.rootDir, file);
    
    // Extract links from content
    const extractedLinks = extractLinks(fileContent);
    allLinks.push(...extractedLinks.links);
    
    // Check each link
    for (const { link, lineNumber } of extractedLinks.linkDetails) {
      if (shouldSkipLink(link)) continue;
      
      const normalizedLink = normalizeLink(link);
      const resolvedLink = resolveLink(normalizedLink, relativePath);
      
      if (!existingPaths.has(resolvedLink)) {
        brokenLinks.push({
          sourcePath: relativePath,
          linkPath: link,
          lineNumber,
        });
      }
    }
  }
  
  return { allLinks, brokenLinks };
}

/**
 * Extract links from file content
 */
function extractLinks(content: string): {
  links: string[],
  linkDetails: Array<{link: string, lineNumber: number}>
} {
  const links: string[] = [];
  const linkDetails: Array<{link: string, lineNumber: number}> = [];
  
  // Remove frontmatter if present
  let cleanContent = content;
  try {
    const { content: contentWithoutFrontmatter } = matter(content);
    cleanContent = contentWithoutFrontmatter;
  } catch (error) {
    // Not a markdown file with frontmatter, continue with original content
  }
  
  // Match markdown links [text](link)
  const markdownLinkRegex = /\[(?:[^\[\]]+)\]\(([^)]+)\)/g;
  let match;
  const lines = cleanContent.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    let lineMatch;
    
    // Check markdown links in each line
    while ((lineMatch = markdownLinkRegex.exec(line)) !== null) {
      const link = lineMatch[1].split(' ')[0].trim();  // Handle cases with titles: [text](link "title")
      links.push(link);
      linkDetails.push({ link, lineNumber: lineNum });
    }
    
    // Check JSX/TSX links (href="..." or href={...})
    const jsxLinkRegexSingleQuote = /href=['"]([^'"]+)['"]/g;
    const jsxLinkRegexDoubleQuote = /href=["']([^"']+)["']/g;
    const jsxLinkRegexCurly = /href=\{['"]?([^'"}\s]+)['"]?\}/g;
    
    [jsxLinkRegexSingleQuote, jsxLinkRegexDoubleQuote, jsxLinkRegexCurly].forEach(regex => {
      while ((lineMatch = regex.exec(line)) !== null) {
        const link = lineMatch[1].trim();
        links.push(link);
        linkDetails.push({ link, lineNumber: lineNum });
      }
    });
  });
  
  return { links, linkDetails };
}

/**
 * Determine if a link should be skipped based on exclusion patterns
 */
function shouldSkipLink(link: string): boolean {
  // Skip empty links
  if (!link.trim()) return true;
  
  // Check against exclude patterns
  return config.excludePatterns.some(pattern => pattern.test(link));
}

/**
 * Normalize a link for comparison
 */
function normalizeLink(link: string): string {
  let normalizedLink = link;
  
  // Remove query parameters and hash
  normalizedLink = normalizedLink.split(/[?#]/)[0];
  
  // Handle relative paths
  if (normalizedLink.startsWith('./')) {
    normalizedLink = normalizedLink.substring(2);
  }
  
  return normalizedLink;
}

/**
 * Resolve a link path relative to the source file
 */
function resolveLink(link: string, sourcePath: string): string {
  // If it's an absolute path (starts with /), resolve from root
  if (link.startsWith('/')) {
    // Remove leading slash for comparison with our path set
    return normalizeFilePath(link.substring(1));
  }
  
  // Handle relative paths
  const sourceDir = path.dirname(sourcePath);
  if (sourceDir === '.') {
    return normalizeFilePath(link);
  }
  
  let resolvedPath;
  if (link.startsWith('../')) {
    // Go up a directory
    const relativeParent = path.resolve(sourceDir, '..');
    const relativePath = path.relative(config.rootDir, relativeParent);
    resolvedPath = path.join(relativePath, link.substring(3));
  } else {
    resolvedPath = path.join(sourceDir, link);
  }
  
  return normalizeFilePath(resolvedPath);
}

/**
 * Normalize a file path for consistent comparison
 */
function normalizeFilePath(filePath: string): string {
  // Remove ./ if present at the beginning
  let normalizedPath = filePath.replace(/^\.\//, '');
  
  // Ensure consistent path separators
  normalizedPath = normalizedPath.replace(/\\/g, '/');
  
  // Remove trailing slash if present
  normalizedPath = normalizedPath.replace(/\/$/, '');
  
  return normalizedPath;
}

/**
 * Remove file extension from path
 */
function removeExtension(filePath: string): string {
  const extname = path.extname(filePath);
  if (config.fileExtensions.includes(extname)) {
    return filePath.substring(0, filePath.length - extname.length);
  }
  return filePath;
}

/**
 * Generate the audit report
 */
function generateReport(
  totalFiles: number,
  allLinks: string[],
  brokenLinks: BrokenLink[],
  elapsedTime: string
): AuditReport {
  // Count unique affected files
  const affectedFiles = new Set(brokenLinks.map(link => link.sourcePath)).size;
  
  return {
    timestamp: new Date().toISOString(),
    totalFiles,
    totalLinks: allLinks.length,
    brokenLinks,
    summary: {
      totalBrokenLinks: brokenLinks.length,
      affectedFiles,
    },
    elapsedTime
  };
}

/**
 * Display the report in console output
 */
function displayReport(report: AuditReport): void {
  // Format similar to the example output
  const totalCount = report.totalFiles + report.summary.totalBrokenLinks;
  const okCount = report.totalFiles - report.summary.affectedFiles;
  const errorCount = report.summary.totalBrokenLinks;
  const excludedCount = 0; // We don't track this but could add it
  const timeoutCount = 0;  // We don't track this but could add it
  
  console.log(`\n${totalCount} Total (in ${report.elapsedTime}s) ✅ ${okCount} OK ❌ ${errorCount} Errors 🚫 ${excludedCount} Excluded ⏱️ ${timeoutCount} Timeouts`);
  
  if (report.brokenLinks.length > 0) {
    // Sort broken links by source path for better organization
    const sortedLinks = [...report.brokenLinks].sort((a, b) => 
      a.sourcePath.localeCompare(b.sourcePath) || a.lineNumber - b.lineNumber
    );
    
    // Group by source file
    const linksBySource: Record<string, BrokenLink[]> = {};
    sortedLinks.forEach(link => {
      if (!linksBySource[link.sourcePath]) {
        linksBySource[link.sourcePath] = [];
      }
      linksBySource[link.sourcePath].push(link);
    });
    
    // Print broken links grouped by file
    Object.entries(linksBySource).forEach(([sourcePath, links]) => {
      console.log(`\nFile: ${sourcePath}`);
      links.forEach(link => {
        console.log(`  Line ${link.lineNumber}: Broken link to "${link.linkPath}"`);
      });
    });
    
    // Print summary line at the end
    console.log(`\n❌ LIFECYCLE\tCommand failed with exit code 1.`);
    process.exit(1); // Exit with error code if broken links found
  } else {
    console.log(`\n✅ LIFECYCLE\tCommand completed successfully.`);
  }
}

// Run the script
runLinkChecker().catch(console.error);