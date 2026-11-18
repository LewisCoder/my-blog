export interface SearchIndexRecord {
	id: string;
	title: string;
	description: string;
	tags: string[];
	pubDate: string;
	url: string;
	body: string;
}

/**
 * 把 Markdown 正文转换为搜索用纯文本。
 *
 * 去除排版标记（标题符、强调符、链接语法、HTML 标签等），
 * 但完整保留代码块与行内代码中的文本，让 `<T>`、`__init__` 等标识符仍可被搜索。
 */
export function markdownToSearchText(markdown: string): string {
	let text = (markdown ?? '').replace(/\r\n?/g, '\n');

	// 防御性处理：如果传入内容意外包含 frontmatter，先移除
	text = text.replace(/^---\n[\s\S]*?\n---\n?/, '');

	// 先把代码暂存为占位符，避免后续 Markdown 清理误删代码中的标识符
	const codeParts: string[] = [];
	const stashCode = (code: string) => {
		codeParts.push(code);
		return `\uE000${codeParts.length - 1}\uE001`;
	};

	// 围栏代码块：去掉围栏行，保留代码文本
	text = text.replace(
		/^[ \t]*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^[ \t]*\1[ \t]*$/gm,
		(_match, _fence: string, code: string) => stashCode(code),
	);
	// 行内代码：保留内容
	text = text.replace(/`([^`\n]+)`/g, (_match, code: string) => stashCode(code));

	// 图片与链接：图片丢弃，链接保留文字
	text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
	text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

	// HTML 标签
	text = text.replace(/<[^>]+>/g, ' ');

	// 标题、引用与列表符号
	text = text.replace(/^[ \t]*(?:#{1,6}|>)[ \t]+/gm, '');
	text = text.replace(/^[ \t]*(?:[-+*]|\d+\.)[ \t]+/gm, '');

	// 分隔线与表格分隔行
	text = text.replace(/^[ \t]*(?:\*[ \t]*){3,}$/gm, ' ');
	text = text.replace(/^[ \t]*\|?[ \t]*:?-{3,}:?[ \t]*(\|[ \t]*:?-{3,}:?[ \t]*)*\|?[ \t]*$/gm, ' ');

	// 表格竖线
	text = text.replace(/\|/g, ' ');

	// 强调标记：只处理成对标记，避免破坏 snake_case 标识符
	text = text.replace(/\*\*([^*\n]+)\*\*/g, '$1');
	text = text.replace(/__([^_\n]+)__/g, '$1');
	text = text.replace(/~~([^~\n]+)~~/g, '$1');
	text = text.replace(/(^|[\s(（、，。；：])[*_]([^*_\n]+)[*_](?=[\s)）.,，。!?！？;；:：、]|$)/gm, '$1$2');

	// 还原代码原文
	text = text.replace(/\uE000(\d+)\uE001/g, (_match, index: string) => codeParts[Number(index)]);

	// 压缩空白，并去掉中文标点前的多余空格
	return text
		.replace(/\s+/g, ' ')
		.replace(/\s+([，。！？；：、）】》])/g, '$1')
		.trim();
}