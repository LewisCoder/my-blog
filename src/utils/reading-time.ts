/**
 * 粗略估算阅读时长（分钟）：中文按 400 字/分钟，英文按 200 词/分钟。
 * 代码块与图片不计入。
 */
export function getReadingTime(body: string | undefined): number {
	if (!body) return 1;

	const text = body
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');

	const cjk = (text.match(/[一-鿿]/g) ?? []).length;
	const words = (text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;

	return Math.max(1, Math.ceil(cjk / 400 + words / 200));
}