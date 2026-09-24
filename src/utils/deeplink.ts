import type { Href } from 'expo-router';

const STING_PATH = /^\/?sting\/([^/?#]+)/i;
const PLACE_PATH = /^\/?(?:place|p)\/([^/?#]+)/i;
const CAMPAIGN_PATH = /^\/?campaign\/([^/?#]+)/i;
const INVITE_PATH = /^\/?i\/([^/?#]+)/i;
const TABS_PATH = /^\/?(\(tabs\))?\/?$/i;

export type ParsedDeeplink =
  | { kind: 'sting'; id: string }
  | { kind: 'place'; id: string }
  | { kind: 'campaign'; id: string }
  | { kind: 'invite'; code: string }
  | { kind: 'tabs' }
  | { kind: 'unknown' };

function extractPath(raw: string): string {
  const trimmed = raw.trim();

  try {
    if (trimmed.includes('://')) {
      const url = new URL(trimmed);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.pathname.replace(/^\/+/, '');
      }

      return `${url.host}${url.pathname}`.replace(/^\/+/, '');
    }
  } catch {
    // not a full URL — treat as a router path
  }

  return trimmed.replace(/^\/+/, '');
}

export function parseDeeplink(raw: string | null | undefined): ParsedDeeplink {
  if (!raw) {
    return { kind: 'unknown' };
  }

  const path = extractPath(raw);

  const sting = path.match(STING_PATH);
  if (sting?.[1]) {
    return { kind: 'sting', id: sting[1] };
  }

  const place = path.match(PLACE_PATH);
  if (place?.[1]) {
    return { kind: 'place', id: place[1] };
  }

  const campaign = path.match(CAMPAIGN_PATH);
  if (campaign?.[1]) {
    return { kind: 'campaign', id: campaign[1] };
  }

  const invite = path.match(INVITE_PATH);
  if (invite?.[1]) {
    return { kind: 'invite', code: invite[1] };
  }

  if (TABS_PATH.test(path) || path === '(tabs)' || path === 'tabs') {
    return { kind: 'tabs' };
  }

  return { kind: 'unknown' };
}

export function hrefForDeeplink(parsed: ParsedDeeplink): Href {
  switch (parsed.kind) {
    case 'sting':
      return `/(modals)/sting/${parsed.id}` as Href;
    case 'place':
      return `/(modals)/place/${parsed.id}?source=deeplink` as Href;
    case 'campaign':
      return '/(tabs)' as Href;
    case 'invite':
      return '/(auth)/register' as Href;
    default:
      return '/(tabs)' as Href;
  }
}
