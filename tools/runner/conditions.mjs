import os from 'node:os';
import process from 'node:process';

export function conditions({ mode = 'випуск', streaming = false, extra = '' } = {}) {
  const cpu = os.cpus()[0]?.model.replace(/\s+/g, ' ').trim() ?? 'невідомо';
  const parts = [
    `Node ${process.versions.node}`,
    `${os.type()} ${os.release()}`,
    `${cpu} ×${os.cpus().length}`,
    mode,
    `трансляція: ${streaming ? 'була' : 'ні'}`,
  ];
  if (extra) parts.push(extra);
  return parts.join(' · ');
}

export function timestamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
