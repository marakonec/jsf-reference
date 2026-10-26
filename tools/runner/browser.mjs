import process from 'node:process';
import * as chromeLauncher from 'chrome-launcher';

// chrome-launcher сам знаходить встановлений Chrome. Нестандартний шлях до
// браузера задається змінною CHROME_PATH (README chrome-launcher 1.2.1).
export async function launchChrome({ headless = true } = {}) {
  const flags = headless ? ['--headless'] : [];
  // Під обліковим записом root (контейнер) Chrome без цього прапорця не стартує.
  if (typeof process.getuid === 'function' && process.getuid() === 0) flags.push('--no-sandbox');
  return chromeLauncher.launch({ chromeFlags: flags });
}

export async function chromeVersion(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/version`);
  const { Browser } = await response.json();
  return String(Browser ?? 'невідомо');
}
