import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PlantCategory } from './plantCategories'

type IntakeImage = { path: string; name: string; size: number; type: string }
type PreviewImage = { name: string; url: string }
type Variant = Record<string, unknown>

type Submission = {
  id: string
  title: string
  sku: string | null
  payload: Record<string, unknown>
  status: string
  created_at: string
  updated_at: string
}

type Draft = {
  name: string
  slug: string
  scientificName: string
  productType: string
  categoryId: string
  sku: string
  shortDescription: string
  description: string
  variantName: string
  heightCm: string
  containerVolumeL: string
  priceEUR: string
  stockStatus: string
  stockQuantity: string
  mainImageIndex: number
  imageAlts: string[]
  imageAltsEn: string[]
  imageAltsRu: string[]
  plantCare: { light: string; waterNeeds: string; minWinterTempC: string; blackSeaCoast: string; adultHeightCm: string; foliageType: string; floweringSeason: string[]; plantingSeason: string[] }
  careGuide: string
  isFeatured: boolean
  nameEn: string
  shortDescriptionEn: string
  descriptionEn: string
  nameRu: string
  shortDescriptionRu: string
  descriptionRu: string
  seoTitle: string
  seoDescription: string
  seoTitleEn: string
  seoDescriptionEn: string
  seoTitleRu: string
  seoDescriptionRu: string
}

type Props = {
  submission: Submission
  categories: PlantCategory[]
  images: PreviewImage[]
  imagesLoading: boolean
  accessToken: string
  onSaved: (images?: IntakeImage[]) => Promise<void>
  onPublished: () => Promise<void>
  publishError?: string | null
  reviewMode?: boolean
}

const productTypes = [
  ['plant', 'Растение'],
  ['tree', 'Дърво'],
  ['shrub', 'Храст'],
  ['flower', 'Цвете'],
  ['perennial', 'Многогодишно растение'],
  ['indoor', 'Стайно растение'],
  ['citrus', 'Цитрус'],
  ['palm', 'Палма'],
  ['conifer', 'Иглолистно растение'],
  ['fruit', 'Плодово растение'],
  ['succulent', 'Сукулент'],
  ['climber', 'Катерливо растение'],
  ['ornamentalGrass', 'Декоративна трева'],
  ['groundcover', 'Почвопокривно растение'],
  ['bulb', 'Луковично растение'],
  ['herb', 'Билка'],
  ['aquatic', 'Водно растение'],
  ['other', 'Друг вид растение'],
] as const

const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-stone-800 outline-none transition focus:border-lime-700 focus:ring-2 focus:ring-lime-100'
const labelClass = 'block text-sm font-semibold text-stone-700'

function slugify(value: string) {
  const transliteration: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
  }
  return value.toLocaleLowerCase('bg-BG')
    .split('')
    .map((character) => transliteration[character] ?? character)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function numberText(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
}

