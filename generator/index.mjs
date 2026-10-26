import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRecords } from './records.mjs';

const dir = import.meta.dirname;
const dataFile = path.join(dir, '..', 'data', 'data.json');
const MIN_COUNT = 800;
const MAX_COUNT = 2000;
const MAX_BYTES = 5 * 1024 * 1024;
const DAY_MS = 86400000;

// mulberry32. Власний генератор замість Math.random (у нього немає зерна) і замість
// пакета з реєстру, щоб набір не залежав від версії залежності.
function prng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readSeed() {
  const file = path.join(dir, 'seed.txt');
  if (!fs.existsSync(file)) throw new Error(`немає файлу ${file}, зерно має лежати в репозиторії`);
  const seed = Number(fs.readFileSync(file, 'utf8').trim());
  if (!Number.isInteger(seed) || seed <= 0) throw new Error('seed.txt має містити одне ціле додатне число');
  return seed;
}

// Усі випадкові значення беруться з одного генератора, тому той самий порядок
// викликів у createRecords дає той самий набір.
function helpers(random) {
  return {
    random,
    int: (min, max) => min + Math.floor(random() * (max - min + 1)),
    pick: (list) => list[Math.floor(random() * list.length)],
    chance: (probability) => random() < probability,
    date: (start, days) => new Date(Date.parse(start) + Math.floor(random() * days) * DAY_MS).toISOString().slice(0, 10),
  };
}

function problems(records) {
  if (!Array.isArray(records)) return ['createRecords має повернути масив записів'];
  const found = [];
  if (records.length < MIN_COUNT || records.length > MAX_COUNT) {
    found.push(`записів ${records.length}, потрібно від ${MIN_COUNT} до ${MAX_COUNT}`);
  }
  const ids = new Set();
  records.forEach((record, index) => {
    if (found.length >= 5) return;
    if (record === null || typeof record !== 'object') { found.push(`запис ${index} не є об'єктом`); return; }
    if (!Number.isInteger(record.id)) found.push(`запис ${index}: id має бути цілим числом`);
    else if (ids.has(record.id)) found.push(`запис ${index}: id ${record.id} повторюється`);
    ids.add(record.id);
    if (typeof record.name !== 'string' || !/\d/.test(record.name)) {
      found.push(`запис ${index}: name має містити числовий код, бо прогонник вводить у фільтр цифри`);
    }
  });
  return found;
}

try {
  const records = createRecords(helpers(prng(readSeed())));
  const found = problems(records);
  if (found.length > 0) throw new Error(`набір не записано\n  ${found.join('\n  ')}`);
  const text = JSON.stringify(records) + '\n';
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes > MAX_BYTES) throw new Error(`набір не записано, ${bytes} Б більше за межу ${MAX_BYTES} Б`);
  if (process.argv.includes('--stdout')) {
    process.stdout.write(text);
  } else {
    fs.writeFileSync(dataFile, text, 'utf8');
    console.log(`data/data.json: ${records.length} записів`);
  }
} catch (error) {
  console.error(`генератор: ${error.message}`);
  process.exit(1);
}
