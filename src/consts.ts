export const SITE_TITLE = 'hkbarton';
export const SITE_DESCRIPTION = 'Hobby projects and occasional writing.';

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
		description: 'TODO: one line about Howcomet.',
		url: 'https://howcomet.com', // TODO: confirm
	},
	{
		name: 'Keyline',
		description: 'TODO: one line about Keyline.',
		url: 'https://keyline.app', // TODO: confirm
	},
];
