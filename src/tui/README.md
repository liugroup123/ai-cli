# React + Ink TUI Architecture

This directory contains the new React + Ink based Terminal User Interface (TUI) for AI CLI.

## 🏗️ Architecture Overview

```
src/tui/
├── components/          # React components
│   ├── App.tsx         # Main application component
│   ├── StatusBar.tsx   # Status bar component
│   ├── ChatArea.tsx    # Chat messages display
│   ├── MessageBubble.tsx # Individual message component
│   ├── InputArea.tsx   # Input field component
│   └── WelcomeScreen.tsx # Welcome/intro screen
├── hooks/              # Custom React hooks
│   ├── useTheme.ts     # Theme management
│   └── useScrollable.ts # Scroll behavior
├── react-tui.tsx       # Main TUI class (React-based)
├── chat-tui.ts         # Legacy TUI class (blessed-based)
└── theme.ts            # Legacy theme (for blessed)
```

## 🎯 Key Features

### **React + Ink Benefits**
- **Component-based**: Modular, reusable UI components
- **State management**: React hooks for clean state handling
- **Better testing**: React Testing Library support
- **Modern development**: JSX, TypeScript, hot reload

### **Maintained Features**
- ✅ Multi-AI provider support
- ✅ Real-time chat interface
- ✅ Scrollable message history
- ✅ Chinese input support (Ctrl+E)
- ✅ Keyboard shortcuts
- ✅ Theme support (dark/light)
- ✅ Status bar with real-time updates

## 🎮 Usage

### **Environment Variables**
```bash
# Use React TUI (default)
export AI_CLI_USE_REACT_TUI=true

# Use legacy blessed TUI
export AI_CLI_USE_REACT_TUI=false

# Theme selection
export AI_CLI_THEME=dark    # or 'light'
```

### **Starting the TUI**
```bash
# Start with React TUI (default)
ai-cli chat --tui

# Force legacy TUI
AI_CLI_USE_REACT_TUI=false ai-cli chat --tui
```

## 🎨 Components

### **App.tsx**
Main application component that orchestrates all other components.
- Manages global state (messages, status, loading)
- Handles keyboard shortcuts (Ctrl+C, Ctrl+E)
- Coordinates between child components

### **ChatArea.tsx**
Displays chat messages with scrolling support.
- Scrollable message history
- Loading indicators
- Scroll position status
- Keyboard navigation (↑↓, Page Up/Down, End)

### **InputArea.tsx**
Text input component with enhanced features.
- Real-time input handling
- Mode indicators (English/Chinese)
- Submit on Enter
- Loading state management

### **MessageBubble.tsx**
Individual message display component.
- Role-based styling (user/assistant/system)
- Timestamp display
- Markdown rendering for AI responses
- Icon indicators

### **StatusBar.tsx**
Top status bar with system information.
- Current status display
- Input mode indicator
- Keyboard shortcut hints
- Color-coded status (error/loading/ready)

### **WelcomeScreen.tsx**
Initial welcome screen with feature overview.
- Animated title with gradients
- Feature highlights
- Keyboard shortcut guide
- Dismissible on any key

## 🔧 Hooks

### **useTheme.ts**
Theme management hook.
- Automatic theme detection
- Environment variable support
- Consistent color scheme
- Dark/light mode support

### **useScrollable.ts**
Scroll behavior management.
- Virtual scrolling for performance
- Keyboard navigation
- Auto-scroll to bottom
- Scroll position tracking

## 🚀 Migration Guide

### **From Blessed to React + Ink**

**Old (blessed)**:
```typescript
import { ChatTUI } from '../tui/chat-tui';

const tui = new ChatTUI({
  onSend: async (text) => { /* ... */ }
});
tui.setStatus('Ready');
```

**New (React + Ink)**:
```typescript
import { ReactTUI } from '../tui/react-tui';

const tui = new ReactTUI({
  handlers: {
    onSend: async (text) => { /* ... */ }
  },
  initialStatus: 'Ready'
});
tui.start();
```

## 🧪 Testing

```bash
# Run component tests
npm test src/tui/

# Test with React Testing Library
npm install --save-dev @testing-library/react ink-testing-library
```

## 🎯 Future Enhancements

- [ ] **Themes**: More theme options and customization
- [ ] **Plugins**: Component plugin system
- [ ] **Animations**: Smooth transitions and animations
- [ ] **Accessibility**: Screen reader support
- [ ] **Mobile**: Responsive design for different terminal sizes
- [ ] **Performance**: Virtual scrolling for large chat histories
