import type { MouseEvent } from 'react'

/**
 * Keep normal internal navigation inside the React app, while allowing the
 * browser to handle modified clicks, context-menu actions, and new tabs.
 */
export function handleInternalLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  navigate: () => void,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.currentTarget.target && event.currentTarget.target !== '_self')
  ) {
    return
  }

  event.preventDefault()
  navigate()
}

export function localizedHref(path: string, language: string) {
  return language === 'bg'
    ? path
    : `${path}${path.includes('?') ? '&' : '?'}lang=${encodeURIComponent(language)}`
}
