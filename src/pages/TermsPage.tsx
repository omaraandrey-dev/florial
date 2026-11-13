import { useEffect, type ReactNode } from 'react'
import { useI18n } from '../lib/i18n'
import { localizedHref } from '../lib/navigation'
import { applyPageSeo } from '../lib/seo'
import termsMarkdown from '../content/terms-bg.md?raw'

function renderInline(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part
  )
}

function renderDocument(markdown: string) {
  const lines = markdown.split('\n')
  const nodes: ReactNode[] = []
  let listItems: string[] = []
  const flushList = () => {
    if (!listItems.length) return
    nodes.push(<ul key={`list-${nodes.length}`} className="mt-3 list-disc space-y-2 pl-6 text-sm leading-7 text-slate-700 sm:text-base">{listItems.map((item, i) => <li key={i}>{renderInline(item)}</li>)}</ul>)
    listItems = []
  }
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed === '---') { flushList(); return }
    if (trimmed.startsWith('- ')) { listItems.push(trimmed.slice(2)); return }
    flushList()
    if (trimmed.startsWith('# ')) {
      nodes.push(<h1 key={index} className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{renderInline(trimmed.slice(2))}</h1>)
    } else if (trimmed.startsWith('## ')) {
      nodes.push(<h2 key={index} className="border-t border-slate-100 pt-6 mt-8 text-xl font-bold text-slate-900">{renderInline(trimmed.slice(3))}</h2>)
    } else {
      nodes.push(<p key={index} className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{renderInline(trimmed)}</p>)
    }
  })
  flushList()
  return nodes
}

export function TermsPage() {
  const { language } = useI18n()
  const title = language === 'ru' ? 'Общие условия использования и покупки' : language === 'en' ? 'Terms of Use and Purchase' : 'Общи условия за ползване и покупка'
  const back = language === 'ru' ? 'Назад к магазину' : language === 'en' ? 'Back to shop' : 'Обратно към магазина'
  const notice = language === 'ru'
    ? 'Исходный документ представлен на болгарском языке. Перевод будет добавлен после отдельной редакционной проверки.'
    : language === 'en'
      ? 'The source document is in Bulgarian. Translations will be added after a separate editorial review.'
      : 'Проект за юридически преглед · 11.11.2026 г.'

  useEffect(() => {
    applyPageSeo({
      fallbackTitle: language === 'bg' ? 'Общи условия за ползване и покупка | Florial' : language === 'ru' ? 'Общие условия использования и покупки | Florial' : 'Terms of Use and Purchase | Florial',
      fallbackDescription: 'Общи условия за използване на сайта florial-bg.com, поръчки, плащане, доставка, отказ, рекламации и услуги на Florial.',
      language,
      // RU/EN display the Bulgarian source draft with a notice, not translated legal terms.
      noIndex: language !== 'bg',
      alternates: language === 'bg'
        ? { bg: 'https://florial-bg.com/terms', 'x-default': 'https://florial-bg.com/terms' }
        : undefined,
    })
  }, [language])

  return (
    <div className="flex-grow bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a href={localizedHref('/', language)} className="text-xl font-extrabold tracking-wide text-emerald-800 no-underline">FLORIAL</a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/terms" className={language === 'bg' ? 'font-bold text-emerald-800' : 'text-slate-500 hover:text-emerald-800'}>BG</a>
            <a href="/terms?lang=ru" className={language === 'ru' ? 'font-bold text-emerald-800' : 'text-slate-500 hover:text-emerald-800'}>RU</a>
            <a href="/terms?lang=en" className={language === 'en' ? 'font-bold text-emerald-800' : 'text-slate-500 hover:text-emerald-800'}>EN</a>
            <a href={localizedHref('/', language)} className="ml-2 font-semibold text-emerald-800 hover:underline">{back}</a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">FLORIAL · {notice}</p>
          {language !== 'bg' && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">{notice}</p>}
          <div className="mt-5 space-y-3">{renderDocument(termsMarkdown)}</div>
        </article>
      </main>
    </div>
  )
}
