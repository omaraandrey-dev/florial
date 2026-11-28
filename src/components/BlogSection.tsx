import {useEffect, useState} from 'react'
import {useI18n} from '../lib/i18n'
import {blogSlug, blogTranslation, fetchBlogPosts, fetchBlogPostsBySlugs, formatBlogDate, type BlogPostCard} from '../lib/blog'
import {localizedHref} from '../lib/navigation'
import {getSanityImageProps} from '../lib/sanityImage'

export function BlogSection({ initialPosts, onReadinessChange }: { initialPosts?: BlogPostCard[]; onReadinessChange?: (ready: boolean) => void } = {}) {
  const {t, language} = useI18n()
  const [posts, setPosts] = useState<BlogPostCard[]>(() => initialPosts || [])
  const [status, setStatus] = useState<'loading' | 'error' | 'empty' | 'ready'>(() => initialPosts ? (initialPosts.length ? 'ready' : 'empty') : 'loading')
  useEffect(() => {
    let active = true
    if (initialPosts) {
      setPosts(initialPosts)
      setStatus(initialPosts.length ? 'ready' : 'empty')
      onReadinessChange?.(true)
      return () => { active = false }
    }
    onReadinessChange?.(false)
    let succeeded = false
    setPosts([])
    setStatus('loading')
    const pinnedSlugs = ['podroben-landshaften-proekt-gradina', 'cena-sistema-avtomatichno-napoyavane-burgas']
    Promise.all([fetchBlogPostsBySlugs(pinnedSlugs, language), fetchBlogPosts(10, language)])
      .then(([pinned, latest]) => {
        if (!active) return
        const pinnedSlugsSet = new Set(pinned.map((post) => blogSlug(post)))
        const nextLatest = latest.filter((post) => !pinnedSlugsSet.has(blogSlug(post))).slice(0, 1)
        const nextPosts = [...pinned, ...nextLatest]
        setPosts(nextPosts)
        setStatus(nextPosts.length ? 'ready' : 'empty')
        succeeded = true
      })
      .catch((error) => {
        if (!active) return
        console.error('Florial blog could not load:', error)
        setStatus('error')
      })
      .finally(() => {
        if (active && succeeded) onReadinessChange?.(true)
      })
    return () => { active = false }
  }, [language, onReadinessChange, initialPosts])
  return <section className="border-t border-[#E4E8DA] bg-[#F7F8F1] px-4 py-10 md:py-14">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h3 className="mt-1 text-2xl font-extrabold text-slate-900 md:text-3xl">{language === 'ru' ? 'Блог и портфолио' : language === 'en' ? 'Blog & Portfolio' : 'Блог и портфолио'}</h3></div>
        <a href={localizedHref('/blog', language)} className="inline-flex w-fit items-center rounded-lg border border-[#B9C79C] bg-white px-4 py-2.5 text-sm font-semibold text-[#53643A] no-underline transition hover:bg-[#F0F3E8]">{t('Всички статии')} →</a>
      </div>
      {status === 'loading' ? <p className="text-sm text-slate-500" role="status">{t('Зареждане на статии…')}</p> : status === 'error' ? <p className="text-sm text-slate-500" role="status">{t('Неуспешно зареждане на статиите.')}</p> : status === 'empty' ? <p className="text-sm text-slate-500">{t('Няма публикувани статии.')}</p> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const content = blogTranslation(post, language)
          const image = post.cover?.asset?.url
          return <article key={post._id} className="overflow-hidden rounded-2xl border border-[#E1E6D7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <a href={localizedHref('/blog/' + encodeURIComponent(blogSlug(post)), language)} className="block no-underline">
              {image ? <img {...getSanityImageProps(image, '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw')} alt={content.coverAlt} loading="lazy" decoding="async" className="h-52 w-full object-cover" /> : <div className="flex h-52 items-center justify-center bg-[#E9EDDB] text-4xl" aria-hidden="true">🌿</div>}
              <div className="p-5">
                <time dateTime={post.publishedAt || undefined} className="text-xs font-medium text-slate-500">{formatBlogDate(post.publishedAt, language)}</time>
                <h4 className="mt-2 text-lg font-bold leading-snug text-slate-900">{content.title}</h4>
                {content.shortDescription ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{content.shortDescription}</p> : null}
                <span className="mt-4 inline-flex text-sm font-bold text-[#647746]">{t('Прочетете още')} →</span>
              </div>
            </a>
          </article>
        })}
      </div>}
    </div>
  </section>
}
