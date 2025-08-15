export type ThemeVariant = 'dark' | 'light';

export interface Theme {
  outputFg: string;
  outputBg: string;
  statusFg: string;
  statusBg: string;
  inputFg: string;
  inputBg: string;
}

export const THEMES: Record<ThemeVariant, Theme> = {
  dark: {
    outputFg: 'white',
    outputBg: 'black',
    statusFg: 'gray',
    statusBg: 'black',
    inputFg: 'white',
    inputBg: 'black',
  },
  light: {
    outputFg: 'black',
    outputBg: 'white',
    statusFg: 'black',
    statusBg: 'white',
    inputFg: 'black',
    inputBg: 'white',
  },
};

export function resolveThemeVariant(): ThemeVariant {
  const env = (process.env.AI_CLI_THEME || '').toLowerCase();
  if (env === 'dark' || env === 'light') return env as ThemeVariant;
  // Heuristic: default to dark (most terminals), but if running in "ConEmuANSI=ON" or Git Bash on Windows
  // and COLORFGBG indicates light background, choose light. COLORFGBG is non-standard but present in some terminals.
  const fgBg = process.env.COLORFGBG;
  if (fgBg && /;/.test(fgBg)) {
    const parts = fgBg.split(';');
    const bg = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(bg) && bg >= 7) return 'light';
  }
  return 'dark';
}

