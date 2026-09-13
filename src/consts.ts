export const SITE_TITLE = 'hkbarton';
export const SITE_DESCRIPTION = 'The homepage for hkbarton.';

// Default language for the <html lang> attribute and date formatting. A post or
// page can override it with a `lang` field in its frontmatter, e.g. `zh-Hans`.
// Getting this right matters for CJK: browsers pick Han glyphs by language, so
// Chinese text tagged `en` can render with Japanese letterforms.
export const SITE_LANG = 'en';

// Header navigation, in order. `href` is a path on this site, so it must match
// the slug of a page you created in Keystatic: slug `about` serves at `/about`.
// Add a line here and the link appears; there is nothing else to change.
// A link is highlighted when the current URL is it or sits below it.
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Blog', href: '/blog' },
  // { label: 'About', href: '/about' },
];

// Projects listed on the landing page. Each has its own marketing site;
// this site only links to them.
export const PROJECTS: { name: string; description: string; url: string }[] = [
  {
    name: 'Howcomet',
    description: 'AI Chat build for my kids and other kids, help them to learn not just get answer.',
    url: 'https://howcomet.com',
  },
  /*
  {
    name: 'Keyline',
    description: 'TODO: one line about Keyline.',
    url: 'https://keyline.app', // TODO: confirm
  },
  */
];
