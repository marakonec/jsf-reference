import 'server-only';

// Рядок ключа навмисно впізнаваний, щоб його можна було шукати у файлах складання.
const SUPPLIER_KEY = 'SECRET_MARKER_supplier-key';

export function sign(id: number): string {
  let h = 2166136261;
  for (const char of `${SUPPLIER_KEY}:${id}`) {
    h ^= char.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
