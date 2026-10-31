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
function youtubeId(value?: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) return null
    if (url.pathname === '/watch') return url.searchParams.get('v')
    const match = url.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)
    return match?.[1] || null
  } catch {
    return null
  }
}
function isContactOrLegacyLink(value?: string) {
  if (!value) return false
  return /(?:drop\.od\.ua|mailto:|tel:|wa\.me\/|@gmail\.com|@outlook\.|@yahoo\.|\+359[\s()-]*\d|\+380[\s()-]*\d)/i.test(value)
}
function blockText(block: BlogTextBlock) {
  return (block.children || []).map((child) => child.text || '').join(' ').trim()
}
function isContactCta(block: BlogTextBlock) {
  const text = blockText(block)
  if (!text) return false
  const hasContactLink = (block.markDefs || []).some((mark) => isContactOrLegacyLink(mark.href))
  const hasContactDetails = isContactOrLegacyLink(text)
  const isCta = /(?:свържете се с нас|свяжитесь с нами|contact us|get in touch|направете запитване|send us a message|обадете се|позвоните|call us|пишете ни|напишете ни|написать нам)/i.test(text)
  return hasContactDetails || (hasContactLink && isCta)
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
        if (definition?._type === 'link' && href && !isContactOrLegacyLink(href)) content = <a key={mark} href={href} target={definition.blank ? '_blank' : undefined} rel={definition.blank ? 'noopener noreferrer' : undefined} className="text-emerald-800 underline underline-offset-4">{content}</a>
      }
    }
    return <React.Fragment key={child._key || index}>{content}</React.Fragment>
  })
}
export function BlogContent({blocks}: {blocks: BlogTextBlock[]}) {
  return <div className="blog-content space-y-5 text-base leading-8 text-slate-700">
    {blocks.map((block, index) => {
      const key = block._key || index
      if (isContactCta(block)) return null
      if (block._type === 'youtubeEmbed') {
        const id = youtubeId(block.url)
        return id ? <figure key={key} className="my-8"><div className="aspect-video overflow-hidden rounded-xl bg-slate-100"><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={block.title || 'Florial video'} loading="lazy" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>{block.caption ? <figcaption className="mt-2 text-center text-sm text-slate-500">{block.caption}</figcaption> : null}</figure> : null
      }
      if (block._type === 'image') {
        if (!block.assetUrl) return null
        const imageLink = safeHref(block.linkUrl)
        const image = <img src={block.assetUrl} alt={block.alt || ''} loading="lazy" className="mx-auto max-h-[420px] w-auto max-w-full rounded-xl object-contain" />
        return <figure key={key} className="my-8">
          {imageLink && !isContactOrLegacyLink(imageLink)
            ? <a href={imageLink} className="block rounded-xl border border-[#E1E6D7] bg-white p-3 no-underline transition hover:shadow-md">{image}<span className="mt-2 block text-center text-sm font-semibold text-emerald-800">{block.caption || ''}</span></a>
            : image}
          {!imageLink && block.caption ? <figcaption className="mt-2 text-center text-sm text-slate-500">{block.caption}</figcaption> : null}
        </figure>
      }
      if (block.listItem) return <div key={key} className="pl-5">{block.listItem === 'number' ? <ol className="list-decimal"><li>{renderChildren(block)}</li></ol> : <ul className="list-disc"><li>{renderChildren(block)}</li></ul>}</div>
      const text = renderChildren(block)
      if (block.style === 'h2') return <h2 key={key} className="pt-5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{text}</h2>
      if (block.style === 'h3') return <h3 key={key} className="pt-4 text-xl font-bold text-slate-900 md:text-2xl">{text}</h3>
      if (block.style === 'h4') return <h4 key={key} className="pt-3 text-lg font-bold text-slate-900">{text}</h4>
      if (block.style === 'blockquote') return <blockquote key={key} className="border-l-4 border-[#A5B483] pl-5 italic text-slate-600">{text}</blockquote>
      return <p key={key}>{text}</p>
    })}
  </div>
}
