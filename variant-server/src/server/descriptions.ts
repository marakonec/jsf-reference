import 'server-only';
import descriptions from '../../data/descriptions.json';

// Описи записів є окремим джерелом даних (імпорт від постачальника). Для схеми
// на межі опис лише рядок, перевірка типу не каже, що всередині рядка розмітка.
export function readDescription(id: number): string | null {
  const value = (descriptions as Record<string, string>)[String(id)];
  return typeof value === 'string' ? value : null;
}