function makeDraft(submission: Submission): Draft {
  const payload = submission.payload
  const saved = payload.publication && typeof payload.publication === 'object'
    ? payload.publication as Record<string, unknown>
    : payload.aiDraft && typeof payload.aiDraft === 'object' ? payload.aiDraft as Record<string, unknown> : {}
  const originalVariant = (payload.saleVariants as Variant[] | undefined)?.[0] || {}
  const savedVariant = (saved.saleVariants as Variant[] | undefined)?.[0] || {}
  const name = String(saved.name ?? payload.name ?? submission.title ?? '')
  const images = (payload.images as IntakeImage[] | undefined) || []
  const savedAlts = Array.isArray(saved.imageAlts) ? saved.imageAlts as string[] : []
  const savedAltsEn = Array.isArray(saved.imageAltsEn) ? saved.imageAltsEn as string[] : []
  const savedAltsRu = Array.isArray(saved.imageAltsRu) ? saved.imageAltsRu as string[] : []
  const savedPlantCare = saved.plantCare && typeof saved.plantCare === 'object' ? saved.plantCare as Record<string, unknown> : {}
  const researchData = payload.plantCareResearch && typeof payload.plantCareResearch === 'object' ? payload.plantCareResearch as Record<string, unknown> : {}
  const researchValues = researchData.plantCare && typeof researchData.plantCare === 'object' ? researchData.plantCare as Record<string, unknown> : {}
  const plantCare = { ...savedPlantCare, ...researchValues }
  const plantCare = savedPlantCare
  const translations = saved.translations && typeof saved.translations === 'object'
    ? saved.translations as Record<string, Record<string, unknown>>
    : {}
  const en = translations.en || {}
  const ru = translations.ru || {}
  const seo = saved.seo && typeof saved.seo === 'object' ? saved.seo as Record<string, unknown> : {}
  const seoEn = en.seo && typeof en.seo === 'object' ? en.seo as Record<string, unknown> : {}
  const seoRu = ru.seo && typeof ru.seo === 'object' ? ru.seo as Record<string, unknown> : {}
  const stockStatus = String(savedVariant.stockStatus ?? originalVariant.stockStatus ?? 'onRequest')
  return {
    name,
    slug: String(saved.slug || slugify(name)),
    scientificName: String(saved.scientificName ?? payload.latinName ?? ''),
    productType: String(saved.productType ?? ''),
    categoryId: String(saved.categoryId ?? payload.categoryId ?? ''),
    sku: String(saved.sku ?? submission.sku ?? ''),
    shortDescription: String(saved.shortDescription ?? ''),
    description: String(saved.description ?? payload.description ?? ''),
    variantName: String(savedVariant.name ?? originalVariant.name ?? ''),
    heightCm: numberText(savedVariant.saleHeightCm ?? originalVariant.saleHeightCm),
    containerVolumeL: numberText(savedVariant.containerVolumeL ?? originalVariant.containerVolumeL),
    priceEUR: numberText(savedVariant.priceEUR ?? originalVariant.priceEUR),
    stockStatus: stockStatus === 'preorder' ? 'onRequest' : stockStatus,
    stockQuantity: numberText(savedVariant.stockQuantity ?? originalVariant.stockQuantity ?? 1),
    mainImageIndex: Number.isInteger(saved.mainImageIndex) ? Number(saved.mainImageIndex) : 0,
    imageAlts: images.map((image, index) => String(savedAlts[index] || name + ' — снимка ' + (index + 1))),
    imageAltsEn: images.map((image, index) => String(savedAltsEn[index] || name + ' — plant photo ' + (index + 1))),
    imageAltsRu: images.map((image, index) => String(savedAltsRu[index] || name + ' — фотография растения ' + (index + 1))),
    plantCare: { light: String(plantCare.light || ''), waterNeeds: String(plantCare.waterNeeds || ''), minWinterTempC: numberText(plantCare.minWinterTempC), blackSeaCoast: String(plantCare.blackSeaCoast || 'needsVerification'), adultHeightCm: numberText(plantCare.adultHeightCm), foliageType: String(plantCare.foliageType || ''), floweringSeason: Array.isArray(plantCare.floweringSeason) ? plantCare.floweringSeason as string[] : [], plantingSeason: Array.isArray(plantCare.plantingSeason) ? plantCare.plantingSeason as string[] : [] },
    careGuide: String(saved.careGuide || ''),
    isFeatured: saved.isFeatured === true,
    nameEn: String(en.name || ''),
    shortDescriptionEn: String(en.shortDescription || ''),
    descriptionEn: String(en.description || ''),
    nameRu: String(ru.name || ''),
    shortDescriptionRu: String(ru.shortDescription || ''),
    descriptionRu: String(ru.description || ''),
    seoTitle: String(seo.title || ''),
    seoDescription: String(seo.description || ''),
    seoTitleEn: String(seoEn.title || ''),
    seoDescriptionEn: String(seoEn.description || ''),
    seoTitleRu: String(seoRu.title || ''),
    seoDescriptionRu: String(seoRu.description || ''),
  }
}

