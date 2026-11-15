import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

// Перевірка середовища запускається з копії в тимчасовій теці, шлях до якої
// повторює теку служби синхронізації, і повертає рядок «шлях» з її виводу.
const SOURCE = path.resolve('tools', 'env.mjs');

function pathLine(...folders: string[]): string {
  const base = mkdtempSync(path.join(tmpdir(), 'jsf-env-'));
  try {
    const root = path.join(base, ...folders);
    mkdirSync(path.join(root, 'tools'), { recursive: true });
    copyFileSync(SOURCE, path.join(root, 'tools', 'env.mjs'));
    const run = spawnSync(process.execPath, [path.join(root, 'tools', 'env.mjs')], { cwd: root, encoding: 'utf8' });
    return run.stdout.split('\n').find((line) => line.includes('шлях')) ?? '';
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

const WARNING = 'у теці хмарної синхронізації';

describe('перевірка середовища, тека хмарної синхронізації', () => {
  it('попереджає про OneDrive на Windows', () => {
    const line = pathLine('OneDrive', 'Робочий стіл', 'jsf');
    expect(line.startsWith('✗')).toBe(true);
    expect(line).toContain(WARNING);
  });

  it('попереджає про iCloud Drive на macOS', () => {
    const line = pathLine('Library', 'Mobile Documents', 'com~apple~CloudDocs', 'jsf');
    expect(line.startsWith('✗')).toBe(true);
    expect(line).toContain(WARNING);
  });

  it('попереджає про теку CloudStorage на macOS (Google Drive, Dropbox, OneDrive)', () => {
    const line = pathLine('Library', 'CloudStorage', 'GoogleDrive-student@example.com', 'My Drive', 'jsf');
    expect(line.startsWith('✗')).toBe(true);
    expect(line).toContain(WARNING);
  });

  it('не попереджає про короткий локальний шлях', () => {
    const line = pathLine('jsf');
    expect(line.startsWith('✓')).toBe(true);
    expect(line).not.toContain(WARNING);
  });
});
