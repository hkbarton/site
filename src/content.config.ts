import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		pubDate: z.coerce.date(),
		draft: z.boolean().default(false),
		// BCP 47 tag, e.g. 'zh-Hans'. Falls back to SITE_LANG.
		lang: z.string().optional(),
	}),
});

const pages = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
	schema: z.object({
		title: z.string(),
		updated: z.coerce.date().optional(),
		bare: z.boolean().default(false),
		// BCP 47 tag, e.g. 'zh-Hans'. Falls back to SITE_LANG.
		lang: z.string().optional(),
	}),
});

export const collections = { posts, pages };
