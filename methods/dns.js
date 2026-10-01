// DNS TXT verification: the user adds a TXT record at the root of their domain.
import { Resolver } from 'node:dns/promises';

const PREFIX = 'ownership-test-verification=';

// Ask public resolvers directly instead of the OS resolver, so we don't
// get stale answers from a local cache while testing.
const resolver = new Resolver({ timeout: 5000, tries: 2 });
resolver.setServers(['1.1.1.1', '8.8.8.8']);

export const label = 'DNS TXT record';

export function instructions(domain, token) {
  return {
    summary: `Add this TXT record at the root of ${domain} in your DNS provider. DNS changes can take a few minutes to show up.`,
    fields: [
      { label: 'Type', value: 'TXT' },
      { label: 'Name / Host', value: '@', note: `means ${domain} itself; some providers want the full name or an empty field` },
      { label: 'Value', value: PREFIX + token },
    ],
  };
}

export async function check(domain, token) {
  const expected = PREFIX + token;

  let records;
  try {
    records = await resolver.resolveTxt(domain);
  } catch (err) {
    if (err.code === 'ENODATA') {
      return { status: 'not_found', reason: `${domain} has no TXT records at all.` };
    }
    if (err.code === 'ENOTFOUND') {
      return { status: 'error', reason: `${domain} does not exist in DNS (NXDOMAIN).` };
    }
    return { status: 'error', reason: `DNS lookup failed: ${err.code || err.message}` };
  }

  // A TXT record can be split into several 255-byte chunks; join them back.
  const values = records.map((chunks) => chunks.join(''));

  if (values.some((v) => v.trim() === expected)) {
    return { status: 'verified', reason: `Found TXT record "${expected}" on ${domain}.` };
  }

  const ours = values.filter((v) => v.startsWith(PREFIX));
  if (ours.length) {
    return {
      status: 'not_found',
      reason: `Found a verification TXT record, but with a different token: ${ours.join(', ')}`,
    };
  }
  return {
    status: 'not_found',
    reason: `${values.length} TXT record(s) found on ${domain}, none match. Found: ${values.map((v) => JSON.stringify(v)).join(', ')}`,
  };
}
