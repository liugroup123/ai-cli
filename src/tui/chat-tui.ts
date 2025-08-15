import blessed, { Widgets } from 'blessed';
import { renderMarkdownToAnsi } from '../utils/markdown';
import * as readline from 'readline';

export interface TUIHandlers {
  onSend: (text: string) => Promise<string>;
}

async function promptCookedInput(screen: Widgets.Screen, promptText = '> '): Promise<string> {
  const program: any = (screen as any).program;
  try { program.showCursor(); } catch {}
  try { program.disableMouse && program.disableMouse(); } catch {}
  try { program.normalBuffer && program.normalBuffer(); } catch {}
  try { (process.stdin as any).setRawMode && (process.stdin as any).setRawMode(false); } catch {}
  // Leave alt buffer to normal console for IME
  try { program.normalBuffer && program.normalBuffer(); } catch {}

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

export class ChatTUI {
  private screen: Widgets.Screen;
  private output: Widgets.Log;
  private input: Widgets.TextboxElement;
  private status: Widgets.BoxElement;

  constructor(private handlers: TUIHandlers) {
    this.screen = blessed.screen({ smartCSR: true, title: 'AI CLI', fullUnicode: true });

    const { resolveThemeVariant, THEMES } = require('./theme');
    const theme = THEMES[resolveThemeVariant()];

    this.output = blessed.log({
      parent: this.screen,
      top: 1,
      left: 0,
      right: 0,
      bottom: 3,
      tags: true,
      scrollable: true,
      keys: true,
      vi: true,
      mouse: true,
      alwaysScroll: true,
      style: { fg: theme.outputFg, bg: theme.outputBg },
      border: { type: 'line' },
      scrollbar: {
        ch: '█',
        style: { bg: 'gray' },
        track: { bg: 'black' }
      },
      label: ' Chat History (↑↓ to scroll, mouse wheel supported) '
    });

    this.status = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      content: ' AI CLI Chat | Press Ctrl+C to exit, Ctrl+E for Chinese input',
      style: { fg: theme.statusFg, bg: theme.statusBg },
      tags: true
    });

    this.input = blessed.textbox({
      parent: this.screen,
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      inputOnFocus: true,
      border: { type: 'line' },
      style: { fg: theme.inputFg, bg: theme.inputBg },
      keys: true,
      mouse: true,
      label: ' Message (Enter to send, Ctrl+E for Chinese) '
    });

    this.screen.key(['C-c', 'q'], () => process.exit(0));

    // Setup event handlers
    this.setupEventHandlers();

    // Show welcome message
    this.showWelcome();

    // Initial focus and render
    this.input.focus();
    this.input.readInput();
    this.screen.render();
  }

  private showWelcome() {
    this.append('{center}{bold}Welcome to AI CLI Chat{/bold}{/center}');
    this.append('');
    this.append('{gray-fg}📝 Input Controls:{/gray-fg}');
    this.append('{gray-fg}  • Enter - Send message{/gray-fg}');
    this.append('{gray-fg}  • Ctrl+E - Chinese input mode{/gray-fg}');
    this.append('');
    this.append('{gray-fg}📜 Scroll Controls:{/gray-fg}');
    this.append('{gray-fg}  • ↑↓ or k/j - Line by line{/gray-fg}');
    this.append('{gray-fg}  • Page Up/Down - Fast scroll{/gray-fg}');
    this.append('{gray-fg}  • Mouse wheel - Scroll up/down{/gray-fg}');
    this.append('{gray-fg}  • Home/End - Jump to top/bottom{/gray-fg}');
    this.append('');
    this.append('{gray-fg}  • Ctrl+C - Exit{/gray-fg}');
    this.append('');
    this.append('{green-fg}Start typing your message below...{/green-fg}');
    this.append('');
  }

  private setupEventHandlers() {
    // Handle input submission
    this.input.on('submit', async (value: string) => {
      const text = (value || '').trim();
      this.input.setValue('');
      if (!text) {
        this.input.focus();
        this.input.readInput();
        return;
      }

      this.append(`{cyan-fg}You:{/} ${text}`);
      try {
        const reply = await this.handlers.onSend(text);
        this.pushMarkdown(`{green-fg}AI:{/}\n${reply}`);
      } catch (error) {
        this.append(`{red-fg}Error: ${error instanceof Error ? error.message : 'Unknown error'}{/}`);
      }

      this.input.focus();
      this.input.readInput();
    });

    // Chinese input support
    this.input.key(['C-e'], async () => {
      const text = await promptCookedInput(this.screen, '> 输入后回车发送: ');
      if (!text) {
        this.input.focus();
        this.input.readInput();
        return;
      }

      this.append(`{cyan-fg}You:{/} ${text}`);
      try {
        const reply = await this.handlers.onSend(text);
        this.pushMarkdown(`{green-fg}AI:{/}\n${reply}`);
      } catch (error) {
        this.append(`{red-fg}Error: ${error instanceof Error ? error.message : 'Unknown error'}{/}`);
      }

      this.input.focus();
      this.input.readInput();
    });

    // Enhanced scroll controls for output area
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

    // Home/End keys for quick navigation
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
  }

  setStatus(text: string) {
    this.status.setContent(` ${text}`);
    this.screen.render();
  }

  append(text: string) {
    this.output.add(text);
    this.updateScrollStatus();
    this.screen.render();
  }

  pushMarkdown(md: string) {
    this.output.add(renderMarkdownToAnsi(md));
    this.updateScrollStatus();
    this.screen.render();
  }

  private updateScrollStatus() {
    const scrollPerc = this.output.getScrollPerc();
    const isAtBottom = scrollPerc >= 99;
    const statusText = isAtBottom
      ? 'AI CLI Chat | Ready to chat'
      : `AI CLI Chat | Scroll: ${Math.round(scrollPerc)}% (Press End to go to bottom)`;
    this.setStatus(statusText);
  }
}

