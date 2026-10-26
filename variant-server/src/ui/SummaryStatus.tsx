import type { Summary } from '../shared/data';

// Роль status (WCAG 2.2, 4.1.3) дає змогу допоміжній технології оголосити нову
// кількість без перенесення фокуса. Роль і доступне ім'я «Підсумок» є частиною
// контракту компонента.
export function SummaryStatus({ summary }: { summary: Summary }) {
  return <p role="status" aria-label="Підсумок">Записів: {summary.count} · маса: {summary.mass} кг</p>;
}
