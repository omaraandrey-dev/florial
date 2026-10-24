import React from 'react'
import type { BlogTextBlock } from '../lib/blog'

function safeHref(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value, window.location.origin)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? value : undefined
  } catch {
    return undefined
  }
}
function renderChildren(block: BlogTextBlock) {
  const marks = new Map((block.markDefs || []).map((mark) => [mark._key || '', mark]))
  return (block.children || []).map((child, index) => {
    let content: React.ReactNode = child.text || ''
    for (const mark of child.marks || []) {
      if (mark === 'strong') content = <strong key={mark}>{content}</strong>
      else if (mark === 'em') content = <em key={mark}>{content}</em>
      else if (mark === 'underline') content = <u key={mark}>{content}</u>
      else {
        const definition = marks.get(mark)
        const href = safeHref(definition?.href)
        if (definition?._type === 'link' && href) content = <a key={mark} href={href} target={definition.blank ? '_blank' : undefined} rel={definition.blank ? 'noopener noreferrer' : undefined} className="text-emerald-800 underline underline-offset-4">{content}</a>
      }
    }
    return <React.Fragment key={child._key || index}>{content}</React.Fragment>
  })
}
export function BlogContent({blocks}: {blocks: BlogTextBlock[]}) {
  return <div className="blog-content space-y-5 text-base leading-8 text-slate-700">
    {blocks.map((block, index) => {
      const key = block._key || index
      if (block._type === 'image') return block.assetUrl ? <figure key={key} className="my-8"><img src={block.assetUrl} alt={block.alt || ''} loading="lazy" className="mx-auto max-h-[680px] w-auto max-w-full rounded-xl object-contain" />{block.caption ? <figcaption className="mt-2 text-center text-sm text-slate-500">{block.caption}</figcaption> : null}</figure> : null
      if (block.listItem) return <div key={key} className="pl-5">{block.listItem === 'number' ? <ol className="list-decimal">{renderChildren(block)}</ol> : <ul className="list-disc">{renderChildren(block)}</ul>}</div>
      const content = renderChildren(block)
      if (block.style === 'h2') return <h2 key={key} className="pt-5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{content}</h2>
      if (block.style === 'h3') return <h3 key={key} className="pt-4 text-xl font-bold text-slate-900 md:text-2xl">{content}</h3>
      if (block.style === 'h4') return <h4 key={key} className="pt-3 text-lg font-bold text-slate-900">{content}</h4>
      if (block.style === 'blockquote') return <blockquote key={key} className="border-l-4 border-[#A5B483] pl-5 italic text-slate-600">{content}</blockquote>
      return <p key={key}>{content}</p>
    })}
  </div>
}
