// update-cookies-api.js
// Codemod script to update cookies API for Next.js 15
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

// Main function
function main() {
  console.log('Starting Next.js 15 cookies API update...');
  
  const files = findFiles(appDir);
  let updatedCount = 0;
  
  files.forEach(file => {
    if (updateCookiesApi(file)) {
      updatedCount++;
    }
  });
  
  console.log(`Finished updating ${updatedCount} files.`);
}

main();
