// check-fetch-usage.js
// Script to identify fetch calls that might need explicit caching in Next.js 15
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

// Function to check fetch usage in a file
function checkFetchUsage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const fetchMatches = content.match(/fetch\s*\(/g);
  
  if (fetchMatches) {
    console.log(`Found ${fetchMatches.length} fetch calls in ${filePath}`);
    
    // Check if the file is a layout or page component
    const isLayoutOrPage = 
      filePath.includes('/layout.') || 
      filePath.includes('/page.') ||
      filePath.includes('/route.');
    
    if (isLayoutOrPage) {
      console.log(`  ⚠️ This is a layout/page/route file and might need explicit cache configuration`);
    }
  }
}

// Main function
function main() {
  console.log('Checking fetch usage for Next.js 15 compatibility...');
  
  const files = findFiles(appDir);
  
  files.forEach(file => {
    checkFetchUsage(file);
  });
  
  console.log('\nReminder: In Next.js 15, fetch requests are no longer cached by default.');
  console.log('To opt specific fetch requests into caching, add { cache: "force-cache" }');
  console.log('For layout/page components, you can also use: export const fetchCache = "default-cache"');
}

main();
