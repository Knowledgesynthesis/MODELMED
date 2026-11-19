import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Link } from 'react-router-dom';
import { referenceMap } from '@/content/references';
import { linkCitations } from '@/lib/citations';
import { cn } from '@/lib/utils';

const components = {
  a: ({ href = '', title, children }: { href?: string; title?: string; children?: React.ReactNode }) => {
    if (title === 'cite') {
      const key = href.split('#')[1];
      const r = referenceMap[key];
      return (
        <Link to={href} className="cite" title={r ? `${r.citation} ${r.title}` : undefined}>
          {children}
        </Link>
      );
    }
    if (href.startsWith('/')) return <Link to={href}>{children}</Link>;
    return (
      <a href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  },
};

export const Markdown = React.memo(function Markdown({ md, className }: { md: string; className?: string }) {
  return (
    <div className={cn('prose-mm', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components as never}>
        {linkCitations(md)}
      </ReactMarkdown>
    </div>
  );
});
