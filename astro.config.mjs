// @ts-check
import { readFile } from 'node:fs/promises';
import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';

/**
 * Vite hands the workerd dev runtime a few CommonJS files untransformed, and
 * workerd has no `exports` binding, so they die with
 * `ReferenceError: exports is not defined`.
 *
 * It happens because Astro loads the Keystatic-injected API route by absolute
 * path inside `node_modules`, which bypasses Vite's dependency pre-bundling.
 * Two packages in that import graph ship CommonJS only:
 *
 *   - `@braintree/sanitize-url` (v6 and v7 are both CommonJS-only)
 *   - `cookie@1.x`, installed nested under `@keystatic/core` because Astro
 *     holds `cookie@2.x`, which is ESM, at the top level
 *
 * This wraps those files in an ES module shim, reading the named exports back
 * out of `module.exports`. Scoped to an explicit allowlist so it can never
 * touch anything else. Production builds do not need it (Rolldown bundles the
 * server with CommonJS interop); it is inert there. Drop each entry once the
 * package ships ESM.
 */
function cjsInteropForWorkerd() {
	const CJS_ONLY = ['@braintree/sanitize-url', '@keystatic/core/node_modules/cookie'];

	/** Collect `exports.foo = ...` and `Object.defineProperty(exports, "foo", ...)`. */
	function namedExports(/** @type {string} */ source) {
		const names = new Set();
		for (const m of source.matchAll(/(?:^|[\s;{}])exports\.([A-Za-z_$][\w$]*)\s*=/g)) {
			names.add(m[1]);
		}
		for (const m of source.matchAll(
			/Object\.defineProperty\(\s*exports\s*,\s*['"]([A-Za-z_$][\w$]*)['"]/g,
		)) {
			names.add(m[1]);
		}
		names.delete('__esModule');
		names.delete('default');
		return [...names];
	}

	return {
		name: 'hkbarton:cjs-interop-for-workerd',
		enforce: /** @type {const} */ ('pre'),
		async load(/** @type {string} */ id) {
			const file = id.split('?')[0];
			if (!file.endsWith('.js') && !file.endsWith('.cjs')) return null;
			if (!CJS_ONLY.some((pkg) => file.includes(pkg))) return null;

			const source = await readFile(file, 'utf8');
			// Already ESM (a future release of the package) — leave it alone.
			if (/^\s*(?:import|export)[\s{*'"]/m.test(source)) return null;

			// Run the CommonJS body inside a function scope so its top-level
			// declarations cannot collide with the export bindings we append, then
			// re-export each name through a private alias.
			const names = namedExports(source);
			return [
				'const module = { exports: {} };',
				'(function (module, exports) {',
				source,
				'})(module, module.exports);',
				'export default module.exports;',
				...names.map((n, i) => `const __cjs${i} = module.exports.${n};`),
				names.length
					? `export { ${names.map((n, i) => `__cjs${i} as ${n}`).join(', ')} };`
					: '',
			].join('\n');
		},
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://hkbarton.com',

	// URLs never carry a trailing slash: /blog, /blog/<slug>, /keyline/privacy.
	// Pair with `html_handling: "drop-trailing-slash"` in wrangler.jsonc.
	trailingSlash: 'never',
	build: { format: 'file' },

	// Default output is static. Every page is prerendered; only the routes the
	// Keystatic integration injects (/keystatic, /api/keystatic) are on demand.
	adapter: cloudflare({
		// Optimize images at build time (sharp); nothing is transformed at runtime,
		// so no Cloudflare Images binding is needed.
		imageService: 'compile',
	}),

	// No sessions: nothing on the site needs them, and this keeps the adapter
	// from provisioning a KV namespace.
	session: false,

	integrations: [
		react(),
		keystatic(),
		sitemap({ filter: (page) => !page.includes('/keystatic') }),
	],

	vite: {
		plugins: [cjsInteropForWorkerd()],

		environments: {
			// The Keystatic admin API runs inside workerd. A few packages in its
			// import graph ship CommonJS only, which the workerd module runner
			// cannot evaluate, so pre-bundle them to ESM for this environment.
			ssr: {
				optimizeDeps: {
					include: [
						'@braintree/sanitize-url',
						'react',
						'react/jsx-runtime',
						'react-dom',
						'react-dom/server',
					],
				},
			},
		},
	},

	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson Hyperlegible',
			cssVariable: '--font-body',
			// Atkinson Hyperlegible has no CJK glyphs, so Chinese text falls through
			// this list character by character. Name real CJK families explicitly
			// rather than relying on `system-ui` to delegate, which it does not do
			// consistently across platforms.
			fallbacks: [
				'system-ui',
				'PingFang SC',
				'Hiragino Sans GB',
				'Microsoft YaHei',
				'Noto Sans CJK SC',
				'sans-serif',
			],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
