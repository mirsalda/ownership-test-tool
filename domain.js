import { domainToASCII } from 'node:url';

// Turns things like "https://Example.com/some/path" into "example.com".
// Returns null if the result isn't a plausible domain name.
export function normalizeDomain(input) {
  let d = String(input || '').trim().toLowerCase();
  d = d.replace(/^https?:\/\//, ''); // drop scheme
  d = d.split(/[/?#]/)[0];            // drop path/query/fragment
  d = d.replace(/:\d+$/, '');         // drop port
  d = d.replace(/\.$/, '');           // drop trailing dot
  d = domainToASCII(d);               // unicode -> punycode ('' if invalid)

  const label = '[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?';
  const valid = new RegExp(`^(?=.{1,253}$)(${label}\.)+${label}$`).test(d);
  return valid ? d : null;
}
