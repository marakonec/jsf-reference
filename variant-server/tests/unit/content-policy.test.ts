// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy } from '../../src/shared/content-policy';

describe('політика безпеки вмісту', () => {
  it('у режимі випуску дозволяє вбудовані сценарії без eval', () => {
    const policy = contentSecurityPolicy(false);
    expect(policy).toContain(`script-src 'self' 'unsafe-inline'`);
    expect(policy).toContain(`object-src 'none'`);
    expect(policy).not.toContain(`'unsafe-eval'`);
  });

  it('у режимі розробки додає unsafe-eval', () => {
    expect(contentSecurityPolicy(true)).toContain(`'unsafe-eval'`);
  });
});
