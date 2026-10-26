import type { Summary } from '../shared/data';

// Поломка контракту замість src/ui/SummaryStatus.tsx. Текст на екрані той
// самий, але абзац утратив роль status і доступне ім'я.
export function SummaryStatus({ summary }: { summary: Summary }) {
  return <p>Записів: {summary.count} · маса: {summary.mass} кг</p>;
}
