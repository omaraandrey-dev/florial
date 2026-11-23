import {useEffect, useState} from 'react'
import {useI18n} from '../lib/i18n'
import {applyPageSeo, setStructuredData} from '../lib/seo'
import {localizedHref} from '../lib/navigation'
import {getSanityImageProps} from '../lib/sanityImage'
import {blogSlug, blogTranslation, fetchBlogPosts, formatBlogDate, type BlogPostCard} from '../lib/blog'

type BlogCategory = {
  id: string
  tags: string[]
  label: {bg: string; ru: string; en: string}
  description: {bg: string; ru: string; en: string}
}

const blogCategories: BlogCategory[] = [
  {
    id: 'landscape',
    tags: ['ландшафтно проектиране', 'озеленяване'],
    label: {bg: 'Ландшафтен дизайн', ru: 'Ландшафтный дизайн', en: 'Landscape design'},
    description: {bg: 'Идеи, проекти и решения за градината', ru: 'Идеи, проекты и решения для сада', en: 'Garden ideas, projects and solutions'},
  },
  {
    id: 'irrigation',
    tags: ['автоматично напояване', 'автоматично поливане', 'поливни системи'],
    label: {bg: 'Автоматично напояване', ru: 'Автоматический полив', en: 'Automatic irrigation'},
    description: {bg: 'Проектиране, монтаж и оборудване', ru: 'Проектирование, монтаж и оборудование', en: 'Design, installation and equipment'},
  },
  {
    id: 'lawn',
    tags: ['тревни площи'],
    label: {bg: 'Рулонен тревен чим', ru: 'Рулонный газон', en: 'Rolled turf'},
    description: {bg: 'Подготовка, избор и полагане на тревен чим', ru: 'Подготовка участка, выбор и укладка газона', en: 'Lawn preparation, selection and installation'},
  },
  {
    id: 'planting',
    tags: ['растения'],
    label: {bg: 'Озеленяване и засаждане', ru: 'Озеленение и посадка', en: 'Planting and greenery'},
    description: {bg: 'Растения, дървета и професионално засаждане', ru: 'Растения, деревья и профессиональная посадка', en: 'Plants, trees and professional planting'},
  },
]

const extraTags = ['Разпръсквачи', 'Капково напояване', 'Контролери']
const tagTranslations: Record<string, {bg: string; ru: string; en: string}> = {
  'Разпръсквачи': {bg: 'Разпръсквачи', ru: 'Дождеватели', en: 'Sprinklers'},
  'Капково напояване': {bg: 'Капково напояване', ru: 'Капельный полив', en: 'Drip irrigation'},
  'Контролери': {bg: 'Контролери', ru: 'Контроллеры', en: 'Controllers'},
  'Растения': {bg: 'Растения', ru: 'Растения', en: 'Plants'},
  'Автоматично напояване': {bg: 'Автоматично напояване', ru: 'Автоматический полив', en: 'Automatic irrigation'},
  'Поливни системи': {bg: 'Поливни системи', ru: 'Системы полива', en: 'Irrigation systems'},
  'Тревни площи': {bg: 'Тревни площи', ru: 'Газоны', en: 'Lawns'},
  'Озеленяване': {bg: 'Озеленяване', ru: 'Озеленение', en: 'Landscaping'},
  'Ландшафтно проектиране': {bg: 'Ландшафтно проектиране', ru: 'Ландшафтное проектирование', en: 'Landscape planning'},
  'Проект': {bg: 'Проект', ru: 'Проект', en: 'Project'},
  'автоматично поливане': {bg: 'Автоматично напояване', ru: 'Автоматический полив', en: 'Automatic irrigation'},
  'ротаторни дюзи': {bg: 'Ротаторни дюзи', ru: 'Роторные форсунки', en: 'Rotary nozzles'},
  'Rain Bird R-VAN': {bg: 'Rain Bird R-VAN', ru: 'Rain Bird R-VAN', en: 'Rain Bird R-VAN'},
  'Hunter MP Rotator': {bg: 'Hunter MP Rotator', ru: 'Hunter MP Rotator', en: 'Hunter MP Rotator'},
  'дюзи за тревни площи': {bg: 'Дюзи за тревни площи', ru: 'Форсунки для газона', en: 'Lawn nozzles'},
}

