import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
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
  bold: '\x1b[1m',
};

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
};

async function runLinkChecker(): Promise<void> {
  const startTime = Date.now();
  
  try {
    const allFiles = await findAllDocFiles();
    
    const { allLinks, brokenLinks } = await checkLinks(allFiles);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const report = generateReport(allFiles.length, allLinks, brokenLinks, duration);
    
    displayReport(report);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error running link checker:${colors.reset}`, error);
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
  
  for (const file of files) {
    const relativePath = path.relative(config.rootDir, file);
    
    const pathWithoutExt = removeExtension(relativePath);
    existingPaths.add(normalizeFilePath(pathWithoutExt));
    
    if (pathWithoutExt.endsWith('/index') || pathWithoutExt === 'index') {
      const dirPath = pathWithoutExt.replace(/index$/, '').replace(/\/$/, '');
      if (dirPath) existingPaths.add(normalizeFilePath(dirPath));
    }
  }
  
  for (const file of files) {
    const fileContent = await readFile(file, 'utf8');
    const relativePath = path.relative(config.rootDir, file);
    
    const extractedLinks = extractLinks(fileContent);
    allLinks.push(...extractedLinks.links);
    
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

function extractLinks(content: string): {
  links: string[],
  linkDetails: Array<{link: string, lineNumber: number}>
} {
  const links: string[] = [];
  const linkDetails: Array<{link: string, lineNumber: number}> = [];
  
  let cleanContent = content;
  try {
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (frontmatterMatch) {
      cleanContent = content.slice(frontmatterMatch[0].length);
    }
  } catch (error) {
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
    
    const markdownLinkRegex = /\[(?:[^\[\]]+)\]\(([^)]+)\)/g;
    while ((lineMatch = markdownLinkRegex.exec(line)) !== null) {
      const link = lineMatch[1].split(' ')[0].trim();
      links.push(link);
      linkDetails.push({ link, lineNumber: lineNum });
    }
    
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

function generateReport(
  totalFiles: number,
  allLinks: string[],
  brokenLinks: BrokenLink[],
  elapsedTime: string
): AuditReport {
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

function displayReport(report: AuditReport): void {
  let result = '';
  
  if (report.brokenLinks.length > 0) {
    const sortedLinks = [...report.brokenLinks].sort((a, b) => 
      a.sourcePath.localeCompare(b.sourcePath) || a.lineNumber - b.lineNumber
    );
    
    const linksBySource: Record<string, BrokenLink[]> = {};
    sortedLinks.forEach(link => {
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
    
    result += `\n${colors.red}❌ LIFECYCLE\tCommand failed with exit code 1.${colors.reset}\n`;
  } else {
    result += `\n${colors.green}✅ LIFECYCLE\tCommand completed successfully.${colors.reset}\n`;
  }
  
  const totalCount = report.totalFiles + report.summary.totalBrokenLinks;
  const okCount = report.totalFiles - report.summary.affectedFiles;
  const errorCount = report.summary.totalBrokenLinks;
  const excludedCount = 0;
  const timeoutCount = 0;
  
  const summary = `\n${colors.bold}${totalCount} Total (in ${report.elapsedTime}s) ${colors.green}✅ ${okCount} OK ${colors.red}❌ ${errorCount} Errors ${colors.brightYellow}🚫 ${excludedCount} Excluded ${colors.cyan}⏱️ ${timeoutCount} Timeouts${colors.reset}`;
  
  if (result.trim()) {
    console.log(result);
  }
  console.log(summary);
  
  if (report.brokenLinks.length > 0) {
    process.exit(1); 
  }
}

runLinkChecker().catch(console.error);