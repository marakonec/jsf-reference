// @vitest-environment jsdom
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { FormField } from '../../src/ui/FormField';

afterEach(() => cleanup());

describe('поле форми FormField', () => {
  test('підпис дає полю доступне ім\'я', () => {
    render(<FormField label="Назва">{(control) => <input {...control} name="name" />}</FormField>);
    expect(screen.getByRole('textbox', { name: 'Назва' })).toBeDefined();
  });

  test('без помилки поле не позначене як недійсне і не має опису', () => {
    render(<FormField label="Назва">{(control) => <input {...control} name="name" />}</FormField>);
    const field = screen.getByRole('textbox', { name: 'Назва' });
    expect(field.getAttribute('aria-invalid')).toBeNull();
    expect(field.getAttribute('aria-describedby')).toBeNull();
  });

  test('підказка й помилка входять в опис поля, поле позначене як недійсне', () => {
    render(
      <FormField label="Назва" hint="від 3 до 80 знаків" error="Назва коротша за 3 знаки.">
        {(control) => <input {...control} name="name" />}
      </FormField>,
    );
    const field = screen.getByRole('textbox', { name: 'Назва', description: 'від 3 до 80 знаків Назва коротша за 3 знаки.' });
    expect(field.getAttribute('aria-invalid')).toBe('true');
  });

  test('ідентифікатори двох полів не збігаються', () => {
    render(
      <>
        <FormField label="Початок">{(control) => <input {...control} name="start" />}</FormField>
        <FormField label="Кінець">{(control) => <input {...control} name="end" />}</FormField>
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Початок' }).id).not.toBe(screen.getByRole('textbox', { name: 'Кінець' }).id);
  });
});
