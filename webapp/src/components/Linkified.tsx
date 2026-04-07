import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export default function Linkified({ text }: { text: string }) {
  if (!text) return null;
  
  // Split on both URL and <br/> tags
  // Actually, split on URL first, then handle <br/> within each part
  const parts = text.split(URL_REGEX);
  
  return (
    <>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                color: 'var(--sys-blue)',
                textDecoration: 'underline',
                wordBreak: 'break-all',
              }}
            >
              {part}
            </a>
          );
        }
        
        // Handle standard newlines AND the <br/> tags returned by Gemini
        const lineParts = part.split(/<br\s*\/?>|\n/);
        
        return lineParts.map((line, j, arr) => (
          <React.Fragment key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ));
      })}
    </>
  );
}
