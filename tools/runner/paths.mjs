import path from 'node:path';

// Прогонник лежить у tools/runner, вимірювання пишуться в measurements/ кореня проєкту.
export const MEASUREMENTS = path.resolve(import.meta.dirname, '..', '..', 'measurements');
