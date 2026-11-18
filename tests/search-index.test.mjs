import test from 'node:test';
import assert from 'node:assert/strict';

import { markdownToSearchText } from '../src/utils/search-index.ts';

test('代码块保留尖括号、泛型与双下划线标识符', () => {
	const markdown = ['```ts', 'const x: Array<string>;', 'function f<T>(v: T) {}', 'class A { __init__() {} }', '```'].join(
		'\n',
	);
	const text = markdownToSearchText(markdown);
	assert.equal(text, 'const x: Array<string>; function f<T>(v: T) {} class A { __init__() {} }');
});

test('行内代码保留标识符', () => {
	assert.equal(
		markdownToSearchText('使用 `Array<string>` 与 `__init__`，以及 `session_id`。'),
		'使用 Array<string> 与 __init__，以及 session_id。',
	);
});

test('去掉标题、强调、链接、图片与 HTML 标记', () => {
	const markdown = [
		'## 小标题',
		'',
		'**粗体**、*斜体*、[链接文字](https://example.com) 与 <span>HTML</span>。',
		'',
		'![图片](image.png)',
	].join('\n');
	assert.equal(markdownToSearchText(markdown), '小标题 粗体、斜体、链接文字 与 HTML。');
});

test('表格内容保留文字并去掉分隔行', () => {
	const markdown = ['| 名称 | 说明 |', '| --- | --- |', '| Agent | 智能体 |'].join('\n');
	assert.equal(markdownToSearchText(markdown), '名称 说明 Agent 智能体');
});