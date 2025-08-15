// upgrade-nextjs15.js
// Improved script to upgrade Smart-Kollect to Next.js 15
const fs = require('fs');
const path = require('path');

// Directory to search for files
const rootDir = path.resolve(__dirname);
const appDir = path.join(rootDir, 'app');
const logFile = path.join(rootDir, 'nextjs15-upgrade-log.txt');

// Initialize log file
fs.writeFileSync(logFile, `Next.js 15 Upgrade Log - ${new Date().toISOString()}\n\n`, 'utf8');

// Helper function to log to both console and file
function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n', 'utf8');
}

// Function to recursively find all .ts and .tsx files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (
      (file.endsWith('.ts') || file.endsWith('.tsx')) && 
      !file.endsWith('.d.ts')
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update cookies API in a file
function updateCookiesApi(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Check if the file imports cookies
  if (content.includes("import { cookies }") || content.includes("import {cookies}")) {
    // Update cookies() to await cookies()
    const newContent = content.replace(
      /const\s+cookieStore\s*=\s*cookies\(\);/g,
      'const cookieStore = await cookies();'
    );
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      updated = true;
      log(`Updated cookies API in ${path.relative(rootDir, filePath)}`);
    }
  }
  
  return updated;
}

// Function to update headers API in a file
function updateHeadersApi(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Check if the file imports headers
  if (content.includes("import { headers }") || content.includes("import {headers}")) {
    // Update headers() to await headers()
    const newContent = content.replace(
      /const\s+headersList\s*=\s*headers\(\);/g,
      'const headersList = await headers();'
    );
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      updated = true;
      log(`Updated headers API in ${path.relative(rootDir, filePath)}`);
    }
  }
  
  return updated;
}

// Function to update draftMode API in a file
function updateDraftModeApi(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Check if the file imports draftMode
  if (content.includes("import { draftMode }") || content.includes("import {draftMode}")) {
    // Update draftMode() to await draftMode()
    const newContent = content.replace(
      /const\s+(\w+)\s*=\s*draftMode\(\);/g,
      'const $1 = await draftMode();'
    );
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      updated = true;
      log(`Updated draftMode API in ${path.relative(rootDir, filePath)}`);
    }
  }
  
  return updated;
}

// Function to check for experimental-edge runtime
function updateRuntimeConfig(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  if (content.includes("experimental-edge")) {
    // Update experimental-edge to edge
    const newContent = content.replace(
      /export\s+const\s+runtime\s*=\s*['"]experimental-edge['"]/g,
      'export const runtime = "edge"'
    );
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      updated = true;
      log(`Updated runtime config in ${path.relative(rootDir, filePath)}`);
    }
  }
  
  return updated;
}

// Function to check for @next/font imports
function updateFontImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  if (content.includes("@next/font")) {
    // Update @next/font to next/font
    const newContent = content.replace(
      /@next\/font/g,
      'next/font'
    );
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      updated = true;
      log(`Updated font imports in ${path.relative(rootDir, filePath)}`);
    }
  }
  
  return updated;
}

// Function to check for GET route handlers that might need caching config
function checkRouteHandlers(filePath) {
  if (filePath.includes('/api/') && filePath.includes('/route.')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('export async function GET(') && !content.includes('export const dynamic')) {
      log(`⚠️ Route handler with GET method found in ${path.relative(rootDir, filePath)}`);
      log(`   Consider adding 'export const dynamic = "force-static"' for caching`);
      return true;
    }
  }
  return false;
}

// Function to check for fetch calls that might need explicit caching
function checkFetchCalls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const fetchMatches = content.match(/fetch\s*\(/g);
  
  if (fetchMatches) {
    const isLayoutOrPage = 
      filePath.includes('/layout.') || 
      filePath.includes('/page.');
    
    if (isLayoutOrPage && !content.includes('fetchCache')) {
      log(`⚠️ Found ${fetchMatches.length} fetch calls in ${path.relative(rootDir, filePath)}`);
      log(`   Consider adding 'export const fetchCache = "default-cache"' for caching`);
      return true;
    }
  }
  return false;
}

// Main function
function main() {
  log('Starting Next.js 15 upgrade...');
  
  const files = findFiles(appDir);
  let cookiesUpdated = 0;
  let headersUpdated = 0;
  let draftModeUpdated = 0;
  let runtimeUpdated = 0;
  let fontUpdated = 0;
  let routeHandlersFound = 0;
  let fetchCallsFound = 0;
  
  files.forEach(file => {
    if (updateCookiesApi(file)) cookiesUpdated++;
    if (updateHeadersApi(file)) headersUpdated++;
    if (updateDraftModeApi(file)) draftModeUpdated++;
    if (updateRuntimeConfig(file)) runtimeUpdated++;
    if (updateFontImports(file)) fontUpdated++;
    if (checkRouteHandlers(file)) routeHandlersFound++;
    if (checkFetchCalls(file)) fetchCallsFound++;
  });
  
  log('\nUpgrade Summary:');
  log(`- Updated cookies API in ${cookiesUpdated} files`);
  log(`- Updated headers API in ${headersUpdated} files`);
  log(`- Updated draftMode API in ${draftModeUpdated} files`);
  log(`- Updated runtime config in ${runtimeUpdated} files`);
  log(`- Updated font imports in ${fontUpdated} files`);
  log(`- Found ${routeHandlersFound} route handlers that might need caching config`);
  log(`- Found ${fetchCallsFound} layout/page files with fetch calls that might need caching`);
  
  log('\nReminder: In Next.js 15, fetch requests are no longer cached by default.');
  log('To opt specific fetch requests into caching, add { cache: "force-cache" }');
  log('For layout/page components, you can also use: export const fetchCache = "default-cache"');
  
  log('\nNext steps:');
  log('1. Run "npm run dev" to test the application');
  log('2. Check for any console errors related to Next.js 15 changes');
  log('3. If needed, add explicit cache options to fetch requests');
  log('\nSee nextjs15-upgrade-log.txt for the complete upgrade log');
}

main();
