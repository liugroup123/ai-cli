import chalk from 'chalk';

// Render a "cool" ASCII splash similar to editors splash screens
export function getBanner(version: string): string {
  const lines = [
    '                                                                                    ',
    '      ██████╗ ██╗           ██████╗██╗     ██╗    ██╗    ██╗ ██╗ ██╗ ██╗ ██╗ ██╗',
    '     ██╔══██╗██║          ██╔════╝██║     ██║    ██║    ██║ ██║ ██║ ██║ ██║ ██║',
    '     ██████╔╝██║    █████╗██║     ██║     ██║    ██║    ██║ ██║ ██║ ██║ ██║ ██║',
    '     ██╔══██╗██║    ╚════╝██║     ██║     ██║    ██║    ██║ ██║ ██║ ██║ ██║ ██║',
    '     ██║  ██║██║          ╚██████╗███████╗██║    ██║    ██║ ██║ ██║ ██║ ██║ ██║',
    '     ╚═╝  ╚═╝╚═╝           ╚═════╝╚══════╝╚═╝    ╚═╝    ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝',
    '                                                                                    ',
    '                                                                                    ',
    '    ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗         █████╗ ██╗',
    '    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║        ██╔══██╗██║',
    '       ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║        ███████║██║',
    '       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║        ██╔══██║██║',
    '       ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗   ██║  ██║██║',
    '       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝   ╚═╝  ╚═╝╚═╝',
    '                                                                                    ',
    '                          🚀 Powered by Advanced AI Technology 🚀                  ',
    '                              ⚡ Lightning Fast • 🎯 Precise • 🌟 Smart ⚡           ',
    '                                                                                    '
  ];

  // Enhanced gradient coloring with more sophisticated effects
  const colored = lines.map((line, i) => {
    if (i === 0 || i === lines.length - 1) {
      return chalk.gray(line);
    }

    // AI CLI 主标题部分 (lines 1-6) - 蓝紫渐变
    if (i >= 1 && i <= 6) {
      const colors = [chalk.magenta, chalk.blue, chalk.cyan, chalk.blue, chalk.magenta, chalk.red];
      return colors[i - 1].bold(line);
    }

    // TERMINAL AI 部分 (lines 9-14) - 彩虹渐变
    if (i >= 9 && i <= 14) {
      const colors = [chalk.cyan, chalk.green, chalk.yellow, chalk.red, chalk.magenta, chalk.blue];
      return colors[i - 9](line);
    }

    // 技术标语
    if (i === 16) {
      return chalk.cyan.bold(line);
    }

    // 特性描述
    if (i === 17) {
      return chalk.yellow(line);
    }

    return chalk.gray(line);
  });

  const tips = [
    chalk.gray('~ Type /help for commands'),
    chalk.gray('~ /model qwen-plus  •  /save  •  /quit'),
  ];

  const footer = chalk.dim(`v${version}  •  Made with ❤  •  https://`);

  return ['\n', ...colored, '', ...tips, '', footer, ''].join('\n');
}

export function printBanner(version: string) {
  // Clear screen and print banner
  try {
    // eslint-disable-next-line no-console
    console.clear();
  } catch {}
  // eslint-disable-next-line no-console
  console.log(getBanner(version));
}

// TUI 专用横幅 - 使用 blessed 标签格式
export function getTUIBanner(): string {
  const lines = [
    '',
    '      ██████╗ ██╗           ██████╗██╗     ██╗    ██╗    ██╗ ██╗ ██╗ ██╗ ██╗ ██╗',
    '     ██╔══██╗██║          ██╔════╝██║     ██║    ██║    ██║ ██║ ██║ ██║ ██║ ██║',
    '     ██████╔╝██║    █████╗██║     ██║     ██║    ██║    ██║ ██║ ██║ ██║ ██║ ██║',
    '     ██╔══██╗██║    ╚════╝██║     ██║     ██║    ██║    ██║ ██║ ██║ ██║ ██║ ██║',
    '     ██║  ██║██║          ╚██████╗███████╗██║    ██║    ██║ ██║ ██║ ██║ ██║ ██║',
    '     ╚═╝  ╚═╝╚═╝           ╚═════╝╚══════╝╚═╝    ╚═╝    ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝',
    '',
    '',
    '    ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗         █████╗ ██╗',
    '    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║        ██╔══██╗██║',
    '       ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║        ███████║██║',
    '       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║        ██╔══██║██║',
    '       ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗   ██║  ██║██║',
    '       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝   ╚═╝  ╚═╝╚═╝',
    '',
    '                          🚀 Powered by Advanced AI Technology 🚀',
    '                              ⚡ Lightning Fast • 🎯 Precise • 🌟 Smart ⚡',
    ''
  ];

  // 使用 blessed 标签格式创建渐变效果
  const coloredLines = lines.map((line, i) => {
    if (i === 0 || i === lines.length - 1) {
      return line;
    }

    // AI CLI 主标题部分 - 蓝紫渐变
    if (i >= 1 && i <= 6) {
      const colors = ['magenta', 'blue', 'cyan', 'blue', 'magenta', 'red'];
      return `{${colors[i - 1]}-fg}{bold}${line}{/bold}{/${colors[i - 1]}-fg}`;
    }

    // TERMINAL AI 部分 - 彩虹渐变
    if (i >= 9 && i <= 14) {
      const colors = ['cyan', 'green', 'yellow', 'red', 'magenta', 'blue'];
      return `{${colors[i - 9]}-fg}${line}{/${colors[i - 9]}-fg}`;
    }

    // 技术标语
    if (i === 16) {
      return `{cyan-fg}{bold}${line}{/bold}{/cyan-fg}`;
    }

    // 特性描述
    if (i === 17) {
      return `{yellow-fg}${line}{/yellow-fg}`;
    }

    return `{gray-fg}${line}{/gray-fg}`;
  });

  return coloredLines.join('\n');
}

