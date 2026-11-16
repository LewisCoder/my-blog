---
title: 'Markdown 写作速查'
description: '一篇覆盖常用 Markdown 语法的示例文章，可以直接当作写新文章时的参考。'
pubDate: '2026-11-02'
heroImage: '../../assets/blog-placeholder-5.jpg'
---

这篇文章演示了本站支持的主要 Markdown 语法，写新文章时可以参考。

## 文本格式

普通段落直接书写即可。**加粗**、*斜体*、~~删除线~~、`行内代码` 都很常用。

> 这是一段引用。
>
> 引用可以有多行，也可以嵌套其他元素，比如 [链接](https://astro.build/)。

## 列表

### 无序列表

- 第一项
- 第二项
  - 嵌套的子项
- 第三项

### 有序列表

1. 打开编辑器
2. 新建 Markdown 文件
3. 写文章并提交

## 代码块

带语言标记的代码块会启用语法高亮：

```js
function greet(name) {
	return `你好，${name}！`;
}

console.log(greet('世界'));
```

## 表格

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl + B` | 加粗 |
| `Ctrl + I` | 斜体 |
| `Ctrl + K` | 插入链接 |

## 图片

图片放在 `src/assets/` 目录，引用后会被自动优化：

![示例图片](../../assets/blog-placeholder-4.jpg)

## 分隔线

---

以上就是常用语法的示例。写文章时不需要记住全部内容，用到了再回来翻一眼就好。