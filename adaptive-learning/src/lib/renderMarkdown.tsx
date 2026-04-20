import React from 'react';

export function renderInline(text: string): React.ReactNode {
  // Handle **bold** and line breaks within a paragraph
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Handle \n within a block as <br>
    if (part.includes('\n')) {
      return part.split('\n').map((line, j, arr) => (
        <span key={`${i}-${j}`}>
          {line}
          {j < arr.length - 1 && <br />}
        </span>
      ));
    }
    return part;
  });
}

export function renderMarkdown(text: string) {
  // Simple markdown-like rendering for our content blocks
  // Handles: **bold**, > blockquotes, ### headings, numbered lists, bullet lists, \n\n paragraphs
  const parts = text.split('\n\n');

  return parts.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      return (
        <blockquote
          key={i}
          className="border-l-4 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 pl-4 py-3 my-4 text-blue-900 dark:text-blue-200 italic"
        >
          {renderInline(quoteText)}
        </blockquote>
      );
    }

    // Heading (### or ##)
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={i} className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">
          {renderInline(trimmed.replace(/^###\s*/, ''))}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={i} className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
          {renderInline(trimmed.replace(/^##\s*/, ''))}
        </h3>
      );
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split('\n').filter((line) => line.trim());
      return (
        <ol key={i} className="list-decimal list-outside ml-6 my-4 space-y-2">
          {items.map((item, j) => (
            <li key={j} className="text-gray-700 dark:text-gray-200 leading-relaxed pl-1">
              {renderInline(item.replace(/^\d+\.\s*/, ''))}
            </li>
          ))}
        </ol>
      );
    }

    // Bullet list (- or *)
    if (/^[-*]\s/.test(trimmed)) {
      const items = trimmed.split('\n').filter((line) => line.trim());
      return (
        <ul key={i} className="list-disc list-outside ml-6 my-4 space-y-2">
          {items.map((item, j) => (
            <li key={j} className="text-gray-700 dark:text-gray-200 leading-relaxed pl-1">
              {renderInline(item.replace(/^[-*]\s*/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    // Image: ![alt](src)
    if (/^!\[.*\]\(.*\)$/.test(trimmed)) {
      const match = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        return (
          <figure key={i} className="my-4">
            <img
              src={match[2]}
              alt={match[1]}
              className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
              loading="lazy"
            />
            {match[1] && (
              <figcaption className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center italic">
                {match[1]}
              </figcaption>
            )}
          </figure>
        );
      }
    }

    // Regular paragraph
    return (
      <p key={i} className="text-gray-700 dark:text-gray-200 leading-relaxed my-3">
        {renderInline(trimmed)}
      </p>
    );
  });
}
