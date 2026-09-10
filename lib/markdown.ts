/**
 * A very small markdown renderer for asset bodies.
 *
 * Deliberately not a dependency. Asset bodies are authored by us and stored
 * in our own database, the vocabulary in them is headings, paragraphs, lists,
 * blockquotes, bold and italic, and a real markdown library plus a sanitiser
 * is a lot of surface area to carry for that.
 *
 * Everything is escaped before any formatting is applied, so nothing in the
 * database can inject markup.
 */

function escape(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string) {
  return escape(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function renderMarkdown(source: string) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    out.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    out.push(`</${list}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 1, 5);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      out.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      continue;
    }

    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (ordered || bullet) {
      flushParagraph();
      const wanted: "ul" | "ol" = ordered ? "ol" : "ul";
      if (list !== wanted) {
        flushList();
        out.push(`<${wanted}>`);
        list = wanted;
      }
      out.push(`<li>${inline((ordered ?? bullet)![1])}</li>`);
      continue;
    }

    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      flushParagraph();
      flushList();
      out.push("<hr />");
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return out.join("\n");
}
