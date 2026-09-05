/**
 * D9 — the mock resolves an influencer's name, bio and a post's caption from `Accept-Language`,
 * so every social key is locale-scoped exactly like the catalogue's.
 */
export const socialKeys = {
  influencers: (locale: string) => ['social', 'influencers', locale] as const,
  profile: (locale: string, id: string) =>
    ['social', 'profile', locale, id] as const,
};
