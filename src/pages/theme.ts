import { config } from '../config.js';
import { darkTheme } from './themes/dark.js';
import { lightTheme } from './themes/light.js';
import { glassmorphismTheme } from './themes/glassmorphism.js';
import { cyberpunkTheme } from './themes/cyberpunk.js';
import { draculaTheme } from './themes/dracula.js';
import { nordTheme } from './themes/nord.js';
import { emeraldTheme } from './themes/emerald.js';
import { baseStyles, colorSchemeOverrides, colorSchemeMode } from './themes/shared.js';

export interface ThemeInfo {
  id: string;
  name: string;
  icon: string;
}

export interface ColorSchemeInfo {
  id: string;
  name: string;
}

export function getThemeInfo(theme?: string): ThemeInfo {
  const t = (theme || '').trim().toLowerCase();
  if (t === 'glass' || t === 'glassmorphism') {
    return { id: 'glassmorphism', name: 'Glassmorphism', icon: 'fa-solid fa-wand-magic-sparkles' };
  }
  if (t === 'light') {
    return { id: 'light', name: 'Light', icon: 'fa-solid fa-sun' };
  }
  if (t === 'cyberpunk') {
    return { id: 'cyberpunk', name: 'Cyberpunk', icon: 'fa-solid fa-bolt' };
  }
  if (t === 'dracula') {
    return { id: 'dracula', name: 'Dracula', icon: 'fa-solid fa-skull' };
  }
  if (t === 'nord') {
    return { id: 'nord', name: 'Nord', icon: 'fa-solid fa-snowflake' };
  }
  if (t === 'emerald') {
    return { id: 'emerald', name: 'Emerald', icon: 'fa-solid fa-tree' };
  }
  return { id: 'dark', name: 'Dark', icon: 'fa-solid fa-moon' };
}

export function getColorSchemeInfo(scheme?: string): ColorSchemeInfo {
  const s = (scheme || '').trim().toLowerCase();
  if (s === 'purple' || s === 'amethyst') return { id: 'purple', name: 'Amethyst Purple' };
  if (s === 'blue' || s === 'ocean') return { id: 'blue', name: 'Ocean Blue' };
  if (s === 'emerald' || s === 'jade' || s === 'green') return { id: 'emerald', name: 'Emerald Green' };
  if (s === 'rose' || s === 'pink' || s === 'fuchsia') return { id: 'rose', name: 'Rose Pink' };
  if (s === 'amber' || s === 'gold' || s === 'yellow') return { id: 'amber', name: 'Amber Gold' };
  if (s === 'indigo' || s === 'violet') return { id: 'indigo', name: 'Indigo Violet' };
  if (s === 'crimson' || s === 'ruby' || s === 'red') return { id: 'crimson', name: 'Crimson Ruby' };
  if (s === 'teal' || s === 'aqua') return { id: 'teal', name: 'Teal Aqua' };
  if (s === 'sunset' || s === 'coral' || s === 'orange') return { id: 'sunset', name: 'Sunset Coral' };
  if (s === 'cyan' || s === 'electric') return { id: 'cyan', name: 'Electric Cyan' };
  return { id: 'default', name: 'Theme Default' };
}

export function getThemeAndScheme(): { theme: ThemeInfo; colorScheme: ColorSchemeInfo } {
  const theme = getThemeInfo(config.dashboardTheme);
  const colorScheme = getColorSchemeInfo(config.dashboardColorScheme);
  return { theme, colorScheme };
}

export function getThemeCss(): string {
  return `
    ${darkTheme}
    ${lightTheme}
    ${glassmorphismTheme}
    ${cyberpunkTheme}
    ${draculaTheme}
    ${nordTheme}
    ${emeraldTheme}
    ${colorSchemeMode}
    ${colorSchemeOverrides}
  `;
}

export function getBaseStyles(): string {
  return baseStyles;
}