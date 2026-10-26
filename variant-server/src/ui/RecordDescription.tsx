// React виводить рядок як текст, тому розмітка з опису постачальника стає
// символами на екрані, а не елементами сторінки.
export function RecordDescription({ text }: { text: string }) {
  return <p id="description">{text}</p>;
}
