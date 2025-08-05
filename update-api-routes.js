const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Function to recursively find all route.ts files
async function findRouteFiles(dir) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  const routeFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      const nestedFiles = await findRouteFiles(fullPath);
      routeFiles.push(...nestedFiles);
    } else if (file.name === 'route.ts') {
      routeFiles.push(fullPath);
    }
  }

  return routeFiles;
}

// Function to update a route file
async function updateRouteFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    
    // Regular expressions to match the handler functions
    const patterns = [
      {
        regex: /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*([^)]+)\s*\)\s*{/g,
        replacement: 'export async function $1($2): Promise<NextResponse> {'
      },
      {
        regex: /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=\s*async\s*\(\s*([^)]+)\s*\)\s*=>\s*{/g,
        replacement: 'export const $1 = async($2): Promise<NextResponse> => {'
      }
    ];
    
    let modified = false;
    
    // Apply each pattern
    for (const pattern of patterns) {
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    // Check if NextResponse is imported
    if (modified && !content.includes('import { NextResponse }') && !content.includes('import { NextRequest, NextResponse }')) {
      // Add NextResponse import if it's not already there
      if (content.includes('import { NextRequest }')) {
        content = content.replace('import { NextRequest }', 'import { NextRequest, NextResponse }');
      } else if (content.includes('import')) {
        const importLines = content.split('\n').filter(line => line.startsWith('import'));
        const lastImportLine = importLines[importLines.length - 1];
        const lastImportIndex = content.indexOf(lastImportLine) + lastImportLine.length;
        content = content.slice(0, lastImportIndex) + '\nimport { NextResponse } from "next/server";' + content.slice(lastImportIndex);
      } else {
        content = 'import { NextResponse } from "next/server";\n' + content;
      }
    }
    
    if (modified) {
      await writeFile(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  try {
    const apiDir = path.join(process.cwd(), 'app', 'api');
    const routeFiles = await findRouteFiles(apiDir);
    
    console.log(`Found ${routeFiles.length} route files to process`);
    
    let updatedCount = 0;
    
    for (const file of routeFiles) {
      const updated = await updateRouteFile(file);
      if (updated) updatedCount++;
    }
    
    console.log(`\nCompleted! Updated ${updatedCount} out of ${routeFiles.length} route files.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