function localizedTag(tag: string, language: 'bg' | 'ru' | 'en') {
  return tagTranslations[tag]?.[language] || tag
}

function normalizedTag(tag: string) {
  return tag.trim().toLocaleLowerCase()
}

function hasAnyTag(post: BlogPostCard, tags: string[]) {
  const postTags = (post.tags || []).map(normalizedTag)
  return tags.some((tag) => postTags.includes(normalizedTag(tag)))
}

function isProject(post: BlogPostCard) {
  return hasAnyTag(post, ['Проект'])
}

export function BlogPage() {
  const {t, language} = useI18n()
  const [posts, setPosts] = useState<BlogPostCard[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'all' | 'project' | 'article'>('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [searchQuery, setSearchQuery] = useState('')

  const copy = {
    title: language === 'ru' ? 'Блог и портфолио' : language === 'en' ? 'Blog and portfolio' : 'Блог и портфолио',
    intro: language === 'ru'
      ? 'Здесь мы показываем реализованные проекты, делимся идеями для сада и публикуем практические материалы о растениях, озеленении и системах автоматического полива. Посмотрите наши работы и найдите решения для своего участка.'
      : language === 'en'
        ? 'Explore our completed projects, garden ideas and practical articles about plants, landscaping and automatic irrigation. See how we work and find ideas and solutions for your own outdoor space.'
        : 'В блога на Florial споделяме реализирани проекти, идеи и практически решения за създаване и поддържане на красиви градини. Ще откриете примери от нашата работа по ландшафтно проектиране, изграждане на автоматизирани поливни системи, озеленяване и полагане на рулонен тревен чим, както и полезни статии за растенията и грижата за зелените площи. Разгледайте проектите ни и почерпете идеи за своята градина.',
    directions: language === 'ru' ? 'Выберите направление' : language === 'en' ? 'Explore by topic' : 'Разгледайте по направления',
    all: language === 'ru' ? 'Все публикации' : language === 'en' ? 'All publications' : 'Всички публикации',
    search: language === 'ru' ? 'Поиск по названию, описанию или теме' : language === 'en' ? 'Search titles, descriptions or topics' : 'Търсене по заглавие, описание или тема',
    type: language === 'ru' ? 'Тип публикации' : language === 'en' ? 'Publication type' : 'Тип публикация',
    allTypes: language === 'ru' ? 'Все типы' : language === 'en' ? 'All types' : 'Всички типове',
    projects: language === 'ru' ? 'Проекты' : language === 'en' ? 'Projects' : 'Проекти',
    articles: language === 'ru' ? 'Статьи' : language === 'en' ? 'Articles' : 'Статии',
    year: language === 'ru' ? 'Год' : language === 'en' ? 'Year' : 'Година',
    allYears: language === 'ru' ? 'Все годы' : language === 'en' ? 'All years' : 'Всички години',
    sort: language === 'ru' ? 'Сортировка' : language === 'en' ? 'Sort by' : 'Подреждане',
    newest: language === 'ru' ? 'Сначала новые' : language === 'en' ? 'Newest first' : 'Най-нови първо',
    oldest: language === 'ru' ? 'Сначала старые' : language === 'en' ? 'Oldest first' : 'Най-стари първо',
    results: language === 'ru' ? 'Публикации' : language === 'en' ? 'Publications' : 'Публикации',
    clear: language === 'ru' ? 'Сбросить фильтры' : language === 'en' ? 'Clear filters' : 'Изчисти филтрите',
    noResults: language === 'ru' ? 'По вашему запросу ничего не найдено. Измените запрос или сбросьте фильтры.' : language === 'en' ? 'No publications match your search. Try another phrase or clear the filters.' : 'Няма публикации, които отговарят на търсенето. Опитайте друга дума или изчистете филтрите.',
    empty: language === 'ru' ? 'Пока нет опубликованных материалов.' : language === 'en' ? 'There are no published posts yet.' : 'Все още няма публикувани материали.',
    readMore: language === 'ru' ? 'Подробнее' : language === 'en' ? 'Read more' : 'Прочетете още',
    latest: language === 'ru' ? 'Новая публикация' : language === 'en' ? 'Latest publication' : 'Последна публикация',
    loading: language === 'ru' ? 'Загрузка публикаций…' : language === 'en' ? 'Loading publications…' : 'Зареждане на публикации…',
  }

  useEffect(() => {
    applyPageSeo({
      fallbackTitle: language === 'ru' ? 'Блог и портфолио Florial — сад и проекты' : language === 'en' ? 'Florial Blog & Portfolio — Gardens and Projects' : 'Блог и портфолио Florial — градини и проекти',
      fallbackDescription: language === 'ru' ? 'Реализованные проекты Florial, идеи для сада, растения, озеленение и решения для автоматического полива в Болгарии.' : language === 'en' ? 'Florial garden projects, ideas, plants, landscaping and automatic irrigation solutions in Bulgaria.' : 'Реализирани проекти на Florial, идеи за градината, растения, озеленяване и решения за автоматично напояване в България.',
      language,
      alternates: {bg:'https://florial-bg.com/blog',ru:'https://florial-bg.com/blog?lang=ru',en:'https://florial-bg.com/blog?lang=en','x-default':'https://florial-bg.com/blog'},
    })
  }, [language])

  useEffect(() => {
    let active = true
    setLoaded(false)
    fetchBlogPosts(undefined, language).then((result) => { if (active) setPosts(result) }).catch((error) => console.error('Florial blog could not load:', error)).finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [language])

  useEffect(() => {
    if (!loaded) return
    const items = posts.slice(0, 50).map((post, index) => {
      const content = blogTranslation(post, language)
      const url = new URL(localizedHref('/blog/' + encodeURIComponent(blogSlug(post)), language), window.location.origin).toString()
      return { '@type': 'ListItem', position: index + 1, name: content.title, url }
    })
    setStructuredData('collection-page', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: copy.title,
      url: new URL(localizedHref('/blog', language), window.location.origin).toString(),
      ...(items.length ? { mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items } } : {}),
    })
  }, [posts, loaded, language, copy.title])

  const years = Array.from(new Set(posts.map((post) => post.publishedAt ? new Date(post.publishedAt).getFullYear().toString() : '').filter(Boolean))).sort((a, b) => Number(b) - Number(a))
  const availableExtraTags = extraTags.filter((tag) => posts.some((post) => hasAnyTag(post, [tag])))
  const filteredPosts = posts.filter((post) => {
    const content = blogTranslation(post, language)
    const matchesCategory = !selectedCategory || hasAnyTag(post, blogCategories.find((category) => category.id === selectedCategory)?.tags || [])
    const matchesTag = !selectedTag || hasAnyTag(post, [selectedTag])
    const matchesType = selectedType === 'all' || (selectedType === 'project' ? isProject(post) : !isProject(post))
    const matchesYear = selectedYear === 'all' || (post.publishedAt && new Date(post.publishedAt).getFullYear().toString() === selectedYear)
    const search = searchQuery.trim().toLocaleLowerCase()
    const matchesSearch = !search || [content.title, content.shortDescription, ...(post.tags || []).map((tag) => localizedTag(tag, language))].some((value) => value?.toLocaleLowerCase().includes(search))
    return matchesCategory && matchesTag && matchesType && matchesYear && matchesSearch
  }).sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  const hasActiveFilters = Boolean(selectedCategory || selectedTag || selectedType !== 'all' || selectedYear !== 'all' || sortOrder !== 'newest' || searchQuery.trim())

  function clearFilters() {
    setSelectedCategory(null)
    setSelectedTag(null)
    setSelectedType('all')
    setSelectedYear('all')
    setSortOrder('newest')
    setSearchQuery('')
  }

  return <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 md:px-6 md:py-12">
    <nav className="mb-6 text-sm text-slate-500" aria-label={language === 'ru' ? 'Навигационная цепочка' : language === 'en' ? 'Breadcrumb' : 'Навигационна пътека'}>
      <a href={localizedHref('/', language)} className="text-[#647746] no-underline hover:underline">{t('Начало')}</a>
      <span className="mx-2" aria-hidden="true">/</span>
      <span aria-current="page" className="text-slate-700">{copy.title}</span>
    </nav>

    <header className="mb-10 max-w-4xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">{copy.title}</h1>
      <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg md:leading-8">{copy.intro}</p>
    </header>

    {loaded && posts.length > 0 ? <>
      <section aria-labelledby="blog-directions-heading" className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="blog-directions-heading" className="text-xl font-bold text-slate-900 md:text-2xl">{copy.directions}</h2>
          <button type="button" onClick={clearFilters} className="text-sm font-semibold text-[#647746] underline-offset-4 hover:underline">{copy.all}</button>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {blogCategories.map((category, categoryIndex) => {
            const matchingPosts = posts.filter((post) => hasAnyTag(post, category.tags))
            const imagePost = matchingPosts.find((post) => post.cover?.asset?.url)
            const active = selectedCategory === category.id
            return <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => { setSelectedCategory(active ? null : category.id); setSelectedTag(null) }}
              className={`group relative isolate min-h-40 overflow-hidden rounded-2xl border bg-slate-900 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#647746] md:min-h-52 ${active ? 'border-[#647746] ring-2 ring-[#647746] ring-offset-2' : 'border-transparent'}`}
            >
              {imagePost?.cover?.asset?.url ? <img
                {...getSanityImageProps(imagePost.cover.asset.url, '(min-width: 1024px) 25vw, 50vw', 640)}
                alt=""
                aria-hidden="true"
                loading={categoryIndex === 0 ? "eager" : "lazy"}
                fetchPriority={categoryIndex === 0 ? "high" : undefined}
                decoding="async"
                className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              /> : <div className="absolute inset-0 -z-20 bg-[#647746]" aria-hidden="true"/>}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/25 to-black/5" aria-hidden="true"/>
              <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800">{matchingPosts.length}</span>
              <span className="flex min-h-40 flex-col justify-end p-3 text-white md:min-h-52 md:p-5">
                <span className="text-sm font-bold leading-snug md:text-lg">{category.label[language]}</span>
                <span className="mt-1 hidden text-xs leading-5 text-white/85 md:block">{category.description[language]}</span>
              </span>
            </button>
          })}
        </div>
      </section>

      <section aria-label={language === 'ru' ? 'Поиск и фильтры публикаций' : language === 'en' ? 'Publication search and filters' : 'Търсене и филтри на публикациите'} className="mb-7 rounded-2xl border border-[#E1E6D7] bg-[#F8F9F5] p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">{language === 'ru' ? 'Поиск' : language === 'en' ? 'Search' : 'Търсене'}</span>
            <span className="flex h-11 items-center gap-2 rounded-xl border border-[#D8DFCA] bg-white px-3 focus-within:border-[#647746] focus-within:ring-2 focus-within:ring-[#647746]/20">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} type="search" placeholder={copy.search} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"/>
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">{copy.type}</span>
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value as 'all' | 'project' | 'article')} className="h-11 w-full rounded-xl border border-[#D8DFCA] bg-white px-3 text-sm text-slate-800 focus:border-[#647746] focus:outline-none focus:ring-2 focus:ring-[#647746]/20">
              <option value="all">{copy.allTypes}</option>
              <option value="project">{copy.projects}</option>
              <option value="article">{copy.articles}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">{copy.year}</span>
            <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="h-11 w-full rounded-xl border border-[#D8DFCA] bg-white px-3 text-sm text-slate-800 focus:border-[#647746] focus:outline-none focus:ring-2 focus:ring-[#647746]/20">
              <option value="all">{copy.allYears}</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">{copy.sort}</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')} className="h-11 w-full rounded-xl border border-[#D8DFCA] bg-white px-3 text-sm text-slate-800 focus:border-[#647746] focus:outline-none focus:ring-2 focus:ring-[#647746]/20">
              <option value="newest">{copy.newest}</option>
              <option value="oldest">{copy.oldest}</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-slate-600">{language === 'ru' ? 'Популярные темы:' : language === 'en' ? 'Popular topics:' : 'Популярни теми:'}</span>
          {availableExtraTags.map((tag) => <button key={tag} type="button" aria-pressed={selectedTag === tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#647746] ${selectedTag === tag ? 'border-[#647746] bg-[#647746] text-white' : 'border-[#D8DFCA] bg-white text-slate-700 hover:bg-[#EEF2E7]'}`}>{localizedTag(tag, language)} <span className="ml-1 opacity-75">{posts.filter((post) => hasAnyTag(post, [tag])).length}</span></button>)}
          {hasActiveFilters ? <button type="button" onClick={clearFilters} className="ml-auto text-xs font-semibold text-[#647746] underline underline-offset-4">{copy.clear}</button> : null}
        </div>
      </section>
    </> : null}

    {!loaded ? <p className="py-12 text-slate-500" role="status">{copy.loading}</p> : posts.length === 0 ? <p className="py-12 text-slate-600">{copy.empty}</p> : <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{copy.results} <span className="ml-1 text-sm font-medium text-slate-500">({filteredPosts.length})</span></h2>
      </div>
      {filteredPosts.length === 0 ? <div className="rounded-2xl border border-dashed border-[#D8DFCA] px-5 py-12 text-center text-sm leading-6 text-slate-600">{copy.noResults}</div> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post, index) => {
          const content = blogTranslation(post, language)
          const featured = index === 0 && !hasActiveFilters
          return <article key={post._id} className={`overflow-hidden rounded-2xl border border-[#E1E6D7] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${featured ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
            <a href={localizedHref('/blog/' + encodeURIComponent(blogSlug(post)), language)} className={`block h-full no-underline ${featured ? 'md:grid md:grid-cols-2 md:min-h-[20rem]' : ''}`}>
              {post.cover?.asset?.url ? <img {...getSanityImageProps(post.cover.asset.url, featured ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', featured ? 1100 : undefined)} alt={content.coverAlt} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" fetchPriority={index === 0 ? 'high' : undefined} className={`h-56 w-full object-cover ${featured ? 'md:h-full md:min-h-[20rem]' : ''}`}/>: <div className={`flex h-56 items-center justify-center bg-[#E9EDDB] text-4xl ${featured ? 'md:min-h-[20rem]' : ''}`} aria-hidden="true">🌿</div>}
              <div className={`p-5 ${featured ? 'md:flex md:flex-col md:justify-center md:p-8 lg:p-10' : ''}`}>
                {featured ? <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#71824F]">{copy.latest}</p> : null}
                <time dateTime={post.publishedAt || undefined} className="text-xs text-slate-500">{formatBlogDate(post.publishedAt, language)}</time>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#F0F3E8] px-2.5 py-1 text-xs font-medium text-[#53643A]">{isProject(post) ? copy.projects : copy.articles}</span>
                  {post.tags?.slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-[#F0F3E8] px-2.5 py-1 text-xs font-medium text-[#53643A]">{localizedTag(tag, language)}</span>)}
                </div>
                <h3 className={`mt-2 font-bold leading-snug text-slate-900 ${featured ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl'}`}>{content.title}</h3>
                {content.shortDescription ? <p className={`mt-3 text-sm leading-6 text-slate-600 ${featured ? 'md:text-base md:leading-7' : 'line-clamp-3'}`}>{content.shortDescription}</p> : null}
                <span className="mt-4 inline-flex text-sm font-bold text-[#647746]">{copy.readMore} <span aria-hidden="true" className="ml-1">→</span></span>
              </div>
            </a>
          </article>
        })}
      </div>}
    </>}
  </main>
}
