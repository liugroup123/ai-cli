import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

function fixImportsInFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    
    // Fix relative imports to add .js extension
    const fixedContent = content.replace(
      /from\s+['"](\.[^'"]*?)(?<!\.js)['"];?/g,
      (match, importPath) => {
        // Don't add .js if it's already there or if it's a directory import
        if (importPath.endsWith('.js') || importPath.endsWith('/')) {
          return match;
        }
        return match.replace(importPath, importPath + '.js');
      }
    );

    // Also fix dynamic imports
    const finalContent = fixedContent.replace(
      /import\s*\(\s*['"](\.[^'"]*?)(?<!\.js)['"]\s*\)/g,
      (match, importPath) => {
        if (importPath.endsWith('.js') || importPath.endsWith('/')) {
          return match;
        }
        return match.replace(importPath, importPath + '.js');
      }
    );

    if (content !== finalContent) {
      writeFileSync(filePath, finalContent, 'utf8');
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function fixImportsInDirectory(dirPath) {
  let fixedCount = 0;
  
  try {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively fix subdirectories
        fixedCount += fixImportsInDirectory(fullPath);
      } else if (extname(item) === '.ts' || extname(item) === '.tsx') {
        // Fix TypeScript files
        if (fixImportsInFile(fullPath)) {
          fixedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error.message);
  }
  
  return fixedCount;
}

console.log('🔧 Fixing ESM imports in TypeScript files...');

const srcDir = './src';
const fixedCount = fixImportsInDirectory(srcDir);

console.log(`\n✅ Fixed imports in ${fixedCount} files`);
console.log('🚀 Now rebuilding the project...');

// Rebuild the project
import { execSync } from 'child_process';

try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n🎉 Build successful! Your Gemini-style TUI is ready!');
  console.log('\n🚀 Try it out with:');
  console.log('   ai-cli chat --tui');
} catch (error) {
  console.error('\n❌ Build failed. Please check the errors above.');
  process.exit(1);
}
