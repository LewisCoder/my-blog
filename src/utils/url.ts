const BASE = import.meta.env.BASE_URL;

/**
 * Prefix a root-relative path with the configured base path.
 * Needed because `base` is not applied automatically to links written by hand.
 *
 * withBase('/blog/') -> '/my-blog/blog/'
 */
export function withBase(path = '/'): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `${BASE.replace(/\/$/, '')}${normalized}`;
}