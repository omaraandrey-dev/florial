import React, {useEffect, useState} from 'react'
import {useI18n} from '../lib/i18n'
import {applyPageSeo} from '../lib/seo'
import {localizedHref} from '../lib/navigation'
import {BlogContent} from '../components/BlogContent'
import {blogSlug, blogTranslation, fetchBlogPost, fetchBlogPosts, formatBlogDate, type BlogPost} from '../lib/blog'

export function BlogPostPage({slug}: {slug: string}) {
  const {t, language} = useI18n()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let active = true
    setPost(null); setRelatedPosts([]); setLoaded(false)
    Promise.all([fetchBlogPost(slug), fetchBlogPosts()])
      .then(([result, allPosts]) => {
        if (!active) return
        setPost(result)
        if (result) {
          const currentSlug = blogSlug(result)
          const currentIndex = allPosts.findIndex((item) => blogSlug(item) === currentSlug)
          // Show up to three real, published articles adjacent to the current article in publication order.
          const nearby = currentIndex >= 0
            ? [...allPosts.slice(Math.max(0, currentIndex - 1), currentIndex), ...allPosts.slice(currentIndex + 1, currentIndex + 4)]
            : allPosts.filter((item) => blogSlug(item) !== currentSlug).slice(0, 3)
          const unique = new Map(nearby.filter((item) => blogSlug(item) !== currentSlug).map((item) => [blogSlug(item), item]))
          setRelatedPosts([...unique.values()].slice(0, 3))
        }
      })
      .catch((error) => console.error('Florial blog post could not load:', error))
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [slug])
  const content = post ? blogTranslation(post, language) : null
  useEffect(() => {
    if (!post || !content) return
    const base = 'https://florial-bg.com/blog/' + encodeURIComponent(typeof post.slug === 'string' ? post.slug : post.slug?.current || post._id)
    applyPageSeo({
      fallbackTitle: content.seoTitle || (content.title + ' | Florial'),
      fallbackDescription: content.seoDescription || content.shortDescription || content.title,
      pageType: 'article',
      imageUrl: post.cover?.asset?.url,
      noIndex: false,
      language,
      alternates: {bg:base,ru:base+'?lang=ru',en:base+'?lang=en','x-default':base},
    })
  }, [post, language, content?.seoTitle, content?.seoDescription, content?.title, content?.shortDescription])
  if (!loaded) return <main className="mx-auto w-full max-w-4xl flex-grow px-4 py-16 text-slate-500">{t('Зареждане на статия…')}</main>
  if (!post || !content) return <main className="mx-auto w-full max-w-4xl flex-grow px-4 py-16"><h1 className="text-2xl font-bold text-slate-900">{t('Статията не е намерена.')}</h1><a href={localizedHref('/blog', language)} className="mt-5 inline-flex font-semibold text-emerald-800">{t('Обратно към блога')} →</a></main>
  return <main className="mx-auto w-full max-w-4xl flex-grow px-4 py-8 md:py-12">
    <nav className="mb-6 text-sm text-slate-500"><a href={localizedHref('/', language)} className="text-[#647746] no-underline">{t('Начало')}</a><span className="mx-2">/</span><a href={localizedHref('/blog', language)} className="text-[#647746] no-underline">{t('Блог')}</a><span className="mx-2">/</span><span className="line-clamp-1">{content.title}</span></nav>
    <article>
      <header className="mb-8"><time dateTime={post.publishedAt || undefined} className="text-sm text-slate-500">{formatBlogDate(post.publishedAt, language)}</time><h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">{content.title}</h1>{content.shortDescription ? <p className="mt-5 text-lg leading-8 text-slate-600">{content.shortDescription}</p> : null}</header>
      {post.cover?.asset?.url ? <figure className="mb-9"><img src={post.cover.asset.url} alt={content.coverAlt} className="max-h-[620px] w-full rounded-2xl object-cover"/>{post.cover.caption ? <figcaption className="mt-2 text-center text-sm text-slate-500">{post.cover.caption}</figcaption> : null}</figure> : null}
      <BlogContent blocks={content.body || []}/>
      {post.gallery?.length ? <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">{post.gallery.map((image,index) => image.asset?.url ? <figure key={index}><img src={image.asset.url} alt={image.alt || content.coverAlt} loading="lazy" className="w-full rounded-xl object-cover"/>{image.caption ? <figcaption className="mt-2 text-sm text-slate-500">{image.caption}</figcaption> : null}</figure> : null)}</div> : null}
    </article>
    {relatedPosts.length ? <section className="mt-14 border-t border-[#E1E6D7] pt-8" aria-labelledby="related-blog-title">
      <h2 id="related-blog-title" className="mb-5 text-2xl font-bold tracking-tight text-slate-900">{language === 'ru' ? 'Читайте также' : language === 'en' ? 'Related articles' : 'Още полезни статии'}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {relatedPosts.map((item) => {
          const related = blogTranslation(item, language)
          return <article key={item._id} className="overflow-hidden rounded-xl border border-[#E1E6D7] bg-white transition hover:shadow-sm">
            <a href={localizedHref('/blog/' + encodeURIComponent(blogSlug(item)), language)} className="block h-full no-underline">
              {item.cover?.asset?.url ? <img src={item.cover.asset.url} alt={related.coverAlt} loading="lazy" className="h-36 w-full object-cover"/> : <div className="flex h-36 items-center justify-center bg-[#E9EDDB] text-3xl" aria-hidden="true">🌿</div>}
              <div className="p-4"><h3 className="text-base font-bold leading-snug text-slate-900">{related.title}</h3><span className="mt-3 inline-flex text-sm font-semibold text-[#647746]">{language === 'ru' ? 'Читать статью' : language === 'en' ? 'Read article' : 'Прочетете статията'} →</span></div>
            </a>
          </article>
        })}
      </div>
    </section> : null}
    <a href={localizedHref('/blog', language)} className="mt-8 inline-flex rounded-lg border border-[#B9C79C] bg-white px-4 py-3 text-sm font-semibold text-[#53643A] no-underline hover:bg-[#F0F3E8]">← {t('Обратно към блога')}</a>
  </main>
}
