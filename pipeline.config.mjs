// Один перелік кроків для локального npm run pipeline і для конвеєра
// (.github/workflows/pipeline.yml викликає node tools/pipeline.mjs --step=ID у тому самому порядку).
// Кроки з check: true виконує і npm run check. Перевірки ланцюга постачання
// стоять першими, бо падають за секунди.
export const STEPS = [
  { id: 'signatures', name: 'підписи й атестації реєстру',
    command: ['npm', 'audit', 'signatures', '--omit=dev'] },
  { id: 'deps-audit', name: 'відомі вразливості залежностей випуску',
    command: ['npm', 'audit', '--omit=dev', '--audit-level=high'] },
  { id: 'lifecycle', name: 'скрипти встановлення за політикою',
    command: ['node', 'tools/lifecycle-scripts.mjs', '--check'] },
  { id: 'typecheck', name: 'перевірка типів',
    command: ['npm', 'run', '--silent', 'typecheck'], check: true },
  { id: 'lint', name: 'лінтинг',
    command: ['npm', 'run', '--silent', 'lint'], check: true },
  { id: 'test', name: 'модульні й компонентні тести',
    command: ['npm', 'run', '--silent', 'test'], check: true },
  { id: 'build', name: 'складання',
    command: ['npm', 'run', '--silent', 'build'], check: true },
  { id: 'e2e', name: 'наскрізні тести, доступність, політика вмісту',
    command: ['npm', 'run', '--silent', 'test:e2e'], check: true },
  { id: 'budget', name: 'бюджет продуктивності (Lighthouse CI)',
    command: ['npm', 'exec', '--', 'lhci', 'autorun'] },
  { id: 'sbom', name: 'перелік складових відповідає дереву залежностей',
    command: ['node', 'tools/sbom.mjs'] },
];
