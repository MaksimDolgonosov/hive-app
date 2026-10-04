export const PUBLIC_SITE_HOST = 'hive-app.site';
export const PUBLIC_SITE_ORIGIN = `https://${PUBLIC_SITE_HOST}`;
export const PRIVACY_POLICY_URL = `${PUBLIC_SITE_ORIGIN}/policy`;
export const DELETE_ACCOUNT_URL = `${PUBLIC_SITE_ORIGIN}/delete-account`;

export function inviteShareUrl(code: string): string {
  return `${PUBLIC_SITE_ORIGIN}/i/${code}`;
}

export function placePageUrl(id: string): string {
  return `${PUBLIC_SITE_ORIGIN}/p/${id}`;
}
