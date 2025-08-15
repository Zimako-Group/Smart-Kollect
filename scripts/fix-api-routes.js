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
    let modified = false;
    
    // Check if this is a dynamic route file (in a [param] directory)
    const isDynamicRoute = filePath.includes('[') && filePath.includes(']');
    
    // Update imports
    if (!content.includes('NextRequest') && content.includes('NextResponse')) {
      content = content.replace(
        /import\s*{\s*NextResponse\s*}\s*from\s*["']next\/server["']/g, 
        'import { NextRequest, NextResponse } from "next/server"'
      );
      modified = true;
    } else if (!content.includes('import') || (!content.includes('NextRequest') && !content.includes('NextResponse'))) {
      content = 'import { NextRequest, NextResponse } from "next/server";\n' + content;
      modified = true;
    }
    
    // For dynamic routes, add the Params type
    if (isDynamicRoute) {
      // Extract the parameter name from the file path
      const paramMatch = filePath.match(/\[([^\]]+)\]/);
      const paramName = paramMatch ? paramMatch[1] : 'id';
      
      // Add Params type if it doesn't exist
      if (!content.includes('type Params =')) {
        // Find a good place to insert the type definition
        const importEndIndex = content.indexOf('import');
        if (importEndIndex !== -1) {
          // Find the end of the import section
          let lineEnd = content.indexOf('\n', importEndIndex);
          while (content.indexOf('import', lineEnd + 1) !== -1 && content.indexOf('import', lineEnd + 1) < lineEnd + 10) {
            lineEnd = content.indexOf('\n', lineEnd + 1);
          }
          
          // Add an extra line after imports
          const insertPoint = lineEnd + 1;
          content = content.slice(0, insertPoint) + 
                   `\ntype Params = { params: { ${paramName}: string } };\n` + 
                   content.slice(insertPoint);
          modified = true;
        }
      }
      
      // Update function signatures for dynamic routes
      const handlerRegexes = [
        // async function declaration style
        {
          regex: new RegExp(`export\\s+async\\s+function\\s+(GET|POST|PUT|PATCH|DELETE)\\s*\\(\\s*request\\s*:\\s*(?:Request|NextRequest)\\s*,\\s*{\\s*params\\s*}\\s*:\\s*{\\s*params\\s*:\\s*{\\s*${paramName}\\s*:\\s*string\\s*}\\s*}\\s*\\)(?:\\s*:\\s*Promise<NextResponse>)?\\s*{`, 'g'),
          replacement: `export async function $1(\n  request: NextRequest,\n  { params }: Params\n) {`
        },
        // arrow function style
        {
          regex: new RegExp(`export\\s+const\\s+(GET|POST|PUT|PATCH|DELETE)\\s*=\\s*async\\s*\\(\\s*request\\s*:\\s*(?:Request|NextRequest)\\s*,\\s*{\\s*params\\s*}\\s*:\\s*{\\s*params\\s*:\\s*{\\s*${paramName}\\s*:\\s*string\\s*}\\s*}\\s*\\)(?:\\s*:\\s*Promise<NextResponse>)?\\s*=>\\s*{`, 'g'),
          replacement: `export const $1 = async(\n  request: NextRequest,\n  { params }: Params\n) => {`
        }
      ];
      
      // Apply handler regex replacements
      for (const { regex, replacement } of handlerRegexes) {
        const newContent = content.replace(regex, replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    } else {
      // For non-dynamic routes
      const handlerRegexes = [
        // async function declaration style
        {
          regex: /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*request\s*:\s*(?:Request|NextRequest)\s*(?:,\s*context\s*:\s*any)?\s*\)(?:\s*:\s*Promise<NextResponse>)?\s*{/g,
          replacement: `export async function $1(\n  request: NextRequest\n) {`
        },
        // arrow function style
        {
          regex: /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=\s*async\s*\(\s*request\s*:\s*(?:Request|NextRequest)\s*(?:,\s*context\s*:\s*any)?\s*\)(?:\s*:\s*Promise<NextResponse>)?\s*=>\s*{/g,
          replacement: `export const $1 = async(\n  request: NextRequest\n) => {`
        }
      ];
      
      // Apply handler regex replacements
      for (const { regex, replacement } of handlerRegexes) {
        const newContent = content.replace(regex, replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    }
    
    // Update Request to NextRequest
    if (content.includes('request: Request')) {
      content = content.replace(/request\s*:\s*Request/g, 'request: NextRequest');
      modified = true;
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
