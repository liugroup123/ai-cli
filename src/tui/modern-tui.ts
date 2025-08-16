import blessed, { Widgets } from 'blessed';
import { renderMarkdownToAnsi } from '../utils/markdown.js';
import { getTUIBanner } from '../utils/banner.js';
import * as readline from 'readline';

export interface TUIHandlers {
  onSend: (text: string) => Promise<string>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

async function promptCookedInput(screen: Widgets.Screen, promptText = '> '): Promise<string> {
  const program: any = (screen as any).program;
  try { program.showCursor(); } catch {}
  try { program.disableMouse && program.disableMouse(); } catch {}
  try { program.normalBuffer && program.normalBuffer(); } catch {}
  try { (process.stdin as any).setRawMode && (process.stdin as any).setRawMode(false); } catch {}

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer: string = await new Promise((resolve) => rl.question(promptText, resolve as any));
  rl.close();

  // Restore TUI alt buffer
  try { (process.stdin as any).setRawMode && (process.stdin as any).setRawMode(true); } catch {}
  try { program.alternateBuffer && program.alternateBuffer(); } catch {}
  try { program.enableMouse && program.enableMouse(); } catch {}
  try { program.hideCursor && program.hideCursor(); } catch {}
  screen.render();
  return answer.trim();
}

export class ModernTUI {
  private screen: Widgets.Screen;
  private output: Widgets.Log;
  private input: Widgets.TextboxElement;
  private status: Widgets.BoxElement;
  private messages: Message[] = [];
  private isLoading = false;
  private inputMode: 'normal' | 'chinese' = 'normal';

  constructor(private handlers: TUIHandlers) {
    this.screen = blessed.screen({ 
      smartCSR: true, 
      title: 'AI CLI - Modern TUI', 
      fullUnicode: true,
      dockBorders: true
    });

    this.createComponents();
    this.setupEventHandlers();
    this.showWelcome();
    
    // Initial focus and render
    this.input.focus();
    this.input.readInput();
    this.screen.render();
  }

  private createComponents() {
    // Modern color scheme
    const colors = {
      primary: 'cyan',
      secondary: 'blue',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      muted: 'gray',
      background: 'black',
      surface: '#1a1a1a'
    };

    // Status bar with modern styling
    this.status = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      content: ' AI CLI - Modern TUI | Ready to chat | Ctrl+C: Exit | Ctrl+E: Toggle Input',
      style: { 
        fg: colors.primary, 
        bg: colors.surface,
        bold: true
      },
      tags: true
    });

    // Chat output with enhanced styling
    this.output = blessed.log({
      parent: this.screen,
      top: 1,
      left: 0,
      right: 0,
      bottom: 4,
      tags: true,
      scrollable: true,
      keys: true,
      vi: true,
      mouse: true,
      alwaysScroll: true,
      focusable: true,
      style: { 
        fg: 'white', 
        bg: colors.background,
        border: { fg: colors.primary }
      },
      border: {
        type: 'line'
      },
      scrollbar: { 
        ch: '█', 
        style: { bg: colors.primary },
        track: { bg: colors.muted }
      },
      label: ' 💬 Chat History (Tab to focus, ↑↓ to scroll) '
    });

