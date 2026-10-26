// Поломка сценарію замість src/ui/record-href.ts. Маршруту /records/… у
// застосунку немає.
export function recordHref(id: number): string {
  return `/records/${id}`;
}
