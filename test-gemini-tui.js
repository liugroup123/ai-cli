import { execSync } from 'child_process';

console.log('🚀 Testing Gemini-style TUI build...');

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🔧 Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build successful!');
  console.log('\n🎉 Your Gemini-style TUI is ready!');
  console.log('\n🚀 Try it out with:');
  console.log('   ai-cli chat --tui');
  console.log('\n🎨 Features:');
  console.log('   • React + Ink based interface like Gemini CLI');
  console.log('   • Beautiful welcome screen with gradients');
  console.log('   • Message bubbles with role indicators');
  console.log('   • Real-time input and loading states');
  console.log('   • Chinese input support (Ctrl+E)');
  console.log('   • Smooth animations and transitions');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Make sure Node.js 18+ is installed');
  console.log('   2. Try: npm install --force');
  console.log('   3. Check for TypeScript errors');
  process.exit(1);
}
