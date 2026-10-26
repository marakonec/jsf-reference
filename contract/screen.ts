import { screen, within, fireEvent } from '@testing-library/dom';

export function field(name: string): HTMLElement {
  return screen.getByRole('textbox', { name });
}

// Рядки й клітинки таблиці беруться з DOM таблиці напряму. Запит за роллю для
// кожного з тисяч рядків перевіряє видимість кожного елемента і в jsdom триває
// секунди, тому за роллю шукається лише сама група рядків.
function rows(group: string): HTMLElement[] {
  const body = screen.getByRole('rowgroup', { name: group });
  if (body instanceof HTMLTableSectionElement) return Array.from(body.rows);
  return within(body).queryAllByRole('row');
}

function cells(row: HTMLElement): HTMLElement[] {
  if (row instanceof HTMLTableRowElement) return Array.from(row.cells).filter((cell) => cell.tagName === 'TD');
  return within(row).queryAllByRole('cell');
}

export function tableRows(group: string): string[][] {
  return rows(group).map((row) => cells(row).map((cell) => cell.textContent ?? ''));
}

export function rowCount(group: string): number {
  return rows(group).length;
}

export function statusNumbers(name: string): number[] {
  const text = screen.getByRole('status', { name }).textContent ?? '';
  return (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

export function typeInto(name: string, text: string): void {
  fireEvent.input(field(name), { target: { value: text } });
}

// Поле дати чи числа не має ролі textbox, а пошук за підписом серед тисяч рядків
// таблиці в jsdom повільний, тому поле береться з елемента label з тим самим текстом.
export function labelled(label: string): HTMLElement {
  const found = Array.from(document.querySelectorAll('label')).find((el) => el.textContent?.trim() === label);
  if (!found?.control) throw new Error(`немає поля з підписом «${label}»`);
  return found.control;
}

export function setValue(label: string, value: string): void {
  const control = labelled(label);
  fireEvent.input(control, { target: { value } });
  fireEvent.change(control, { target: { value } });
}

export function choose(name: string, value: string): void {
  fireEvent.change(screen.getByRole('combobox', { name }), { target: { value } });
}

// React оновлює DOM у межах обробки події, Svelte 5 планує оновлення в мікрозадачі.
// Випадки чекають явно, щоб різниця моделей не потрапила в тест.
export function nextUpdate(): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), 0));
}

export function toggleRow(group: string, index: number): void {
  const row = rows(group)[index];
  if (!row) throw new Error(`у групі «${group}» немає рядка ${index}`);
  fireEvent.click(within(row).getByRole('checkbox'));
}
