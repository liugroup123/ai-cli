const { execSync } = require('child_process');

console.log('🔧 Testing TypeScript compilation...');

try {
  // Test TypeScript compilation
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful!');
  
  // Test actual build
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✅ Build successful!');
  
  console.log('\n🎉 All tests passed! Your Modern TUI is ready to use.');
  console.log('\n🚀 Try it out with:');
  console.log('   npm run start chat --tui');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
