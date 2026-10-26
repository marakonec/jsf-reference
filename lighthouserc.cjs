// Межу обсягу JavaScript можна задати змінною BUDGET_SCRIPT_BYTES. Так
// навмисно червоний запуск конвеєра не потребує зміни коду.
const scriptBytes = Number(process.env.BUDGET_SCRIPT_BYTES || 150000);
// GitHub Actions завжди задає CI=true, тому конвеєр зводить три прогони
// медіаною, а локальний запуск обмежується одним (обсяг JavaScript від
// кількості прогонів не залежить).
const runs = process.env.CI === 'true' ? 3 : 1;

module.exports = {
  ci: {
    collect: {
      startServerCommand:
        'npm run --silent start --workspace variant-server',
      startServerReadyPattern: 'Ready',
      url: ['http://localhost:3102/', 'http://localhost:3102/record/7'],
      numberOfRuns: runs,
    },
    assert: {
      assertions: {
        'resource-summary:script:size': ['error', {
          maxNumericValue: scriptBytes, aggregationMethod: 'median',
        }],
        'largest-contentful-paint': ['warn', {
          maxNumericValue: 2500, aggregationMethod: 'median',
        }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'check-reports/lhci' },
  },
};
