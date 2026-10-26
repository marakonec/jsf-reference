import { screen, within, fireEvent } from '@testing-library/dom';

export function field(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Фільтр' });
}

export function rowCount(): number {
  const body = screen.getByRole('rowgroup', { name: 'Записи' });
  return within(body).queryAllByRole('row').length;
}

export function summary(): { count: number; mass: number } {
  const text = screen.getByRole('status', { name: 'Підсумок' }).textContent ?? '';
  const numbers = text.match(/[\d.]+/g) ?? [];
  return { count: Number(numbers[0] ?? NaN), mass: Number(numbers[1] ?? NaN) };
}

export function typeFilter(text: string): void {
  fireEvent.input(field(), { target: { value: text } });
}

export function nextUpdate(): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), 0));
}
