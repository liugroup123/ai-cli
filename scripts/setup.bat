@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up AI CLI...

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18.0.0 or higher.
    exit /b 1
)

:: Get Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version !NODE_VERSION! detected

:: Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

:: Build the project
echo 🔨 Building the project...
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build the project
    exit /b 1
)

:: Create global link
echo 🔗 Creating global link...
call npm link
if errorlevel 1 (
    echo ❌ Failed to create global link
    exit /b 1
)

echo ✅ AI CLI setup complete!
echo.
echo 🎉 You can now use 'ai-cli' or 'ai' command from anywhere!
echo.
echo Next steps:
echo 1. Set up your API keys:
echo    set OPENAI_API_KEY=your-openai-key
echo    set ANTHROPIC_API_KEY=your-anthropic-key
echo    set GEMINI_API_KEY=your-gemini-key
echo.
echo 2. Start using AI CLI:
echo    ai-cli
echo.
echo 3. Get help:
echo    ai-cli --help

pause