    // Modern input box
    this.input = blessed.textbox({
      parent: this.screen,
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      inputOnFocus: true,
      border: {
        type: 'line'
      },
      style: { 
        fg: 'white', 
        bg: colors.background,
        border: { fg: colors.secondary },
        focus: { border: { fg: colors.primary } }
      },
      keys: true,
      mouse: true,
      label: ` 📝 Message (${this.inputMode === 'chinese' ? '中文' : 'EN'}) - Enter: Send | Ctrl+E: Toggle `
    });
  }

  private setupEventHandlers() {
    // Exit handlers
    this.screen.key(['C-c', 'q'], () => process.exit(0));

    // Handle input submission
    this.input.on('submit', async (value: string) => {
      await this.handleSendMessage(value);
    });

    // Chinese input support
    this.input.key(['C-e'], async () => {
      this.inputMode = this.inputMode === 'normal' ? 'chinese' : 'normal';
      this.updateInputLabel();
      
      if (this.inputMode === 'chinese') {
        const text = await promptCookedInput(this.screen, '> 输入后回车发送: ');
        if (text) {
          await this.handleSendMessage(text);
        }
      }
      
      this.input.focus();
      this.input.readInput();
    });

    // Tab to switch focus
    this.screen.key(['tab'], () => {
      if (this.screen.focused === this.input) {
        this.output.focus();
      } else {
        this.input.focus();
        this.input.readInput();
      }
      this.screen.render();
    });

    // Scroll controls for output
    this.output.key(['up', 'k'], () => {
      this.output.scroll(-1);
      this.updateScrollStatus();
      this.screen.render();
    });

    this.output.key(['down', 'j'], () => {
      this.output.scroll(1);
      this.updateScrollStatus();
      this.screen.render();
    });

    this.output.key(['pageup'], () => {
      this.output.scroll(-10);
      this.updateScrollStatus();
      this.screen.render();
    });

    this.output.key(['pagedown'], () => {
      this.output.scroll(10);
      this.updateScrollStatus();
      this.screen.render();
    });

    this.output.key(['home'], () => {
      this.output.scrollTo(0);
      this.updateScrollStatus();
      this.screen.render();
    });

    this.output.key(['end'], () => {
      this.output.setScrollPerc(100);
      this.updateScrollStatus();
      this.screen.render();
    });

    // Mouse wheel support
    this.output.on('wheelup', () => {
      this.output.scroll(-3);
      this.updateScrollStatus();
      this.screen.render();
    });

    this.output.on('wheeldown', () => {
      this.output.scroll(3);
      this.updateScrollStatus();
      this.screen.render();
    });

    // Click to focus
    this.output.on('click', () => {
      this.output.focus();
      this.screen.render();
    });
  }

  private async handleSendMessage(text: string) {
    const message = (text || '').trim();
    this.input.setValue('');
    
    if (!message) {
      this.input.focus();
      this.input.readInput();
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.displayMessage(userMessage);

    // Show loading
    this.isLoading = true;
    this.setStatus('🤖 AI is thinking...');
    this.output.add('{yellow-fg}🤖 AI is thinking...{/}');
    this.screen.render();

    try {
      const reply = await this.handlers.onSend(message);
      
      // Remove loading message
      this.output.deleteBottom();
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date()
      };

      this.messages.push(aiMessage);
      this.displayMessage(aiMessage);
      this.setStatus('✅ Ready to chat');
    } catch (error) {
      // Remove loading message
      this.output.deleteBottom();
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      this.messages.push(errorMessage);
      this.displayMessage(errorMessage);
      this.setStatus('❌ Error occurred - Ready to retry');
    } finally {
      this.isLoading = false;
      this.input.focus();
      this.input.readInput();
    }
  }

  private displayMessage(message: Message) {
    const timestamp = message.timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let roleIcon = '';
    let roleColor = '';
    let roleName = '';

    switch (message.role) {
      case 'user':
        roleIcon = '👤';
        roleColor = 'cyan-fg';
        roleName = 'You';
        break;
      case 'assistant':
        roleIcon = '🤖';
        roleColor = 'green-fg';
        roleName = 'AI';
        break;
      case 'system':
        roleIcon = '⚠️';
        roleColor = 'red-fg';
        roleName = 'System';
        break;
    }

    // Message header
    this.output.add(`{${roleColor}}{bold}${roleIcon} ${roleName}{/bold}{/} {gray-fg}at ${timestamp}{/}`);
    
    // Message content
    if (message.role === 'assistant') {
      this.output.add(renderMarkdownToAnsi(message.content));
    } else {
      this.output.add(message.content);
    }
    
    this.output.add(''); // Empty line for spacing
    this.updateScrollStatus();
    this.screen.render();
  }

  private showWelcome() {
    const banner = getTUIBanner();
    const bannerLines = banner.split('\n');
    bannerLines.forEach(line => this.output.add(line));

    this.output.add('');
    this.output.add('{center}{bold}🎯 Welcome to AI CLI - Modern TUI 🎯{/bold}{/center}');
    this.output.add('');
    this.output.add('{cyan-fg}✨ Enhanced Features:{/}');
    this.output.add('  • 🎨 Modern UI with better colors and styling');
    this.output.add('  • 📱 Component-like message bubbles');
    this.output.add('  • ⌨️ Improved keyboard navigation');
    this.output.add('  • 🖱️ Better mouse support');
    this.output.add('  • 🌍 Enhanced Chinese input support');
    this.output.add('');
    this.output.add('{yellow-fg}🎮 Controls:{/}');
    this.output.add('  • {cyan-fg}Enter{/} - Send message');
    this.output.add('  • {cyan-fg}Tab{/} - Switch between input and chat');
    this.output.add('  • {cyan-fg}Ctrl+E{/} - Toggle Chinese input');
    this.output.add('  • {cyan-fg}↑↓{/} or {cyan-fg}k/j{/} - Scroll (when chat focused)');
    this.output.add('  • {cyan-fg}Page Up/Down{/} - Fast scroll');
    this.output.add('  • {cyan-fg}Home/End{/} - Jump to top/bottom');
    this.output.add('  • {cyan-fg}Ctrl+C{/} - Exit');
    this.output.add('');
    this.output.add('{green-fg}🚀 Ready to chat! Start typing your message below...{/}');
    this.output.add('');
  }

  private updateInputLabel() {
    const mode = this.inputMode === 'chinese' ? '中文' : 'EN';
    this.input.setLabel(` 📝 Message (${mode}) - Enter: Send | Ctrl+E: Toggle `);
    this.screen.render();
  }

  private updateScrollStatus() {
    const scrollPerc = this.output.getScrollPerc();
    const isAtBottom = scrollPerc >= 99;
    
    if (isAtBottom) {
      this.setStatus('✅ Ready to chat');
    } else {
      this.setStatus(`📜 Scroll: ${Math.round(scrollPerc)}% (Press End to go to bottom)`);
    }
  }

  setStatus(status: string) {
    this.status.setContent(` ${status} | Ctrl+C: Exit | Ctrl+E: Toggle Input`);
    this.screen.render();
  }
}
