import React, {useEffect, useState} from 'react'
import {useI18n} from '../lib/i18n'
import {applyPageSeo} from '../lib/seo'
import {localizedHref} from '../lib/navigation'
import {getSanityImageProps} from '../lib/sanityImage'
import {blogSlug, blogTranslation, fetchBlogPosts, formatBlogDate, type BlogPostCard} from '../lib/blog'

const blogTagLabels: Record<string, {bg: string; ru: string; en: string}> = {
  'Растения': {bg: 'Растения', ru: 'Растения', en: 'Plants'},
  'Автоматично напояване': {bg: 'Автоматично напояване', ru: 'Автоматический полив', en: 'Automatic irrigation'},
  'Озеленяване': {bg: 'Озеленяване', ru: 'Озеленение', en: 'Landscaping'},
  'Тревни площи': {bg: 'Тревни площи', ru: 'Газоны', en: 'Lawns'},
}

function localizedTag(tag: string, language: 'bg' | 'ru' | 'en') {
  return blogTagLabels[tag]?.[language] || tag
}

export function BlogPage() {
  const {t, language} = useI18n()
  const [posts, setPosts] = useState<BlogPostCard[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  useEffect(() => {
    applyPageSeo({
      fallbackTitle: language === 'ru' ? 'Блог Florial — сад, растения и автоматический полив' : language === 'en' ? 'Florial Blog — Gardens, Plants & Irrigation' : 'Блог Florial — градини, растения и автоматично напояване',
      fallbackDescription: language === 'ru' ? 'Новости садового центра Florial, выполненные работы, растения и решения для автоматического полива в Болгарии.' : language === 'en' ? 'Florial Garden Centre news, recent projects, plants and automatic irrigation solutions in Bulgaria.' : 'Новини от градински център Florial, текущи проекти, растения и решения за автоматично напояване в България.',
      language,
      alternates: {bg:'https://florial-bg.com/blog',ru:'https://florial-bg.com/blog?lang=ru',en:'https://florial-bg.com/blog?lang=en','x-default':'https://florial-bg.com/blog'},
    })
  }, [language])
  useEffect(() => {
    let active = true
    fetchBlogPosts().then((result) => { if (active) setPosts(result) }).catch((error) => console.error('Florial blog could not load:', error)).finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])
  return <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 md:py-14">
    <nav className="mb-5 text-sm text-slate-500"><a href={localizedHref('/', language)} className="text-[#647746] no-underline">{t('Начало')}</a><span className="mx-2">/</span><span>{t('Блог')}</span></nav>
    <header className="mb-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-widest text-[#71824F]">Florial</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">{t('Блог')}</h1><p className="mt-4 text-base leading-7 text-slate-600">{t('Полезни статии за градината и поливането')}</p></header>
    {loaded && posts.length > 0 ? <nav className="mb-8 flex flex-wrap gap-2" aria-label={language === 'ru' ? 'Темы статей' : language === 'en' ? 'Article topics' : 'Теми на статиите'}>
      <button type="button" aria-pressed={selectedTag === null} onClick={() => setSelectedTag(null)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedTag === null ? 'border-[#647746] bg-[#647746] text-white' : 'border-[#D8DFCA] bg-white text-slate-700 hover:bg-[#F0F3E8]'}`}>{language === 'ru' ? 'Все статьи' : language === 'en' ? 'All articles' : 'Всички статии'}</button>
      {Array.from(new Set(posts.flatMap((post) => post.tags || []))).sort().map((tag) => <button key={tag} type="button" aria-pressed={selectedTag === tag} onClick={() => setSelectedTag(tag)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedTag === tag ? 'border-[#647746] bg-[#647746] text-white' : 'border-[#D8DFCA] bg-white text-slate-700 hover:bg-[#F0F3E8]'}`}>{localizedTag(tag, language)} <span className="ml-1 opacity-75">{posts.filter((post) => post.tags?.includes(tag)).length}</span></button>)}
    </nav> : null}
    {!loaded ? <p className="py-12 text-slate-500">{t('Зареждане на статии…')}</p> : posts.length === 0 ? <p className="py-12 text-slate-600">{t('Няма публикувани статии.')}</p> : posts.filter((post) => selectedTag === null || post.tags?.includes(selectedTag)).length === 0 ? <p className="py-12 text-slate-600">{language === 'ru' ? 'В этой теме пока нет статей.' : language === 'en' ? 'There are no articles in this topic yet.' : 'Все още няма статии по тази тема.'}</p> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.filter((post) => selectedTag === null || post.tags?.includes(selectedTag)).map((post, index) => { const content = blogTranslation(post, language); const featured = index === 0; return <article key={post._id} className={`overflow-hidden rounded-2xl border border-[#E1E6D7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${featured ? 'sm:col-span-2 lg:col-span-3' : ''}`}><a href={localizedHref('/blog/' + encodeURIComponent(blogSlug(post)), language)} className={`block no-underline ${featured ? 'md:grid md:grid-cols-2 md:min-h-[20rem]' : ''}`}>{post.cover?.asset?.url ? <img {...getSanityImageProps(post.cover.asset.url, featured ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', featured ? 1100 : undefined)} alt={content.coverAlt} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" fetchPriority={index === 0 ? 'high' : undefined} className={`h-56 w-full object-cover ${featured ? 'md:h-full md:min-h-[20rem]' : ''}`}/>: <div className={`flex h-56 items-center justify-center bg-[#E9EDDB] text-4xl ${featured ? 'md:min-h-[20rem]' : ''}`} aria-hidden="true">🌿</div>}<div className={`p-5 ${featured ? 'md:flex md:flex-col md:justify-center md:p-8 lg:p-10' : ''}`}>{featured ? <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#71824F]">{language === 'ru' ? 'Последняя публикация' : language === 'en' ? 'Latest article' : 'Последна публикация'}</p> : null}<time dateTime={post.publishedAt || undefined} className="text-xs text-slate-500">{formatBlogDate(post.publishedAt, language)}</time>{post.tags?.length ? <div className="mt-2 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-[#F0F3E8] px-2.5 py-1 text-xs font-medium text-[#53643A]">{localizedTag(tag, language)}</span>)}</div> : null}<h2 className={`mt-2 font-bold leading-snug text-slate-900 ${featured ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl'}`}>{content.title}</h2>{content.shortDescription ? <p className={`mt-3 text-sm leading-6 text-slate-600 ${featured ? 'md:text-base md:leading-7' : 'line-clamp-3'}`}>{content.shortDescription}</p> : null}<span className="mt-4 inline-flex text-sm font-bold text-[#647746]">{t('Прочетете още')} →</span></div></a></article> })}
    </div>}
  </main>
}
