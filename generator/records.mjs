// Будова запису предметної області. Під власну картку переписують лише цей файл,
// а читання зерна, перевірки і запис data/data.json виконує generator/index.mjs.

const COUNT = 1000;

const CATEGORIES = ['вузол', 'кріплення', 'ущільнення', 'привід', 'корпус', 'датчик'];
const TRAITS = ['опорний', 'кутовий', 'подвійний', 'полегшений', 'посилений', 'типовий', 'зворотний', 'модульний'];
const BASES = ['фланець', 'шайба', 'втулка', 'кронштейн', 'перехідник', 'муфта', 'шків', 'клапан'];

export function createRecords({ random, int, pick, date }) {
  const items = [];
  for (let id = 1; id <= COUNT; id += 1) {
    // Дата від фіксованої точки, інакше набір змінився б наступного дня.
    const madeAt = date('2022-01-01', 1500);
    items.push({
      id,
      name: `${pick(BASES)} ${pick(TRAITS)} ${int(100, 999)}`,
      category: pick(CATEGORIES),
      mass: Math.round(random() * 49900 + 100) / 100,
      date: madeAt,
      available: random() < 0.62,
    });
  }
  return items;
}
