/**
 * @module pipeline/pii
 * @description
 * Lightweight Zero-Knowledge Personally Identifiable Information (PII) scrubber.
 * Scans deep nested JSON structures and strings to redact sensitive tokens
 * before data is aggregated and transmitted to the SipHeron API platform.
 */

const PII_PATTERNS = [
  // Emails
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: '[REDACTED_EMAIL]' },
  
  // High-confidence phone numbers (North American/Intl blocks)
  // Ensures spacing / dashes / brackets are matched cleanly.
  { regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, label: '[REDACTED_PHONE]' },

  // Credit cards (Visa, MC, Amex, Discover loosely)
  { regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9][0-9])[0-9]{12})\b/g, label: '[REDACTED_CREDIT_CARD]' },
  
  // Social Security Numbers (US)
  { regex: /\b(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}\b/g, label: '[REDACTED_SSN]' },
  
  // IPv4 Addresses
  { regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, label: '[REDACTED_IP]' },

  // SECRETS & KEYS (Basic detection of standard 32+ char hex/b64 keys)
  { regex: /\b[A-Za-z0-9+/]{40,}=*\b/g, label: '[REDACTED_API_KEY]' },
];

/**
 * Searches a raw string for cryptographic secrets or PII.
 */
export function redactString(input: string): { redacted: string; matches: number } {
  let redacted = input;
  let matches = 0;
  
  for (const pattern of PII_PATTERNS) {
    const matchedArr = redacted.match(pattern.regex);
    if (matchedArr && matchedArr.length > 0) {
      matches += matchedArr.length;
      redacted = redacted.replace(pattern.regex, pattern.label);
    }
  }
  return { redacted, matches };
}

/**
 * Traverses a JSON payload entirely to strip fields and return a cloned, 
 * sanitised artifact with no nested PII left over.
 */
export function scrubPayload(obj: any): { sanitized: any; piiDetected: boolean } {
  let piiDetected = false;

  function traverse(item: any): any {
    if (typeof item === 'string') {
      const result = redactString(item);
      if (result.matches > 0) piiDetected = true;
      return result.redacted;
    }
    
    if (Array.isArray(item)) {
      return item.map(child => traverse(child));
    }
    
    if (item !== null && typeof item === 'object') {
      const newObj: Record<string, any> = {};
      for (const key of Object.keys(item)) {
         newObj[key] = traverse(item[key]);
      }
      return newObj;
    }
    
    // Pass through integers, booleans, and null
    return item;
  }

  const sanitized = traverse(obj);
  return { sanitized, piiDetected };
}
