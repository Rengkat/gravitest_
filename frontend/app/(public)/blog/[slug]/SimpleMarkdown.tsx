// A small, dependency-free markdown renderer for post bodies — no
// react-markdown/remark in package.json, and installing a new dependency
// isn't something to do without being able to verify it installs
// cleanly. Covers what admin-authored blog content actually needs:
// headings, paragraphs, bold/italic, links, and simple lists. Not a
// general-purpose CommonMark implementation.
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Order matters: links first (so ** inside link text isn't mangled),
  // then bold, then italic.
  const pattern = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      nodes.push(
        <a
          key={`${keyPrefix}-${i++}`}
          href={match[3]}
          className="text-green-700 underline underline-offset-2 hover:text-green-800"
          target={match[3].startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer">
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      nodes.push(<strong key={`${keyPrefix}-${i++}`}>{match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(<em key={`${keyPrefix}-${i++}`}>{match[7]}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export default function SimpleMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Headings
        const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          const cls =
            level === 1
              ? "font-serif text-[28px] text-green-900 mt-8 mb-2"
              : level === 2
                ? "font-serif text-[22px] text-green-900 mt-7 mb-2"
                : "font-serif text-[18px] text-green-900 mt-6 mb-1";
          if (level === 1) return <h2 key={i} className={cls}>{renderInline(text, `h${i}`)}</h2>;
          if (level === 2) return <h3 key={i} className={cls}>{renderInline(text, `h${i}`)}</h3>;
          return <h4 key={i} className={cls}>{renderInline(text, `h${i}`)}</h4>;
        }

        // Unordered lists
        if (/^-\s+/.test(trimmed)) {
          const items = trimmed.split("\n").map((l) => l.replace(/^-\s+/, ""));
          return (
            <ul key={i} className="list-disc pl-6 space-y-1.5 text-green-900/80">
              {items.map((item, j) => (
                <li key={j} className="text-[15px] leading-relaxed">
                  {renderInline(item, `li${i}-${j}`)}
                </li>
              ))}
            </ul>
          );
        }

        // Paragraph
        return (
          <p key={i} className="text-[15px] leading-[1.8] text-green-900/80 whitespace-pre-line">
            {renderInline(trimmed, `p${i}`)}
          </p>
        );
      })}
    </div>
  );
}
