import React from 'react'
import { handleInternalLinkClick, localizedHref } from '../lib/navigation'
import { classifyRichTextHref } from '../lib/richTextUtils.mjs'

interface RichTextProps {
  value: unknown
  language: string
  onNavigateInternalPath?: (path: string) => void
  className?: string
}

function getInternalPath(href: string) {
  const url = new URL(href, 'https://florial-bg.com')
  url.searchParams.delete('lang')
  return url.pathname + url.search + url.hash
}

function renderInline(block: any, language: string, onNavigateInternalPath?: (path: string) => void) {
  if (!Array.isArray(block?.children)) return null

  return block.children.map((child: any, index: number) => {
    let node: React.ReactNode = typeof child?.text === 'string' ? child.text : ''
    const marks: string[] = Array.isArray(child?.marks) ? child.marks : []

    if (marks.includes('strong')) node = <strong>{node}</strong>
    if (marks.includes('em')) node = <em>{node}</em>
    if (marks.includes('underline')) node = <u>{node}</u>

    const link = (block.markDefs || []).find((definition: any) =>
      definition?._type === 'link' && definition?._key && marks.includes(definition._key)
    )
    const kind = link?.href ? classifyRichTextHref(link.href) : 'unsafe'

    if (link?.href && kind !== 'unsafe') {
      const internal = kind === 'internal'
      const href = internal
        ? localizedHref(getInternalPath(link.href), language)
        : link.href
      const clickHandler = internal && onNavigateInternalPath
        ? (event: React.MouseEvent<HTMLAnchorElement>) => handleInternalLinkClick(
            event,
            () => onNavigateInternalPath(getInternalPath(link.href))
          )
        : undefined

      node = (
        <a
          href={href}
          onClick={clickHandler}
          target={kind === 'external' ? '_blank' : undefined}
          rel={kind === 'external' ? 'noopener noreferrer' : undefined}
          className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          {node}
        </a>
      )
    }

    return <React.Fragment key={child?._key || index}>{node}</React.Fragment>
  })
}

export function RichText({ value, language, onNavigateInternalPath, className = '' }: RichTextProps) {
  if (typeof value === 'string') {
    if (!value.trim()) return null
    return <p className={'whitespace-pre-line ' + className}>{value}</p>
  }

  if (!Array.isArray(value) || value.length === 0) return null

  const elements: React.ReactNode[] = []
  let index = 0

  while (index < value.length) {
    const block: any = value[index]
    if (!block || block._type !== 'block' || !Array.isArray(block.children)) {
      index += 1
      continue
    }

    if (block.listItem === 'bullet' || block.listItem === 'number') {
      const listType = block.listItem
      const listBlocks: any[] = []
      while (
        index < value.length &&
        value[index]?._type === 'block' &&
        value[index]?.listItem === listType &&
        Array.isArray(value[index]?.children)
      ) {
        listBlocks.push(value[index])
        index += 1
      }
      const ListTag = listType === 'number' ? 'ol' : 'ul'
      elements.push(
        <ListTag
          key={block._key || 'list-' + index}
          className={listType === 'number' ? 'list-decimal space-y-1 pl-6' : 'list-disc space-y-1 pl-6'}
        >
          {listBlocks.map((item, itemIndex) => (
            <li key={item._key || itemIndex} className="pl-1">
              {renderInline(item, language, onNavigateInternalPath)}
            </li>
          ))}
        </ListTag>
      )
      continue
    }

    const content = renderInline(block, language, onNavigateInternalPath)
    const key = block._key || index
    if (block.style === 'h2') {
      elements.push(<h2 key={key} className="mt-6 mb-3 text-xl font-bold text-slate-900">{content}</h2>)
    } else if (block.style === 'h3') {
      elements.push(<h3 key={key} className="mt-5 mb-2 text-lg font-semibold text-slate-800">{content}</h3>)
    } else if (block.style === 'blockquote') {
      elements.push(<blockquote key={key} className="border-l-4 border-slate-200 pl-4 italic text-slate-600">{content}</blockquote>)
    } else {
      elements.push(<p key={key} className="leading-relaxed">{content}</p>)
    }
    index += 1
  }

  return <div className={'space-y-3 ' + className}>{elements}</div>
}
