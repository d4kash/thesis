/**
 * Renders untrusted project text as a single literal Markdown text run.
 *
 * Project records can originate in a local backup or be typed into a textarea.
 * They must not be able to introduce headings, checkboxes, links, or raw HTML
 * into a supervisor-facing Markdown export. Static template text remains
 * responsible for the document structure.
 */
export function escapeMarkdownInlineText(value: string | null | undefined): string {
  const escaped = (value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([`*_[\]{}()!|~])/g, "\\$1");

  return escaped
    .replace(/^#/, "\\#")
    .replace(/^>/, "\\>")
    .replace(/^\+(?=\s|$)/, "\\+")
    .replace(/^-(?=-|\s|$)/, "\\-")
    .replace(/^(\d+)([.)])(?=\s)/, "$1\\$2");
}