function toPublication(draft: Draft, categories: PlantCategory[] = []) {
  const numeric = (value: string) => value.trim() === '' ? null : Number(value)
  const translations: Record<string, Record<string, unknown>> = {
    bg: {
      name: draft.name.trim(),
      shortDescription: draft.shortDescription.trim(),
      description: draft.description.trim(),
    },
  }
  if (draft.nameEn.trim() || draft.shortDescriptionEn.trim() || draft.descriptionEn.trim() || draft.seoTitleEn.trim() || draft.seoDescriptionEn.trim()) {
    translations.en = {
      name: draft.nameEn.trim(),
      shortDescription: draft.shortDescriptionEn.trim(),
      description: draft.descriptionEn.trim(),
      seo: { title: draft.seoTitleEn.trim(), description: draft.seoDescriptionEn.trim() },
    }
  }
  if (draft.nameRu.trim() || draft.shortDescriptionRu.trim() || draft.descriptionRu.trim() || draft.seoTitleRu.trim() || draft.seoDescriptionRu.trim()) {
    translations.ru = {
      name: draft.nameRu.trim(),
      shortDescription: draft.shortDescriptionRu.trim(),
      description: draft.descriptionRu.trim(),
      seo: { title: draft.seoTitleRu.trim(), description: draft.seoDescriptionRu.trim() },
    }
  }
  translations.bg.seo = { title: draft.seoTitle.trim(), description: draft.seoDescription.trim() }
  return {
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    scientificName: draft.scientificName.trim(),
    productType: draft.productType,
    categoryId: draft.categoryId,
    categoryName: categories.find((category) => category._id === draft.categoryId)?.name || '',
    sku: draft.sku.trim(),
    shortDescription: draft.shortDescription.trim(),
    description: draft.description.trim(),
    mainImageIndex: draft.mainImageIndex,
    imageAlts: draft.imageAlts.map((alt) => alt.trim()),
    imageAltsEn: draft.imageAltsEn.map((alt) => alt.trim()),
    imageAltsRu: draft.imageAltsRu.map((alt) => alt.trim()),
    plantCare: { light: draft.plantCare.light || null, waterNeeds: draft.plantCare.waterNeeds || null, minWinterTempC: draft.plantCare.minWinterTempC.trim() ? Number(draft.plantCare.minWinterTempC) : null, blackSeaCoast: draft.plantCare.blackSeaCoast || 'needsVerification', adultHeightCm: draft.plantCare.adultHeightCm.trim() ? Number(draft.plantCare.adultHeightCm) : null, foliageType: draft.plantCare.foliageType || null, floweringSeason: draft.plantCare.floweringSeason, plantingSeason: draft.plantCare.plantingSeason },
    careGuide: draft.careGuide.trim(),
    saleVariants: [{
      name: draft.variantName.trim(),
      saleHeightCm: numeric(draft.heightCm),
      containerVolumeL: numeric(draft.containerVolumeL),
      priceEUR: numeric(draft.priceEUR),
      stockStatus: draft.stockStatus,
      stockQuantity: numeric(draft.stockQuantity),
    }],
    translations,
    isFeatured: draft.isFeatured,
    seo: { title: draft.seoTitle.trim(), description: draft.seoDescription.trim() },
  }
}

