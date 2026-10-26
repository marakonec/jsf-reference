import { createRoot } from 'react-dom/client';
import { Catalog } from './app/Catalog.js';
import type { Item } from '../../shared/data.js';

const root = document.querySelector<HTMLElement>('#root');
if (!root) throw new Error('немає елемента #root в index.html');

const response = await fetch('/data.json');
if (!response.ok) throw new Error(`data.json: HTTP ${response.status}`);
const items = (await response.json()) as readonly Item[];
createRoot(root).render(<Catalog items={items} />);
