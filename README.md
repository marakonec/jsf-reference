# Еталонний проєкт після ЛР4

Стан еталонного проєкту дисципліни «JavaScript Frameworks» після четвертої
лабораторної роботи. До стану після ЛР3 додано конвеєр неперервної
інтеграції з десятьма перевірками (`pipeline.config.mjs`,
`tools/pipeline.mjs`, `.github/workflows/pipeline.yml`), бюджет
продуктивності для Lighthouse CI (`lighthouserc.cjs`), політику залежностей
(`dependency-policy.json`), політику безпеки вмісту у варіанті «запит на
сервері» і заповнені документи ЛР4 (`JOURNAL.md`, розділ 4, `ADR-004.md` з
розділами «Аудит залежностей» і «Політика залежностей»).

## Команди

| Команда | Що робить |
|---|---|
| `npm ci` | встановлення залежностей за файлом блокування |
| `npm run check` | середовище і кроки коду конвеєра (типи, лінтинг, тести, складання, наскрізні) |
| `npm run pipeline` | усі десять перевірок конвеєра локально, таблиця наприкінці |
| `npm run pipeline -- --step=budget` | одна перевірка, у конвеєрі те саме викликає `node tools/pipeline.mjs --step=budget` |
| `npm run ready -- 4` | повнота документів ЛР1…ЛР4 |
| `npm explain ІМ'Я_ПАКЕТА` | хто притягнув пакет у дерево залежностей |
| `npm sbom --sbom-format=cyclonedx --sbom-type=application` | перелік складових |

Навмисно червоний запуск перевірки budget задається змінною
`BUDGET_SCRIPT_BYTES` (локально `$env:BUDGET_SCRIPT_BYTES='1000'` перед
`npm run pipeline -- --step=budget`) або полем `budget_script_bytes` під час
ручного запуску робочого процесу `pipeline` на GitHub.
