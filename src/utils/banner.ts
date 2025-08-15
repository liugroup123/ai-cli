import chalk from 'chalk';

// Render a "cool" ASCII splash similar to editors splash screens
export function getBanner(version: string): string {
  const lines = [
    '    █████╗ ██╗      ██████╗██╗██╗     ██╗',
    '   ██╔══██╗██║     ██╔════╝██║██║     ██║',
    '   ███████║██║     ██║     ██║██║     ██║',
    '   ██╔══██║██║     ██║     ██║██║     ██║',
    '   ██║  ██║███████╗╚██████╗██║███████╗██║',
    '   ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚══════╝╚═╝',
    '                                          ',
    '            A I   C L I   ⚡ Terminal AI'
  ];

  // Simple rainbow coloring line by line
  const palette = [chalk.cyan, chalk.blue, chalk.magenta, chalk.red, chalk.yellow, chalk.green];
  const colored = lines.map((l, i) => palette[i % palette.length](l));

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

