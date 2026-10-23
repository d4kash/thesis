const SUPPORTED_SOURCE_HOSTS = new Set([
  "shodhganga.inflibnet.ac.in",
  "pubs.rsc.org",
  "www.pubs.rsc.org",
]);

export const MAX_PUBLIC_SOURCE_HTML_BYTES = 350_000;

export class PublicSourceUrlError extends Error {}

export interface PublicSourcePreview {
  url: string;
  host: string;
  title: string;
  description: string;
  authors: string[];
  published: string;
  doi: string;
  recordSuggestion: string;
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function extractAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;

  for (const match of tag.matchAll(attributePattern)) {
    const name = match[1]?.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4];
    if (name && value !== undefined) attributes[name] = cleanText(value);
  }

  return attributes;
}

function findMetaValues(html: string, names: string[]): string[] {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const values: string[] = [];

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = extractAttributes(tag);
    const key = attributes.name ?? attributes.property ?? attributes.itemprop ?? "";
    const value = attributes.content;
    if (wanted.has(key.toLowerCase()) && value) values.push(value);
  }

  return [...new Set(values.filter(Boolean))];
}

function findFirstMetaValue(html: string, names: string[]): string {
  return findMetaValues(html, names)[0] ?? "";
}

function findDocumentTitle(html: string): string {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? cleanText(match[1]) : "";
}

export function parseSupportedPublicSourceUrl(value: string): URL {
  if (value.trim().length === 0 || value.length > 2_000) {
    throw new PublicSourceUrlError("Paste a complete public repository or publisher URL.");
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new PublicSourceUrlError("That does not look like a valid web address.");
  }

  if (url.protocol !== "https:") {
    throw new PublicSourceUrlError("Only secure HTTPS source links can be previewed.");
  }

  if (url.username || url.password || url.port || !SUPPORTED_SOURCE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new PublicSourceUrlError("Use a public Shodhganga or RSC source link. More sources can be added after a security review.");
  }

  return url;
}

export function extractPublicSourcePreview(html: string, sourceUrl: string): PublicSourcePreview {
  const url = parseSupportedPublicSourceUrl(sourceUrl);
  const title = findFirstMetaValue(html, ["citation_title", "dc.title", "og:title", "twitter:title"])
    || findDocumentTitle(html)
    || `Public record at ${url.hostname}`;
  const description = findFirstMetaValue(html, [
    "citation_abstract",
    "description",
    "dc.description",
    "og:description",
    "twitter:description",
  ]).slice(0, 900);
  const authors = findMetaValues(html, ["citation_author", "dc.creator", "author"]);
  const published = findFirstMetaValue(html, ["citation_publication_date", "dc.date", "article:published_time"]);
  const doi = findFirstMetaValue(html, ["citation_doi", "dc.identifier", "doi"])
    .replace(/^https?:\/\/doi\.org\//i, "");
  const referenceParts = [title, authors.length > 0 ? `Authors: ${authors.join(", ")}` : "", published ? `Published: ${published}` : "", doi ? `DOI: ${doi}` : "", url.toString()]
    .filter(Boolean);

  return {
    url: url.toString(),
    host: url.hostname,
    title,
    description,
    authors,
    published,
    doi,
    recordSuggestion: referenceParts.join(" · "),
  };
}
