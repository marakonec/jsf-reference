import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Catalog from '../src/app/Catalog.svelte';
import { cases } from '../../contract/cases.js';
import items from '../../data/data.json';
import type { Item } from '../../shared/data.js';

afterEach(cleanup);

describe('контракт компонента · Svelte', () => {
  for (const contractCase of cases) {
    it(contractCase.name, async () => {
      render(Catalog, { props: { items: items as readonly Item[] } });
      await contractCase.run(expect);
    });
  }
});
