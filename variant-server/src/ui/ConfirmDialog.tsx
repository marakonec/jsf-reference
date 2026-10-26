'use client';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

// Модальний діалог підтвердження за зразком alertdialog з ARIA Authoring
// Practices. Фокус переходить на кнопку скасування, Tab і Shift+Tab ходять лише
// між кнопками діалогу, Escape і кнопка скасування закривають його без дії, і
// фокус повертається на кнопку, що його відкрила.
export function ConfirmDialog({ trigger, title, children, confirmLabel, cancelLabel = 'Скасувати', onConfirm }: {
  trigger: string;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const messageId = useId();
  const opener = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) cancel.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    opener.current?.focus();
  };

  const confirm = () => {
    close();
    onConfirm();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const buttons = [...(dialog.current?.querySelectorAll<HTMLElement>('button') ?? [])];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  };

  return (
    <>
      <button type="button" ref={opener} onClick={() => setOpen(true)}>{trigger}</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgb(16 24 40 / 0.55)', display: 'grid', placeItems: 'center' }}>
          <div ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}
            onKeyDown={onKeyDown} style={{ background: '#fff', padding: 20, maxWidth: 460, borderRadius: 6 }}>
            <h2 id={titleId}>{title}</h2>
            <div id={messageId}>{children}</div>
            <p>
              <button type="button" ref={cancel} onClick={close}>{cancelLabel}</button>{' '}
              <button type="button" onClick={confirm}>{confirmLabel}</button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