export default function PlantPublicationEditor({
  submission, categories, images, imagesLoading, accessToken, onSaved, onPublished, publishError, reviewMode = false,
}: Props) {
  const [draft, setDraft] = useState<Draft>(() => makeDraft(submission))
  const [savedFingerprint, setSavedFingerprint] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [careResearching, setCareResearching] = useState(false)
  const hasPublication = Boolean(submission.payload.publication)
  const plantCareResearch = submission.payload.plantCareResearch && typeof submission.payload.plantCareResearch === 'object' ? submission.payload.plantCareResearch as Record<string, unknown> : null
  const [updatingImages, setUpdatingImages] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const next = makeDraft(submission)
    setDraft(next)
    const hasSaved = !!(submission.payload.publication && typeof submission.payload.publication === 'object')
    setSavedFingerprint(hasSaved ? JSON.stringify(toPublication(next, categories)) : '')
    setSlugTouched(!!(submission.payload.publication as Record<string, unknown> | undefined)?.slug)
    setError('')
    setNotice('')
  }, [submission.id, submission.updated_at, categories])

  const imageFiles = (Array.isArray(submission.payload.reviewImages) ? submission.payload.reviewImages : submission.payload.images) as IntakeImage[] | undefined || []
  const imageCountMatches = images.length === imageFiles.length
  const hasAiDraft = !!(submission.payload.aiDraft && typeof submission.payload.aiDraft === 'object')
  const currentPublication = useMemo(() => toPublication(draft, categories), [draft, categories])
  const currentFingerprint = JSON.stringify(currentPublication)
  const isSaved = savedFingerprint !== '' && savedFingerprint === currentFingerprint
  const categoryGroups = useMemo(() => {
    const groups = new Map<string, PlantCategory[]>()
    for (const category of categories) {
      const group = category.parent?.name || 'Основни категории'
      groups.set(group, [...(groups.get(group) || []), category])
    }
    return Array.from(groups.entries())
  }, [categories])

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const validate = (requireImages = false) => {
    if (draft.name.trim().length < 2) return 'Въведете име на растението.'
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug.trim())) return 'URL адресът трябва да съдържа малки латински букви и тирета.'
    if (!draft.productType) return 'Изберете тип на растението.'
    if (!draft.categoryId || !categories.some((category) => category._id === draft.categoryId)) return 'Изберете валидна категория от Sanity.'
    if (draft.variantName.trim().length < 2) return 'Въведете име на търговския вариант.'
    if (draft.heightCm && (!Number.isFinite(Number(draft.heightCm)) || Number(draft.heightCm) < 0)) return 'Проверете височината.'
    if (draft.containerVolumeL && (!Number.isFinite(Number(draft.containerVolumeL)) || Number(draft.containerVolumeL) <= 0)) return 'Обемът на контейнера трябва да е положително число.'
    if (draft.priceEUR && (!Number.isFinite(Number(draft.priceEUR)) || Number(draft.priceEUR) <= 0)) return 'Цената трябва да е по-голяма от 0 EUR.'
    if (draft.stockQuantity && (!Number.isInteger(Number(draft.stockQuantity)) || Number(draft.stockQuantity) < 0)) return 'Количеството трябва да е цяло число от 0 нагоре.'
    if (draft.stockStatus === 'inStock' && (!draft.priceEUR || Number(draft.priceEUR) <= 0)) return 'За налично растение въведете цена или изберете „По заявка“.'
    if (draft.stockStatus === 'inStock' && Number(draft.stockQuantity || 0) < 1) return 'При статус „В наличност“ количеството трябва да е поне 1.'
    if (imageFiles.some((image) => !['image/jpeg', 'image/png', 'image/webp'].includes(image.type))) return 'За публикуване използвайте JPG, PNG или WebP. HEIC снимките първо трябва да бъдат преобразувани в JPG.'
    if (requireImages && imageFiles.length === 0) return 'За публикуване е необходима поне една снимка.'
    if (!imageCountMatches || imagesLoading) return 'Преди запазване всички избрани снимки трябва да са достъпни за преглед.'
    if (imageFiles.length > 0 && (draft.mainImageIndex < 0 || draft.mainImageIndex >= imageFiles.length)) return 'Изберете основна снимка.'
    return ''
  }

  const researchPlantCare = async () => {
    if (!hasAiDraft || hasPublication || !draft.scientificName.trim()) return
    setCareResearching(true)
    try {
      const response = await fetch('/api/manager/enrich-plant-care', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken }, body: JSON.stringify({ submissionId: submission.id, reviewInput: { name: draft.name.trim(), scientificName: draft.scientificName.trim() } }) })
      const result = await response.json() as { error?: string; careDraft?: Record<string, unknown> }
      if (!response.ok || !result.careDraft) throw new Error(result.error || 'Не удалось подготовить характеристики.')
      setNotice('Таксономическая проверка завершена. Проверьте предложенные характеристики.')
      await onSaved()
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка проверки характеристик.') }
    finally { setCareResearching(false) }
  }

  const removeImage = async (index: number) => {
    const image = imageFiles[index]
    if (!image) return
    if (!window.confirm('Да премахна ли тази снимка от продуктовата карта? Оригиналният файл и първоначалната заявка на продавача ще останат запазени. AI-черновата и финалната карта ще бъдат обновени.')) return
    const nextImages = imageFiles.filter((_, imageIndex) => imageIndex !== index)
    const nextPayload = { ...submission.payload, reviewImages: nextImages, aiDraft: null, publication: null, plantCareResearch: null }
    setUpdatingImages(true); setError(''); setNotice('')
    try {
      const { data, error: updateError } = await supabase.from('catalog_submissions')
        .update({ payload: nextPayload, updated_at: new Date().toISOString() })
        .eq('id', submission.id).eq('status', submission.status).eq('updated_at', submission.updated_at)
        .select('id').maybeSingle()
      if (updateError) throw updateError
      if (!data) throw new Error('Заявката е променена. Обновете екрана и опитайте отново.')
      setSavedFingerprint('')
      await onSaved(nextImages)
      setNotice(nextImages.length === 0
        ? 'Всички снимки са изключени от картата. ИИ може да подготви текстовете без снимки; за публикуване ще е необходима поне една снимка.'
        : 'Снимката е премахната от картата. Оригиналната заявка на продавача е запазена; подгответе AI-черновата отново.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не успяхме да премахнем снимката от продуктовата карта.')
    } finally { setUpdatingImages(false) }
  }

  const generateAiDraft = async () => {
    if (draft.name.trim().length < 2) { setError('Проверете името на растението преди подготовката с ИИ.'); return }
    if (!draft.categoryId || !categories.some((category) => category._id === draft.categoryId)) { setError('Изберете и проверете категорията преди подготовката с ИИ.'); return }
    if (draft.priceEUR.trim() && (!Number.isFinite(Number(draft.priceEUR)) || Number(draft.priceEUR) <= 0)) { setError('Проверете цената. Тя трябва да е положителна сума в EUR.'); return }
    if (draft.stockQuantity.trim() && (!Number.isInteger(Number(draft.stockQuantity)) || Number(draft.stockQuantity) < 0)) { setError('Проверете складовото количество.'); return }
    if (draft.stockStatus === 'inStock' && (!draft.priceEUR.trim() || Number(draft.priceEUR) <= 0 || Number(draft.stockQuantity || 0) < 1)) { setError('За налично растение въведете положителна цена и количество поне 1.'); return }
    if (draft.heightCm.trim() && (!Number.isFinite(Number(draft.heightCm)) || Number(draft.heightCm) < 0)) { setError('Проверете височината при продажба.'); return }
    if (draft.containerVolumeL.trim() && (!Number.isFinite(Number(draft.containerVolumeL)) || Number(draft.containerVolumeL) <= 0)) { setError('Проверете обема на контейнера.'); return }
    if (draft.variantName.trim().length < 2) { setError('Проверете името на варианта за продажба.'); return }
    setEnriching(true); setError(''); setNotice('')
    try {
      const categoryName = categories.find((category) => category._id === draft.categoryId)?.name || ''
      const response = await fetch('/api/manager/enrich-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
        body: JSON.stringify({
          submissionId: submission.id,
          reviewInput: {
            name: draft.name.trim(),
            scientificName: draft.scientificName.trim(),
            categoryId: draft.categoryId,
            categoryName,
            sku: draft.sku.trim(),
            description: draft.description.trim(),
            saleVariants: [{
              name: draft.variantName.trim(),
              saleHeightCm: draft.heightCm.trim() ? Number(draft.heightCm) : null,
              containerVolumeL: draft.containerVolumeL.trim() ? Number(draft.containerVolumeL) : null,
              priceEUR: draft.priceEUR.trim() ? Number(draft.priceEUR) : null,
              stockStatus: draft.stockStatus,
              stockQuantity: draft.stockQuantity.trim() ? Number(draft.stockQuantity) : null,
            }],
          },
        }),
      })
      const result = await response.json().catch(() => ({})) as {
        error?: string
        draft?: Record<string, unknown>
        diagnostic?: { id?: string; stageLabel?: string; code?: string; imageNumber?: number | null; hint?: string; technical?: string }
      }
      if (!response.ok || !result.draft) {
        const diagnostic = result.diagnostic
        const details = diagnostic
          ? [
              result.error || 'Не удалось подготовить AI-черновик.',
              'Этап: ' + (diagnostic.stageLabel || 'не определён') + (diagnostic.imageNumber ? ' (фото ' + diagnostic.imageNumber + ')' : ''),
              'Код: ' + (diagnostic.code || 'AI_UNKNOWN'),
              diagnostic.hint || '',
              diagnostic.technical ? 'Ответ модели: ' + diagnostic.technical : '',
              diagnostic.id ? 'Диагностика: ' + diagnostic.id : '',
            ].filter(Boolean).join(' — ')
          : result.error || 'Не удалось подготовить AI-черновик.'
        throw new Error(details)
      }
      setDraft(makeDraft({ ...submission, payload: { ...submission.payload, aiDraft: result.draft, publication: undefined } }))
      setSlugTouched(false); setSavedFingerprint('')
      setNotice('ИИ подготви текстовете, ALT описанията и предложените грижи. Проверете ботаническите данни и запазете финалната версия.')
      await onSaved()
    } catch (err) { setError(err instanceof Error ? err.message : 'Възникна грешка при AI подготовката.') }
    finally { setEnriching(false) }
  }

  const request = async (action: 'save' | 'publish') => {
    const validationError = validate(action === 'publish')
    if (validationError) { setError(validationError); return }
    setError('')
    setNotice('')
    if (action === 'publish' && !isSaved) {
      setError('Първо запазете окончателните данни за продукта.')
      return
    }
    if (action === 'publish' && !window.confirm('Публикуване в публичния каталог на Florial? След потвърждение растението ще стане видимо в магазина.')) return

    if (action === 'save') setSaving(true)
    else setPublishing(true)
    try {
      const response = await fetch('/api/manager/publish-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
        body: JSON.stringify(action === 'save'
          ? { action, submissionId: submission.id, publication: currentPublication }
          : { action, submissionId: submission.id }),
      })
      const result = await response.json().catch(() => ({})) as { error?: string; documentId?: string }
      if (!response.ok) throw new Error(result.error || 'Не удалось выполнить действие.')
      if (action === 'save') {
        setSavedFingerprint(currentFingerprint)
        setNotice('Финалната версия е запазена. Проверете я и натиснете „Публикувай в каталога“, когато сте готови.')
        await onSaved()
      } else {
        setNotice('Растението е публикувано в каталога. Документ: ' + (result.documentId || 'потвърден'))
        await onPublished()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Възникна неочаквана грешка.')
      if (action === 'publish') await onSaved().catch(() => undefined)
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  return (
    <section className="rounded-2xl border border-lime-300 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{reviewMode ? 'Проверка на заявката и подготовка на картата' : 'Окончателна проверка преди публикуване'}</h2>
          <p className="mt-1 text-sm text-stone-600">{reviewMode ? 'Първо проверете и поправете подадените от продавача данни. След това стартирайте ИИ с бутона по-долу. ИИ не се изпълнява автоматично и не променя търговските данни.' : 'Одобрената заявка е отделена от окончателните данни за продукта. Промените тук не редактират първоначалната заявка на служителя.'}</p>
        </div>
        <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-900">{isSaved ? 'Финалната версия е запазена' : 'Има неприключени промени'}</span>
      </div>

      {publishError && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Последен опит за публикуване: {publishError}</div>}
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mt-4 rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}

      <div className="mt-5 rounded-xl border border-lime-200 bg-lime-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lime-950">Подготовка на картата с помощта на ИИ</h3>
            <p className="mt-1 text-sm text-lime-900">След като проверите данните, натиснете бутона. ИИ ще подготви BG/RU/EN текстове, SEO и предложения за грижи; ALT ще бъде създаден само за снимките, които са оставени в картата.</p>
          </div>
          <button type="button" disabled={enriching || saving || publishing || updatingImages || imagesLoading || hasAiDraft} onClick={() => void generateAiDraft()} className="rounded-xl bg-lime-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {enriching ? 'Подготовка…' : hasAiDraft ? 'ИИ вече подготви картата' : 'Подготви картата с ИИ'}
          </button>
        </div>
        {hasAiDraft && <p className="mt-2 text-xs text-lime-950">ИИ-черновикът вече е създаден. Повторното генериране е изключено, за да не се изразходва квота. Можете да редактирате резултата ръчно.</p>}
        <p className="mt-2 text-xs text-lime-900">Цена, SKU, височина при продажба, обем на саксията, наличност и количество се вземат от проверените от вас данни и не се генерират от ИИ.</p>
      </div>
      <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sky-950">Проверка ботанических характеристик</h3>
            <p className="mt-1 text-sm text-sky-900">GBIF проверяет латинское название, затем AI предлагает значения для проверки владельцем.</p>
          </div>
          <button type="button" disabled={!hasAiDraft || hasPublication || careResearching || enriching || saving || publishing || !draft.scientificName.trim()} onClick={() => void researchPlantCare()} className="rounded-xl bg-sky-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {careResearching ? 'Проверка…' : 'Проверить и предложить характеристики'}
          </button>
        </div>
        {plantCareResearch && <div className="mt-3 rounded-lg border border-sky-200 bg-white p-3 text-sm text-sky-950">
          <p className="font-semibold">{(plantCareResearch.identity as Record<string, unknown> | undefined)?.status === 'verified' ? 'Таксономия подтверждена GBIF' : 'Требуется уточнить ботаническое имя'}</p>
          <p className="mt-1">{String((plantCareResearch.identity as Record<string, unknown> | undefined)?.canonicalName || '')}</p>
          <p className="mt-2 text-xs text-slate-600">GBIF подтверждает таксономию, но не агротехнические свойства. Уверенность AI — самооценка модели, а не независимое подтверждение. Проверьте значения перед публикацией.</p>
        </div>}
      </div>
      <form className="mt-5 space-y-5" onSubmit={(event) => { event.preventDefault(); void request('save') }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Име на растението (BG) *<input className={inputClass} value={draft.name} onChange={(event) => {
            const value = event.target.value
            setDraft((current) => ({ ...current, name: value, slug: slugTouched ? current.slug : slugify(value) }))
          }} required /></label>
          <label className={labelClass}>Ботаническо име<input className={inputClass} value={draft.scientificName} onChange={(event) => update('scientificName', event.target.value)} placeholder="Olea europaea" /></label>
          <label className={labelClass}>URL адрес (slug) *<input className={inputClass} value={draft.slug} onChange={(event) => { setSlugTouched(true); update('slug', event.target.value.toLowerCase()) }} required /></label>
          <label className={labelClass}>Тип на растението *<select className={inputClass} value={draft.productType} onChange={(event) => update('productType', event.target.value)} required><option value="">Изберете тип</option>{productTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className={labelClass}>Категория *<select className={inputClass} value={draft.categoryId} onChange={(event) => update('categoryId', event.target.value)} required><option value="">Изберете категория</option>{categoryGroups.map(([group, items]) => <optgroup key={group} label={group}>{items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</optgroup>)}</select></label>
          <label className={labelClass}>Артикул / SKU<input className={inputClass} value={draft.sku} onChange={(event) => update('sku', event.target.value)} /></label>
          <label className={labelClass}>Кратко описание (BG)<textarea className={inputClass} rows={3} value={draft.shortDescription} onChange={(event) => update('shortDescription', event.target.value)} /></label>
          <label className={labelClass}>Пълно описание (BG)<textarea className={inputClass} rows={5} value={draft.description} onChange={(event) => update('description', event.target.value)} /></label>
        </div>

        <div className="rounded-xl border border-stone-200 p-4">
          <h3 className="font-semibold">Вариант за продажба</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Размер / вариант *<input className={inputClass} value={draft.variantName} onChange={(event) => update('variantName', event.target.value)} required /></label>
            <label className={labelClass}>Височина при продажба (см)<input className={inputClass} type="number" min="0" step="1" value={draft.heightCm} onChange={(event) => update('heightCm', event.target.value)} /></label>
            <label className={labelClass}>Обем на контейнера (литри)<input className={inputClass} type="number" min="0.1" step="0.1" value={draft.containerVolumeL} onChange={(event) => update('containerVolumeL', event.target.value)} /></label>
            <label className={labelClass}>Цена с ДДС (EUR)<input className={inputClass} type="number" min="0.01" step="0.01" value={draft.priceEUR} onChange={(event) => update('priceEUR', event.target.value)} placeholder="Празно = по запитване" /></label>
            <label className={labelClass}>Наличност<select className={inputClass} value={draft.stockStatus} onChange={(event) => update('stockStatus', event.target.value)}><option value="inStock">В наличност</option><option value="onRequest">По заявка</option><option value="outOfStock">Изчерпан</option></select></label>
            <label className={labelClass}>Количество на склад<input className={inputClass} type="number" min="0" step="1" value={draft.stockQuantity} onChange={(event) => update('stockQuantity', event.target.value)} /></label>
          </div>
          <p className="mt-3 text-xs text-stone-500">Крайната потребителска цена се публикува с включено ДДС. Статусът „По заявка“ може да се използва без посочена цена.</p>
        </div>

        <div className="rounded-xl border border-stone-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Фотографии за каталога ({imageFiles.length})</h3>
            <span className="text-xs text-stone-500">{imagesLoading ? 'Зареждане…' : imageCountMatches ? 'Всички снимки са достъпни' : 'Не всички снимки могат да бъдат отворени'}</span>
          </div>
          {imageFiles.length === 0 && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Няма избрани снимки за продуктовата карта. Можете да подготвите и запазите текстовете без снимки. За публикуване в каталога ще е необходима поне една снимка.</p>}
          {!imageCountMatches && imageFiles.length > 0 && !imagesLoading && <p className="mt-3 text-sm text-red-700">Не публикувайте, докато всяка снимка не се визуализира успешно.</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <div key={image.url} className="overflow-hidden rounded-xl border border-stone-200">
                <img src={image.url} alt={image.name} className="h-40 w-full object-cover" />
                <div className="space-y-2 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name={'main-image-' + submission.id} checked={draft.mainImageIndex === index} onChange={() => update('mainImageIndex', index)} /> Основна снимка</label>
                    <button type="button" disabled={updatingImages || enriching || saving || publishing} onClick={() => void removeImage(index)} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Премахни от картата</button>
                  </div>
                  <label className={labelClass}>Alt текст (BG)<input className={inputClass} value={draft.imageAlts[index] || ''} onChange={(event) => update('imageAlts', draft.imageAlts.map((alt, altIndex) => altIndex === index ? event.target.value : alt))} /></label>
                  <label className={labelClass}>Alt text (EN)<input className={inputClass} value={draft.imageAltsEn[index] || ''} onChange={(event) => update('imageAltsEn', draft.imageAltsEn.map((alt, altIndex) => altIndex === index ? event.target.value : alt))} /></label>
                  <label className={labelClass}>Alt текст (RU)<input className={inputClass} value={draft.imageAltsRu[index] || ''} onChange={(event) => update('imageAltsRu', draft.imageAltsRu.map((alt, altIndex) => altIndex === index ? event.target.value : alt))} /></label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <details className="rounded-xl border border-stone-200 p-4">
          <summary className="cursor-pointer font-semibold">Преводи (по избор)</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Име (EN)<input className={inputClass} value={draft.nameEn} onChange={(event) => update('nameEn', event.target.value)} /></label>
            <label className={labelClass}>Име (RU)<input className={inputClass} value={draft.nameRu} onChange={(event) => update('nameRu', event.target.value)} /></label>
            <label className={labelClass}>Кратко описание (EN)<textarea className={inputClass} rows={3} value={draft.shortDescriptionEn} onChange={(event) => update('shortDescriptionEn', event.target.value)} /></label>
            <label className={labelClass}>Кратко описание (RU)<textarea className={inputClass} rows={3} value={draft.shortDescriptionRu} onChange={(event) => update('shortDescriptionRu', event.target.value)} /></label>
            <label className={labelClass}>Описание (EN)<textarea className={inputClass} rows={5} value={draft.descriptionEn} onChange={(event) => update('descriptionEn', event.target.value)} /></label>
            <label className={labelClass}>Описание (RU)<textarea className={inputClass} rows={5} value={draft.descriptionRu} onChange={(event) => update('descriptionRu', event.target.value)} /></label>
          </div>
        </details>

        <details className="rounded-xl border border-stone-200 p-4"><summary className="cursor-pointer font-semibold">Характеристики и грижи за растението</summary><p className="mt-2 text-xs text-amber-800">Предложенията на ИИ трябва да бъдат проверени. Не попълвайте минимална зимна температура или височина на възрастно растение без надежден източник.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Светлина<select className={inputClass} value={draft.plantCare.light} onChange={(event) => update('plantCare', { ...draft.plantCare, light: event.target.value })}><option value="">Не е посочено</option><option value="sun">Пълно слънце</option><option value="partialShade">Полусянка</option><option value="shade">Сянка</option></select></label>
          <label className={labelClass}>Нужда от поливане<select className={inputClass} value={draft.plantCare.waterNeeds} onChange={(event) => update('plantCare', { ...draft.plantCare, waterNeeds: event.target.value })}><option value="">Не е посочено</option><option value="low">Ниска</option><option value="medium">Средна</option><option value="high">Висока</option></select></label>
          <label className={labelClass}>Листна маса<select className={inputClass} value={draft.plantCare.foliageType} onChange={(event) => update('plantCare', { ...draft.plantCare, foliageType: event.target.value })}><option value="">Не е посочено</option><option value="evergreen">Вечнозелено</option><option value="deciduous">Листопадно</option></select></label>
          <label className={labelClass}>Пригодност за Черноморието<select className={inputClass} value={draft.plantCare.blackSeaCoast} onChange={(event) => update('plantCare', { ...draft.plantCare, blackSeaCoast: event.target.value })}><option value="needsVerification">Непроверено</option><option value="suitable">Подходящо</option><option value="notSuitable">Неподходящо</option></select></label>
          <label className={labelClass}>Минимална зимна температура (°C)<input className={inputClass} type="number" value={draft.plantCare.minWinterTempC} onChange={(event) => update('plantCare', { ...draft.plantCare, minWinterTempC: event.target.value })} /></label>
          <label className={labelClass}>Височина на възрастното растение (см)<input className={inputClass} type="number" min="0" value={draft.plantCare.adultHeightCm} onChange={(event) => update('plantCare', { ...draft.plantCare, adultHeightCm: event.target.value })} /></label>
          <label className={labelClass}>Сезон на цъфтеж (spring, summer, autumn, winter)<input className={inputClass} value={draft.plantCare.floweringSeason.join(', ')} onChange={(event) => update('plantCare', { ...draft.plantCare, floweringSeason: event.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} /></label>
          <label className={labelClass}>Сезон на засаждане (добавете yearRound при нужда)<input className={inputClass} value={draft.plantCare.plantingSeason.join(', ')} onChange={(event) => update('plantCare', { ...draft.plantCare, plantingSeason: event.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} /></label>
        </div><label className={labelClass + ' mt-4'}>Ръководство за отглеждане (BG)<textarea className={inputClass} rows={5} value={draft.careGuide} onChange={(event) => update('careGuide', event.target.value)} /></label></details>
        <details className="rounded-xl border border-stone-200 p-4">
          <summary className="cursor-pointer font-semibold">SEO и дополнительные настройки</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>SEO заглавие (BG)<input className={inputClass} maxLength={160} value={draft.seoTitle} onChange={(event) => update('seoTitle', event.target.value)} /></label>
            <label className={labelClass}>SEO описание (BG)<textarea className={inputClass} rows={3} maxLength={320} value={draft.seoDescription} onChange={(event) => update('seoDescription', event.target.value)} /></label>
            <label className={labelClass}>SEO title (EN)<input className={inputClass} maxLength={160} value={draft.seoTitleEn} onChange={(event) => update('seoTitleEn', event.target.value)} /></label>
            <label className={labelClass}>SEO description (EN)<textarea className={inputClass} rows={3} maxLength={320} value={draft.seoDescriptionEn} onChange={(event) => update('seoDescriptionEn', event.target.value)} /></label>
            <label className={labelClass}>SEO заголовок (RU)<input className={inputClass} maxLength={160} value={draft.seoTitleRu} onChange={(event) => update('seoTitleRu', event.target.value)} /></label>
            <label className={labelClass}>SEO описание (RU)<textarea className={inputClass} rows={3} maxLength={320} value={draft.seoDescriptionRu} onChange={(event) => update('seoDescriptionRu', event.target.value)} /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update('isFeatured', event.target.checked)} /> Препоръчано растение</label>
          </div>
        </details>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving || publishing || (reviewMode && !hasAiDraft)} className="rounded-xl bg-stone-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Запазване…' : reviewMode ? 'Запази подготвената карта' : 'Запази финалната версия'}</button>
          {!reviewMode && <button type="button" disabled={!isSaved || saving || publishing} onClick={() => void request('publish')} className="rounded-xl bg-lime-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{publishing ? 'Публикуване…' : 'Публикувай в каталога'}</button>}
        </div>
      </form>
    </section>
  )
}

