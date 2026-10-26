// Політика безпеки вмісту за розділом «Without Nonces» документації Next.js
// («How to set a Content Security Policy»). Режим розробки потребує
// 'unsafe-eval', бо React у розробці використовує eval.
export function contentSecurityPolicy(development: boolean): string {
  const unsafeEval = development ? ` 'unsafe-eval'` : '';
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${unsafeEval}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ');
}
