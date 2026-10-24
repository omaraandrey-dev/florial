import React, {useEffect, useState} from 'react'
import {useI18n} from '../lib/i18n'
import {applyPageSeo} from '../lib/seo'
import {localizedHref} from '../lib/navigation'
import {blogSlug, blogTranslation, fetchBlogPosts, formatBlogDate, type BlogPost} from '../lib/blog'

export function BlogPage() {
  const {t, language} = useI18n()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loaded, setLoaded] = useState(false)
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
    <header className="mb-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-widest text-[#71824F]">Florial</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">{t('Блог')}</h1><p className="mt-4 text-base leading-7 text-slate-600">{language === 'ru' ? 'Новости садового центра, наши работы и полезные материалы о растениях и системах полива.' : language === 'en' ? 'Garden centre news, our projects and useful articles about plants and irrigation systems.' : 'Новини от градинския център, реализирани проекти и полезни материали за растенията и системите за напояване.'}</p></header>
    {!loaded ? <p className="py-12 text-slate-500">{language === 'ru' ? 'Загрузка статей…' : language === 'en' ? 'Loading articles…' : 'Статиите се зареждат…'}</p> : posts.length === 0 ? <p className="py-12 text-slate-600">{t('Няма публикувани статии.')}</p> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => { const content = blogTranslation(post, language); return <article key={post._id} className="overflow-hidden rounded-2xl border border-[#E1E6D7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><a href={localizedHref('/blog/' + encodeURIComponent(blogSlug(post)), language)} className="block no-underline">{post.cover?.asset?.url ? <img src={post.cover.asset.url} alt={content.coverAlt} loading="lazy" className="h-56 w-full object-cover"/> : <div className="flex h-56 items-center justify-center bg-[#E9EDDB] text-4xl" aria-hidden="true">🌿</div>}<div className="p-5"><time dateTime={post.publishedAt || undefined} className="text-xs text-slate-500">{formatBlogDate(post.publishedAt, language)}</time><h2 className="mt-2 text-xl font-bold leading-snug text-slate-900">{content.title}</h2>{content.shortDescription ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{content.shortDescription}</p> : null}<span className="mt-4 inline-flex text-sm font-bold text-[#647746]">{t('Прочетете още')} →</span></div></a></article> })}
    </div>}
  </main>
}
