import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import readline from 'readline';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  brightRed: '\x1b[91m',
  brightYellow: '\x1b[93m',
  brightGreen: '\x1b[92m',
  bold: '\x1b[1m',
};

interface BrokenLink {
  sourcePath: string;
  linkPath: string;
  lineNumber: number;
  originalText?: string;
}

interface FixedLink {
  sourcePath: string;
  oldLinkPath: string;
  newLinkPath: string;
  lineNumber: number;
}

interface AutoFixResult {
  fixed: FixedLink[];
  unfixable: BrokenLink[];
}

interface AuditReport {
  timestamp: string;
  totalFiles: number;
  totalLinks: number;
  brokenLinks: BrokenLink[];
  fixedLinks?: FixedLink[];
  summary: {
    totalBrokenLinks: number;
    totalFixedLinks?: number;
    affectedFiles: number;
    fixedFiles?: number;
  };
  elapsedTime: string;
}

const config = {
  rootDir: path.resolve(process.cwd(), 'pages'),
  fileExtensions: ['.mdx', '.md', '.tsx', '.jsx', '.ts', '.js'],
  excludePatterns: [
    /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)($|\?)/i,
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)($|\?)/i,
    /\.(css|scss|less|sass)($|\?)/i,
    /\.(js|jsx|ts|tsx|json)($|\?)/i,
    /^(https?|ftp|mailto):/i,
    /^#/,
  ],
  autoFix: true,           // Enable auto-fixing
  interactiveMode: false,  // Disable interactive confirmation for fixes
  fixOptions: {
    maxEditDistance: 2,    // Max Levenshtein distance for suggesting similar paths
    checkCaseInsensitive: true, // Check for case mismatches
    checkExtensions: true, // Try alternative extensions
    deleteOrphanedLinks: false, // Option to delete links that can't be fixed
  },
  backupFiles: false,      // Don't create backups before fixing
};

