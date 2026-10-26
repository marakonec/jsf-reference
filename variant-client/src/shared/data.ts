// Предметна область першої роботи. Варіант бере тип запису, фільтр і агрегат
// з кореневого shared/data.ts, тому вони ті самі, що в компоненті першої
// роботи. Якщо там їх названо інакше, змінюють лише цей файл.
export type { Item, Summary } from '../../../shared/data';
export { filterItems, summarize } from '../../../shared/data';
