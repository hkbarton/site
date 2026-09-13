import { collection, config, fields } from '@keystatic/core';

// Image paths are relative to the entry file on disk so Astro's markdown
// pipeline picks them up through `astro:assets` (optimized at build time)
// instead of serving raw files from `public/`.
const postImages = {
	directory: 'src/assets/images/posts',
	publicPath: '../../assets/images/posts/',
};

// Pages live two levels deep (`src/content/pages/<app>/<page>.md`), which the
// privacy-policy URLs depend on. Keep new pages at that depth or the relative
// image path below stops resolving.
const pageImages = {
	directory: 'src/assets/images/pages',
	publicPath: '../../../assets/images/pages/',
};

export default config({
	// GitHub mode, not `local`. Keystatic's API route refuses
	// `storage: { kind: 'local' }` outside Node, and the Cloudflare adapter runs
	// every server route inside workerd — in `astro dev` as well as in
	// production. Local editing happens in iA Writer against the `.md` files.
	storage: {
		kind: 'github',
		repo: { owner: 'hkbarton', name: 'site' },
	},
	ui: {
		brand: { name: 'hkbarton.com' },
	},
	collections: {
		posts: collection({
			label: 'Posts',
			slugField: 'title',
			path: 'src/content/posts/*',
			format: { contentField: 'content' },
			entryLayout: 'content',
			columns: ['pubDate', 'draft'],
			schema: {
				title: fields.slug({ name: { label: 'Title' } }),
				description: fields.text({ label: 'Description', multiline: true }),
				pubDate: fields.date({
					label: 'Published',
					defaultValue: { kind: 'today' },
					validation: { isRequired: true },
				}),
				draft: fields.checkbox({ label: 'Draft' }),
				lang: fields.select({
					label: 'Language',
					description: 'Sets <html lang> and date formatting.',
					options: [
						{ label: 'English', value: 'en' },
						{ label: '简体中文', value: 'zh-Hans' },
						{ label: '繁體中文', value: 'zh-Hant' },
					],
					defaultValue: 'en',
				}),
				content: fields.markdoc({
					label: 'Content',
					extension: 'md',
					options: { image: postImages },
				}),
			},
		}),
		pages: collection({
			label: 'Pages',
			slugField: 'title',
			path: 'src/content/pages/**',
			format: { contentField: 'content' },
			entryLayout: 'content',
			columns: ['bare'],
			schema: {
				title: fields.slug({
					name: { label: 'Title' },
					slug: {
						label: 'Path',
						description: 'URL path, e.g. keyline/privacy. Never rename a published path.',
					},
				}),
				updated: fields.date({ label: 'Last updated' }),
				bare: fields.checkbox({ label: 'Bare layout (no nav, no footer)' }),
				lang: fields.select({
					label: 'Language',
					description: 'Sets <html lang> and date formatting.',
					options: [
						{ label: 'English', value: 'en' },
						{ label: '简体中文', value: 'zh-Hans' },
						{ label: '繁體中文', value: 'zh-Hant' },
					],
					defaultValue: 'en',
				}),
				content: fields.markdoc({
					label: 'Content',
					extension: 'md',
					options: { image: pageImages },
				}),
			},
		}),
	},
});