async function runLinkFixer(): Promise<void> {
  const startTime = Date.now();
  
  try {
    const allFiles = await findAllDocFiles();
    
    const { allLinks, brokenLinks } = await checkLinks(allFiles);
    
    let fixedLinks: FixedLink[] = [];
    let remainingBrokenLinks: BrokenLink[] = brokenLinks;

    if (config.autoFix && brokenLinks.length > 0) {
      const fixResult = await fixBrokenLinks(brokenLinks, allFiles);
      fixedLinks = fixResult.fixed;
      remainingBrokenLinks = fixResult.unfixable;
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const report = generateReport(allFiles.length, allLinks, remainingBrokenLinks, fixedLinks, duration);
    
    displayReport(report);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error running link fixer:${colors.reset}`, error);
    process.exit(1);
  }
}

async function findAllDocFiles(dir = config.rootDir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        return findAllDocFiles(filePath);
      }
      
      if (entry.isFile() && config.fileExtensions.some(ext => entry.name.endsWith(ext))) {
        return [filePath];
      }
      
      return [];
    })
  );
  
  return files.flat();
}

async function checkLinks(files: string[]): Promise<{
  allLinks: string[];
  brokenLinks: BrokenLink[];
}> {
  const allLinks: string[] = [];
  const brokenLinks: BrokenLink[] = [];
  const existingPaths = new Set<string>();
  const pathToFileMap: Map<string, string> = new Map();
  
  // Build a map of normalized paths to the actual files they represent
  for (const file of files) {
    const relativePath = path.relative(config.rootDir, file);
    
    const pathWithoutExt = removeExtension(relativePath);
    const normalizedPath = normalizeFilePath(pathWithoutExt);
    
    existingPaths.add(normalizedPath);
    pathToFileMap.set(normalizedPath, relativePath);
    
    if (pathWithoutExt.endsWith('/index') || pathWithoutExt === 'index') {
      const dirPath = pathWithoutExt.replace(/index$/, '').replace(/\/$/, '');
      if (dirPath) {
        const normalizedDirPath = normalizeFilePath(dirPath);
        existingPaths.add(normalizedDirPath);
        pathToFileMap.set(normalizedDirPath, relativePath);
      }
    }
  }
  
  for (const file of files) {
    const fileContent = await readFile(file, 'utf8');
    const relativePath = path.relative(config.rootDir, file);
    
    const extractedLinks = extractLinks(fileContent);
    allLinks.push(...extractedLinks.links);
    
    for (const { link, lineNumber, originalText } of extractedLinks.linkDetails) {
      if (shouldSkipLink(link)) continue;
      
      const normalizedLink = normalizeLink(link);
      const resolvedLink = resolveLink(normalizedLink, relativePath);
      
      if (!existingPaths.has(resolvedLink)) {
        brokenLinks.push({
          sourcePath: relativePath,
          linkPath: link,
          lineNumber,
          originalText
        });
      }
    }
  }
  
  return { allLinks, brokenLinks };
}

function extractLinks(content: string): {
  links: string[],
  linkDetails: Array<{link: string, lineNumber: number, originalText: string}>
} {
  const links: string[] = [];
  const linkDetails: Array<{link: string, lineNumber: number, originalText: string}> = [];
  
  let cleanContent = content;
  try {
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (frontmatterMatch) {
      cleanContent = content.slice(frontmatterMatch[0].length);
    }
  } catch (error) {
    // Ignore frontmatter errors
  }
  
  const lines = cleanContent.split('\n');
  
  let inComment = false;
  const isCommentLine = (line: string): boolean => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('//')) return true;
    
    if (trimmedLine.startsWith('/*')) {
      inComment = true;
      return true;
    }
    
    if (inComment && trimmedLine.includes('*/')) {
      inComment = false;
      return true;
    }
    
    if (inComment) return true;
    
    if (trimmedLine.startsWith('<!--')) {
      if (trimmedLine.includes('-->')) {
        return true;
      }
      inComment = true;
      return true;
    }
    
    if (inComment && trimmedLine.includes('-->')) {
      inComment = false;
      return true;
    }
    
    return false;
  };
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    if (isCommentLine(line)) return;
    
    let lineMatch;
    
    // Extract Markdown links - [text](link)
    const markdownLinkRegex = /\[([^\[\]]+)\]\(([^)]+)\)/g;
    while ((lineMatch = markdownLinkRegex.exec(line)) !== null) {
      const linkText = lineMatch[1];
      const fullLinkPart = lineMatch[2];
      const link = fullLinkPart.split(' ')[0].trim();
      links.push(link);
      linkDetails.push({ 
        link, 
        lineNumber: lineNum, 
        originalText: lineMatch[0]
      });
    }
    
    // Extract JSX/HTML links - href="link" or href='link' or href={link}
    const jsxLinkRegexSingleQuote = /href=['"]([^'"]+)['"]/g;
    const jsxLinkRegexDoubleQuote = /href=["']([^"']+)["']/g;
    const jsxLinkRegexCurly = /href=\{['"]?([^'"}\s]+)['"]?\}/g;
    
    [jsxLinkRegexSingleQuote, jsxLinkRegexDoubleQuote, jsxLinkRegexCurly].forEach(regex => {
      while ((lineMatch = regex.exec(line)) !== null) {
        const link = lineMatch[1].trim();
        links.push(link);
        linkDetails.push({ 
          link, 
          lineNumber: lineNum,
          originalText: lineMatch[0]
        });
      }
    });
  });
  
  return { links, linkDetails };
}

function shouldSkipLink(link: string): boolean {
  if (!link.trim()) return true;
  
  return config.excludePatterns.some(pattern => pattern.test(link));
}

function normalizeLink(link: string): string {
  let normalizedLink = link;
  
  normalizedLink = normalizedLink.split(/[?#]/)[0];
  
  if (normalizedLink.startsWith('./')) {
    normalizedLink = normalizedLink.substring(2);
  }
  
  return normalizedLink;
}

function resolveLink(link: string, sourcePath: string): string {
  if (link.startsWith('/')) {
    return normalizeFilePath(link.substring(1));
  }
  
  const sourceDir = path.dirname(sourcePath);
  if (sourceDir === '.') {
    return normalizeFilePath(link);
  }
  
  let resolvedPath;
  if (link.startsWith('../')) {
    const relativeParent = path.resolve(sourceDir, '..');
    const relativePath = path.relative(config.rootDir, relativeParent);
    resolvedPath = path.join(relativePath, link.substring(3));
  } else {
    resolvedPath = path.join(sourceDir, link);
  }
  
  return normalizeFilePath(resolvedPath);
}

function normalizeFilePath(filePath: string): string {
  let normalizedPath = filePath.replace(/^\.\//, '');
  
  normalizedPath = normalizedPath.replace(/\\/g, '/');
  
  normalizedPath = normalizedPath.replace(/\/$/, '');
  
  return normalizedPath;
}

function removeExtension(filePath: string): string {
  const extname = path.extname(filePath);
  if (config.fileExtensions.includes(extname)) {
    return filePath.substring(0, filePath.length - extname.length);
  }
  return filePath;
}

async function fixBrokenLinks(brokenLinks: BrokenLink[], allFiles: string[]): Promise<AutoFixResult> {
  console.log(`\n${colors.bold}${colors.blue}🔧 Attempting to fix ${brokenLinks.length} broken links...${colors.reset}`);
  
  const existingPaths = new Map<string, string>();
  const caseInsensitivePaths = new Map<string, string>();
  
  // Build a map of all valid paths
  for (const file of allFiles) {
    const relativePath = path.relative(config.rootDir, file);
    const pathWithoutExt = removeExtension(relativePath);
    const normalizedPath = normalizeFilePath(pathWithoutExt);
    
    existingPaths.set(normalizedPath, relativePath);
    
    if (config.fixOptions.checkCaseInsensitive) {
      caseInsensitivePaths.set(normalizedPath.toLowerCase(), normalizedPath);
    }
    
    // Handle index files (can be referenced by their directory)
    if (pathWithoutExt.endsWith('/index') || pathWithoutExt === 'index') {
      const dirPath = pathWithoutExt.replace(/index$/, '').replace(/\/$/, '');
      if (dirPath) {
        const normalizedDirPath = normalizeFilePath(dirPath);
        existingPaths.set(normalizedDirPath, relativePath);
        
        if (config.fixOptions.checkCaseInsensitive) {
          caseInsensitivePaths.set(normalizedDirPath.toLowerCase(), normalizedDirPath);
        }
      }
    }
  }
  
  const fixedLinks: FixedLink[] = [];
  const unfixableLinks: BrokenLink[] = [];
  
  // Group by source file for efficiency
  const linksBySource = new Map<string, BrokenLink[]>();
  brokenLinks.forEach(link => {
    if (!linksBySource.has(link.sourcePath)) {
      linksBySource.set(link.sourcePath, []);
    }
    linksBySource.get(link.sourcePath)!.push(link);
  });
  
  const rl = config.interactiveMode ? readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }) : null;
  
  // Process each source file
  // Use Array.from to work around TS iteration issues with Maps
  for (const [sourcePath, links] of Array.from(linksBySource.entries())) {
    const absoluteSourcePath = path.join(config.rootDir, sourcePath);
    let fileContent = await readFile(absoluteSourcePath, 'utf8');
    let fileModified = false;
    
    console.log(`\n${colors.cyan}Processing: ${sourcePath}${colors.reset}`);
    
    // Process each broken link in the file
    for (const brokenLink of links) {
      const normalizedLink = normalizeLink(brokenLink.linkPath);
      const resolvedBrokenLink = resolveLink(normalizedLink, sourcePath);
      
      let fixSuggestion: string | null = null;
      
      // Try case-insensitive matching
      if (config.fixOptions.checkCaseInsensitive) {
        const lowerCaseLink = resolvedBrokenLink.toLowerCase();
        if (caseInsensitivePaths.has(lowerCaseLink)) {
          fixSuggestion = caseInsensitivePaths.get(lowerCaseLink)!;
        }
      }
      
      // Try different extensions if enabled
      if (!fixSuggestion && config.fixOptions.checkExtensions) {
        for (const ext of config.fileExtensions) {
          const withExt = `${resolvedBrokenLink}${ext}`;
          const normalizedWithExt = normalizeFilePath(removeExtension(withExt));
          if (existingPaths.has(normalizedWithExt)) {
            fixSuggestion = normalizedWithExt;
            break;
          }
        }
      }
      
      // Try to find similar paths using Levenshtein distance
      if (!fixSuggestion) {
        let closestMatch: string | null = null;
        let minDistance = config.fixOptions.maxEditDistance + 1;
        
        // Use Array.from to work around TS iteration issues with Maps
        Array.from(existingPaths.keys()).forEach(existingPath => {
          const distance = levenshteinDistance(resolvedBrokenLink, existingPath);
          if (distance <= config.fixOptions.maxEditDistance && distance < minDistance) {
            minDistance = distance;
            closestMatch = existingPath;
          }
        });
        
        if (closestMatch) {
          fixSuggestion = closestMatch;
        }
      }
      
      // If we have a suggestion, confirm and apply it
      if (fixSuggestion) {
        let shouldApply = true;
        
        if (config.interactiveMode && rl) {
          const answer = await askQuestion(
            rl,
            `${colors.yellow}Line ${brokenLink.lineNumber}:${colors.reset} Fix "${colors.brightRed}${brokenLink.linkPath}${colors.reset}" to "${colors.brightGreen}${fixSuggestion}${colors.reset}"? (Y/n) `
          );
          shouldApply = answer.toLowerCase() !== 'n';
        } else {
          console.log(`${colors.yellow}Line ${brokenLink.lineNumber}:${colors.reset} Fixing "${colors.brightRed}${brokenLink.linkPath}${colors.reset}" to "${colors.brightGreen}${fixSuggestion}${colors.reset}"`);
        }
        
        if (shouldApply) {
          // Convert the fix suggestion back to a relative path if needed
          let newPath = fixSuggestion;
          
          // If the original link was relative (not starting with /), keep it relative
          if (!brokenLink.linkPath.startsWith('/')) {
            const sourceDirPath = path.dirname(sourcePath);
            newPath = path.relative(sourceDirPath, newPath).replace(/\\/g, '/');
            if (!newPath.startsWith('.') && !newPath.startsWith('/')) {
              newPath = `./${newPath}`;
            }
          } else {
            // If it was absolute, keep it absolute
            newPath = `/${newPath}`;
          }
          
          // Replace the link in the file content
          if (brokenLink.originalText) {
            const newText = brokenLink.originalText.replace(brokenLink.linkPath, newPath);
            fileContent = fileContent.replace(brokenLink.originalText, newText);
            fileModified = true;
            
            fixedLinks.push({
              sourcePath,
              oldLinkPath: brokenLink.linkPath,
              newLinkPath: newPath,
              lineNumber: brokenLink.lineNumber
            });
          }
        } else {
          unfixableLinks.push(brokenLink);
        }
      } else {
        console.log(`${colors.yellow}Line ${brokenLink.lineNumber}:${colors.reset} ${colors.brightRed}No suggestion found for "${brokenLink.linkPath}"${colors.reset}`);
        unfixableLinks.push(brokenLink);
      }
    }
    
    // Save the modified file
    if (fileModified) {
      await writeFile(absoluteSourcePath, fileContent);
      console.log(`${colors.green}✅ Updated: ${sourcePath}${colors.reset}`);
    }
  }
  
  if (rl) {
    rl.close();
  }
  
  return { fixed: fixedLinks, unfixable: unfixableLinks };
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer || 'y');
    });
  });
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // Initialize the matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[a.length][b.length];
}

function generateReport(
  totalFiles: number,
  allLinks: string[],
  brokenLinks: BrokenLink[],
  fixedLinks: FixedLink[],
  elapsedTime: string
): AuditReport {
  const affectedFiles = new Set(brokenLinks.map(link => link.sourcePath)).size;
  const fixedFiles = new Set(fixedLinks.map(link => link.sourcePath)).size;
  
  return {
    timestamp: new Date().toISOString(),
    totalFiles,
    totalLinks: allLinks.length,
    brokenLinks,
    fixedLinks,
    summary: {
      totalBrokenLinks: brokenLinks.length,
      totalFixedLinks: fixedLinks.length,
      affectedFiles,
      fixedFiles
    },
    elapsedTime
  };
}

function displayReport(report: AuditReport): void {
  let result = '';
  
  // Display fixed links summary if any
  if (report.fixedLinks && report.fixedLinks.length > 0) {
    result += `\n${colors.bold}${colors.green}🔧 Fixed ${report.summary.totalFixedLinks} links in ${report.summary.fixedFiles} files:${colors.reset}\n`;
    
    const linksBySource: Record<string, FixedLink[]> = {};
    report.fixedLinks.forEach(link => {
      if (!linksBySource[link.sourcePath]) {
        linksBySource[link.sourcePath] = [];
      }
      linksBySource[link.sourcePath].push(link);
    });
    
    Object.entries(linksBySource).forEach(([sourcePath, links]) => {
      result += `\n${colors.bold}${colors.cyan}File: ${sourcePath}${colors.reset}\n`;
      links.forEach(link => {
        result += `  ${colors.yellow}Line ${link.lineNumber}:${colors.reset} Changed "${colors.brightRed}${link.oldLinkPath}${colors.reset}" to "${colors.brightGreen}${link.newLinkPath}${colors.reset}"\n`;
      });
    });
  }
  
  // Display remaining broken links if any
  if (report.brokenLinks.length > 0) {
    result += `\n${colors.bold}${colors.red}❌ ${report.brokenLinks.length} links could not be fixed:${colors.reset}\n`;
    
    const linksBySource: Record<string, BrokenLink[]> = {};
    report.brokenLinks.forEach(link => {
      if (!linksBySource[link.sourcePath]) {
        linksBySource[link.sourcePath] = [];
      }
      linksBySource[link.sourcePath].push(link);
    });
    
    Object.entries(linksBySource).forEach(([sourcePath, links]) => {
      result += `\n${colors.bold}${colors.cyan}File: ${sourcePath}${colors.reset}\n`;
      links.forEach(link => {
        result += `  ${colors.yellow}Line ${link.lineNumber}:${colors.reset} Broken link to ${colors.brightRed}"${link.linkPath}"${colors.reset}\n`;
      });
    });
    
    result += `\n${colors.red}❌ LIFECYCLE\tCommand completed with warnings.${colors.reset}\n`;
  } else {
    result += `\n${colors.green}✅ LIFECYCLE\tCommand completed successfully.${colors.reset}\n`;
  }
  
  // Display summary statistics
  const totalFixed = report.summary.totalFixedLinks || 0;
  const totalRemaining = report.brokenLinks.length;
  const totalInitial = totalFixed + totalRemaining;
  
  const fixRate = totalInitial > 0 ? Math.round((totalFixed / totalInitial) * 100) : 0;
  
  const summaryStats = `\n${colors.bold}Summary: ${totalInitial} initial broken links, ${colors.green}${totalFixed} fixed (${fixRate}%)${colors.reset}, ${colors.red}${totalRemaining} remaining${colors.reset} (in ${report.elapsedTime}s)`;
  
  if (result.trim()) {
    console.log(result);
  }
  console.log(summaryStats);
  
  if (report.brokenLinks.length > 0) {
    process.exit(1); 
  }
}

runLinkFixer().catch(console.error);