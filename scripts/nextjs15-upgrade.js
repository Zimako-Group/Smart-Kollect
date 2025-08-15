// nextjs15-upgrade.js
// Comprehensive script to upgrade Smart-Kollect to Next.js 15
const fs = require('fs');
const path = require('path');

// Directory to search for files
const rootDir = path.resolve(__dirname);
const appDir = path.join(rootDir, 'app');

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
      console.log(`Updated cookies API in ${filePath}`);
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
      console.log(`Updated headers API in ${filePath}`);
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
      console.log(`Updated draftMode API in ${filePath}`);
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
      console.log(`Updated runtime config in ${filePath}`);
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
      console.log(`Updated font imports in ${filePath}`);
    }
  }
  
  return updated;
}

// Main function
function main() {
  console.log('Starting Next.js 15 upgrade...');
  
  const files = findFiles(appDir);
  let cookiesUpdated = 0;
  let headersUpdated = 0;
  let draftModeUpdated = 0;
  let runtimeUpdated = 0;
  let fontUpdated = 0;
  
  files.forEach(file => {
    if (updateCookiesApi(file)) cookiesUpdated++;
    if (updateHeadersApi(file)) headersUpdated++;
    if (updateDraftModeApi(file)) draftModeUpdated++;
    if (updateRuntimeConfig(file)) runtimeUpdated++;
    if (updateFontImports(file)) fontUpdated++;
  });
  
  console.log('\nUpgrade Summary:');
  console.log(`- Updated cookies API in ${cookiesUpdated} files`);
  console.log(`- Updated headers API in ${headersUpdated} files`);
  console.log(`- Updated draftMode API in ${draftModeUpdated} files`);
  console.log(`- Updated runtime config in ${runtimeUpdated} files`);
  console.log(`- Updated font imports in ${fontUpdated} files`);
  
  console.log('\nReminder: In Next.js 15, fetch requests are no longer cached by default.');
  console.log('To opt specific fetch requests into caching, add { cache: "force-cache" }');
  console.log('For layout/page components, you can also use: export const fetchCache = "default-cache"');
  
  console.log('\nNext steps:');
  console.log('1. Run "npm run dev" to test the application');
  console.log('2. Check for any console errors related to Next.js 15 changes');
  console.log('3. If needed, add explicit cache options to fetch requests');
}

main();
