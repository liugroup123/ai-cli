import blessed, { Widgets } from 'blessed';
import { renderMarkdownToAnsi } from '../utils/markdown';

export interface TUIHandlers {
  onSend: (text: string) => Promise<string>;
}

export class ChatTUI {
  private screen: Widgets.Screen;
  private output: Widgets.Log;
  private input: Widgets.Textbox;
  private status: Widgets.BoxElement;

  constructor(private handlers: TUIHandlers) {
    this.screen = blessed.screen({ smartCSR: true, title: 'AI CLI' });

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
      scrollbar: { ch: ' ', inverse: true }
    });

    this.status = blessed.box({ parent: this.screen, top: 0, left: 0, right: 0, height: 1, style: { fg: 'gray' } });

    this.input = blessed.textbox({
      parent: this.screen,
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      inputOnFocus: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' } }
    });

    this.screen.key(['C-c', 'q'], () => process.exit(0));

    this.input.key('enter', async () => {
      const text = this.input.getValue().trim();
      if (!text) return;
      this.input.setValue('');
      this.screen.render();
      this.append(`{cyan-fg}You:{/} ${text}`);
      const reply = await this.handlers.onSend(text);
      this.append(`{blue-fg}AI:{/}\n${renderMarkdownToAnsi(reply)}`);
    });

    this.input.focus();
    this.screen.render();
  }

  append(text: string) {
    this.output.add(text);
    this.screen.render();
  }

  setStatus(text: string) {
    this.status.setContent(text);
    this.screen.render();
  }
}

