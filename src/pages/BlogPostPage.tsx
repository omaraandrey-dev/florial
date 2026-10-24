import React, {useEffect, useState} from 'react'
import {useI18n} from '../lib/i18n'
import {applyPageSeo} from '../lib/seo'
import {localizedHref} from '../lib/navigation'
import {BlogContent} from '../components/BlogContent'
import {blogTranslation, fetchBlogPost, formatBlogDate, type BlogPost} from '../lib/blog'

export function BlogPostPage({slug}: {slug: string}) {
  const {t, language} = useI18n()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let active = true
    setPost(null); setLoaded(false)
    fetchBlogPost(slug).then((result) => { if (active) setPost(result) }).catch((error) => console.error('Florial blog post could not load:', error)).finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [slug])
  const content = post ? blogTranslation(post, language) : null
  useEffect(() => {
    if (!post || !content) return
    const base = 'https://florial-bg.com/blog/' + encodeURIComponent(typeof post.slug === 'string' ? post.slug : post.slug?.current || post._id)
    const selectedTranslation = post.translations?.[language]
    const hasCompleteTranslation = language === 'bg' || Boolean(
      selectedTranslation?.title &&
      selectedTranslation?.shortDescription &&
      selectedTranslation?.seoTitle &&
      selectedTranslation?.seoDescription &&
      selectedTranslation?.body?.length
    )
    applyPageSeo({
      fallbackTitle: content.seoTitle || (content.title + ' | Florial'),
      fallbackDescription: content.seoDescription || content.shortDescription || content.title,
      pageType: 'article',
      imageUrl: post.cover?.asset?.url,
      noIndex: language !== 'bg' && !hasCompleteTranslation,
      language,
      alternates: {bg:base,ru:base+'?lang=ru',en:base+'?lang=en','x-default':base},
    })
  }, [post, language, content?.seoTitle, content?.seoDescription, content?.title, content?.shortDescription])
  if (!loaded) return <main className="mx-auto w-full max-w-4xl flex-grow px-4 py-16 text-slate-500">{language === 'ru' ? 'Загрузка статьи…' : language === 'en' ? 'Loading article…' : 'Статията се зарежда…'}</main>
  if (!post || !content) return <main className="mx-auto w-full max-w-4xl flex-grow px-4 py-16"><h1 className="text-2xl font-bold text-slate-900">{t('Статията не е намерена.')}</h1><a href={localizedHref('/blog', language)} className="mt-5 inline-flex font-semibold text-emerald-800">{t('Обратно към блога')} →</a></main>
  return <main className="mx-auto w-full max-w-4xl flex-grow px-4 py-8 md:py-12">
    <nav className="mb-6 text-sm text-slate-500"><a href={localizedHref('/', language)} className="text-[#647746] no-underline">{t('Начало')}</a><span className="mx-2">/</span><a href={localizedHref('/blog', language)} className="text-[#647746] no-underline">{t('Блог')}</a><span className="mx-2">/</span><span className="line-clamp-1">{content.title}</span></nav>
    <article>
      <header className="mb-8"><time dateTime={post.publishedAt || undefined} className="text-sm text-slate-500">{formatBlogDate(post.publishedAt, language)}</time><h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">{content.title}</h1>{content.shortDescription ? <p className="mt-5 text-lg leading-8 text-slate-600">{content.shortDescription}</p> : null}</header>
      {post.cover?.asset?.url ? <figure className="mb-9"><img src={post.cover.asset.url} alt={content.coverAlt} className="max-h-[620px] w-full rounded-2xl object-cover"/>{post.cover.caption ? <figcaption className="mt-2 text-center text-sm text-slate-500">{post.cover.caption}</figcaption> : null}</figure> : null}
      <BlogContent blocks={content.body || []}/>
      {post.gallery?.length ? <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">{post.gallery.map((image,index) => image.asset?.url ? <figure key={index}><img src={image.asset.url} alt={image.alt || content.coverAlt} loading="lazy" className="w-full rounded-xl object-cover"/>{image.caption ? <figcaption className="mt-2 text-sm text-slate-500">{image.caption}</figcaption> : null}</figure> : null)}</div> : null}
    </article>
    <a href={localizedHref('/blog', language)} className="mt-10 inline-flex rounded-lg border border-[#B9C79C] bg-white px-4 py-3 text-sm font-semibold text-[#53643A] no-underline hover:bg-[#F0F3E8]">← {t('Обратно към блога')}</a>
  </main>
}
