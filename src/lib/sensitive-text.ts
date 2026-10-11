// Heuristics, not a guarantee: users must still remove personal information.
export function redactSensitiveText(text: string): { text: string; detected: boolean } {
  let detected = false;
  const replace = (pattern: RegExp, replacement: string | ((...args: any[]) => string)) => {
    text = text.replace(pattern, (...args: any[]) => {
      const next = typeof replacement === "string" ? replacement : replacement(...args);
      // Only an actual change counts; matches deliberately kept as prose do not trigger the warning.
      if (next !== args[0]) detected = true;
      return next;
    });
  };
  replace(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?(?:-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|$)/g, "[REDACTED PRIVATE KEY]");
  replace(/\b(?:sk[-_](?:live[-_])?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, "[REDACTED TOKEN]");
  replace(/\b(password|passwd|pwd|pin|otp|one[- ]time (?:code|password)|verification code|security code|cvv|cvc|api[-_ ]?key|access[-_ ]?token|secret)(\s*(?:is\s+|[:=]\s*)|\s+)(["']?)([^\s,;"']{3,})\3/gi,
    (match, label, separator: string, quote: string, value: string) => {
      // Keep ordinary scam requests ("password to verify") rather than redact prose.
      if (/^(?:to|for|your|please|with|here|now|never|should|required|needed|reset|expires|will|has)$/i.test(value)) return match;
      // A bare space ("password request", "password there") is prose unless the
      // value is quoted or looks secret-like (contains a digit or symbol).
      if (!/[:=]|\bis\s/i.test(separator) && !quote && /^[A-Za-z]+[.!?]?$/.test(value)) return match;
      return `${label}: [REDACTED]`;
    });
  replace(/\b(?:\d[ -]?){12,18}\d\b/g, "[REDACTED CARD/ACCOUNT NUMBER]");
  replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED ID]");
  replace(/([?&](?:token|key|secret|password|code|auth|signature)=)[^&\s]+/gi, (_match, prefix) => `${prefix}[REDACTED]`);
  return { text, detected };
}

export const MAX_MESSAGE_LENGTH = 12_000;