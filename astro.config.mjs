// @ts-check

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

/**
 * 支持在代码块语言后写行号区间来高亮指定行，例如：
 * ```js {2-3}
 * 高亮的行会带上 .highlighted 类。
 *
 * @returns {import('shiki').ShikiTransformer}
 */
function transformerMetaHighlight() {
	return {
		name: 'meta-highlight',
		line(node, line) {
			const raw = this.options.meta?.__raw;
			const match = raw?.match(/\{([\d,\s-]+)\}/);
			if (!match) return;

			const highlighted = new Set();
			for (const part of match[1].split(',')) {
				const [startText, endText] = part.trim().split('-');
				const start = Number(startText);
				if (!Number.isInteger(start)) continue;
				const end = endText === undefined ? start : Number(endText);
				if (!Number.isInteger(end)) continue;
				for (let i = start; i <= end; i += 1) highlighted.add(i);
			}

			if (highlighted.has(line)) {
				node.properties.class = [node.properties.class, 'highlighted'].filter(Boolean).join(' ');
			}
		},
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://zhongliwen.com',
	markdown: {
		shikiConfig: {
			transformers: [transformerMetaHighlight()],
		},
	},
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
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