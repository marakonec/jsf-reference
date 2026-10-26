import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import baseItems from '../../../data/data.json';
import type { Item } from '../../src/shared/data';
import { Catalog } from '../../src/ui/Catalog';
import { cases } from './contract/cases';

// Асинхронні серверні компоненти Vitest не рендерить (документація Next.js,
// «How to set up Vitest»), тому на цьому рівні перевіряється клієнтський компонент.
const items = (baseItems as Item[]).map((item) => ({ ...item, marked: false }));

afterEach(() => cleanup());

describe('контракт компонента «Каталог»', () => {
  for (const contractCase of cases) {
    test(contractCase.name, async () => {
      render(<Catalog items={items} />);
      await contractCase.run(expect);
    });
  }
});
