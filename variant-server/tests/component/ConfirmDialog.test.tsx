// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ConfirmDialog } from '../../src/ui/ConfirmDialog';

afterEach(() => cleanup());

function open(onConfirm = vi.fn()) {
  render(
    <ConfirmDialog trigger="Очистити форму" title="Очистити форму?" confirmLabel="Очистити" onConfirm={onConfirm}>
      Введені значення буде втрачено.
    </ConfirmDialog>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Очистити форму' }));
  return { onConfirm, dialog: screen.getByRole('alertdialog', { name: 'Очистити форму?', description: 'Введені значення буде втрачено.' }) };
}

describe('діалог підтвердження ConfirmDialog', () => {
  test('відкривається з ім\'ям і описом, фокус на кнопці скасування', () => {
    const { dialog } = open();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Скасувати' }));
  });

  test('Tab і Shift+Tab не виводять фокус із діалогу', () => {
    const { dialog } = open();
    const cancel = screen.getByRole('button', { name: 'Скасувати' });
    const confirm = screen.getByRole('button', { name: 'Очистити' });
    confirm.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(cancel);
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirm);
  });

  test('Escape закриває діалог без дії і повертає фокус на кнопку', () => {
    const { dialog, onConfirm } = open();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Очистити форму' }));
  });

  test('кнопка підтвердження виконує дію один раз і закриває діалог', () => {
    const { onConfirm } = open();
    fireEvent.click(screen.getByRole('button', { name: 'Очистити' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Очистити форму' }));
  });
});
