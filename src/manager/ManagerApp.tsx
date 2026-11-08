import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { managerApi } from '../lib/managerApi'
import { getPlantCategories, type PlantCategory } from './plantCategories'
import SubmissionDetails from './SubmissionDetails'
import PlantPublicationEditor from './PlantPublicationEditor'
import PlantCatalogChangeForm from './PlantCatalogChangeForm'
import PlantStockChangeForm from './PlantStockChangeForm'
import PlantImageLibrary from './PlantImageLibrary'
import OrdersManager from './OrdersManager'
import ProductSeoManager from './ProductSeoManager'
import ServiceLeadsManager from './ServiceLeadsManager'

type StaffPermissions = {
  canCreatePlant: boolean; canEditPlantCard: boolean; canAddPlantVariant: boolean; canEditPlantPrice: boolean; canEditPlantStock: boolean;
  canReviewPlantSubmissions: boolean; canApprovePlantSubmission: boolean; canPublishPlant: boolean;
  canManageStaff: boolean; canDelegatePermissions: boolean; canViewAnalytics: boolean;
  canViewOrders: boolean; canEditOrders: boolean; canDeleteTestOrders: boolean; canManageCategorySeo: boolean; canViewServiceLeads: boolean; canManageServiceLeads: boolean;
}
type StaffPermissionKey = keyof StaffPermissions
const permissionOptions: Array<{ key: StaffPermissionKey; label: string }> = [
  { key: 'canCreatePlant', label: 'Създаване на растения' },
  { key: 'canEditPlantCard', label: 'Подготовка и редактиране на продуктови карти' },
  { key: 'canAddPlantVariant', label: 'Добавяне на варианти' },
  { key: 'canEditPlantPrice', label: 'Промяна на цени' },
  { key: 'canEditPlantStock', label: 'Промяна на количеството на растенията' },
  { key: 'canReviewPlantSubmissions', label: 'Проверка и връщане на заявки' },
  { key: 'canApprovePlantSubmission', label: 'Одобрение на заявки' },
  { key: 'canPublishPlant', label: 'Публикация в каталога' },
  { key: 'canManageStaff', label: 'Управление на служители' },
  { key: 'canDelegatePermissions', label: 'Делегиране на права' },
  { key: 'canViewAnalytics', label: 'Преглед на аналитиката' },
  { key: 'canViewOrders', label: 'Преглед и търсене на поръчки' },
  { key: 'canEditOrders', label: 'Обработка и редактиране на поръчки' },
  { key: 'canDeleteTestOrders', label: 'Изтриване на тестови поръчки' },
  { key: 'canManageCategorySeo', label: 'Генериране и управление на SEO категориите' },
  { key: 'canViewServiceLeads', label: 'Преглед на заявките за услуги' },
  { key: 'canManageServiceLeads', label: 'Обработка на заявките за услуги' },
]
const emptyPermissions: StaffPermissions = {
  canCreatePlant: false, canEditPlantCard: false, canAddPlantVariant: false, canEditPlantPrice: false, canEditPlantStock: false,
  canReviewPlantSubmissions: false, canApprovePlantSubmission: false, canPublishPlant: false,
  canManageStaff: false, canDelegatePermissions: false, canViewAnalytics: false,
  canViewOrders: false, canEditOrders: false, canDeleteTestOrders: false, canManageCategorySeo: false, canViewServiceLeads: false, canManageServiceLeads: false,
}
type StaffProfile = { user_id: string; role: 'seller' | 'manager' | 'owner'; display_name: string; is_active: boolean; permissions: StaffPermissions }
type Submission = {
  id: string; title: string; sku: string | null; operation: 'create' | 'update'; target_document_id: string | null; payload: Record<string, unknown>;
  status: string; created_by: string; created_at: string; updated_at: string;
  review_note: string | null; notification_sent_at: string | null; publish_error: string | null
}
type Session = { access_token: string; user: { id: string; email?: string } }
type IntakeImage = { path: string; url?: string; assetId?: string; name: string; size: number; type: string }
type LocalPreview = { file: File; url: string }
type StaffMember = { user_id: string; email: string; display_name: string; role: 'seller' | 'manager' | 'owner'; is_active: boolean; permissions: StaffPermissions; created_at?: string; created_by?: string | null }
type AnalyticsReport = {
  period_days: number
  totals: { page_views: number; call_bg: number; call_en_ru: number; chat_click: number; contact_clicks: number; total_events: number }
  daily: Array<{ event_day: string; page_views: number; call_bg: number; call_en_ru: number; chat_click: number }>
  by_event: Array<{ event_type: string; event_count: number }>
  by_language: Array<{ lang: string; event_count: number }>
  top_pages: Array<{ page_path: string; page_views: number }>
}
const statusLabels: Record<string, string> = {
  draft: 'Чернова', submitted: 'Изпратена за проверка', in_review: 'В процес на проверка',
  changes_requested: 'Нужни са корекции', approved: 'Одобрена', publishing: 'Публикува се',
  published: 'Публикувана', publish_failed: 'Грешка при публикуване', rejected: 'Отхвърлена',
}
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-stone-800 outline-none transition focus:border-lime-700 focus:ring-2 focus:ring-lime-100'
const labelClass = 'block text-sm font-semibold text-stone-700'
const sellerPlantTypes = [
  ['plant', 'Растение'], ['tree', 'Дърво'], ['shrub', 'Храст'], ['flower', 'Цвете'],
  ['perennial', 'Многогодишно растение'], ['indoor', 'Стайно растение'], ['citrus', 'Цитрус'],
  ['palm', 'Палма'], ['conifer', 'Иглолистно растение'], ['fruit', 'Плодово растение'],
  ['succulent', 'Сукулент'], ['climber', 'Катерливо растение'], ['ornamentalGrass', 'Декоративна трева'],
  ['groundcover', 'Почвопокривно растение'], ['bulb', 'Луковично растение'], ['herb', 'Билка'],
  ['aquatic', 'Водно растение'], ['other', 'Друг вид растение'],
] as const

export default function ManagerApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [bootstrapSecret, setBootstrapSecret] = useState('')
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false)
  const [bootstrapConfigured, setBootstrapConfigured] = useState(false)
  const [bootstrapError, setBootstrapError] = useState('')
  const [bootstrapSaving, setBootstrapSaving] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sellerWorkspace, setSellerWorkspace] = useState<'home' | 'requests' | 'create' | 'variant' | 'price' | 'stock'>('home')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false)
  const [events, setEvents] = useState<Array<{ id: number; event_type: string; from_status: string | null; to_status: string | null; note: string | null; created_at: string }>>([])
  const [title, setTitle] = useState('')
  const [latinName, setLatinName] = useState('')
  const [productType, setProductType] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [plantCategories, setPlantCategories] = useState<PlantCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')
  const [filePreviews, setFilePreviews] = useState<LocalPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [variantName, setVariantName] = useState('')
  const [height, setHeight] = useState('')
  const [potVolume, setPotVolume] = useState('')
  const [price, setPrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('')
  const [stockStatus, setStockStatus] = useState('inStock')
  const [files, setFiles] = useState<File[]>([])
  const [selectedLibraryImages, setSelectedLibraryImages] = useState<IntakeImage[]>([])
  const [removedSavedImageIds, setRemovedSavedImageIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [previewImages, setPreviewImages] = useState<Array<{ name: string; url: string }>>([])
  const [activeTab, setActiveTab] = useState<'submissions' | 'orders' | 'staff' | 'analytics' | 'categories' | 'productsSeo' | 'serviceLeads'>('submissions')
  const [analyticsDays, setAnalyticsDays] = useState<1 | 7 | 30 | 90>(30)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsReport | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')
  const [categorySeoLoading, setCategorySeoLoading] = useState(false)
  const [categorySeoProgress, setCategorySeoProgress] = useState('')
  const [categorySeoNotice, setCategorySeoNotice] = useState('')
  const [categorySeoError, setCategorySeoError] = useState('')
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffSaving, setStaffSaving] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [staffNotice, setStaffNotice] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRole, setNewStaffRole] = useState<'seller' | 'manager'>('seller')
  const [newStaffPassword, setNewStaffPassword] = useState('')
  const [passwordTarget, setPasswordTarget] = useState<string | null>(null)
  const [replacementPassword, setReplacementPassword] = useState('')
  const [newStaffPermissions, setNewStaffPermissions] = useState<StaffPermissions>({ ...emptyPermissions })

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setSession(null); setProfile(null); setSubmissions([]); setActiveTab('submissions'); setLoading(false); return
    }
    setSession(currentSession)
    const { data, error: profileError } = await managerApi
      .from('catalog_staff_profiles')
      .select('user_id,role,display_name,is_active,permissions')
      .eq('user_id', currentSession.user.id)
      .maybeSingle()
    if (profileError || !data || !data.is_active) {
      setProfile(null)
      setError('Този акаунт няма активен достъп до Florial Manager. Обърнете се към собственика.')
      setLoading(false)
      return
    }
    setError('')
    setProfile(data as StaffProfile)
    setLoading(false)
  }, [])

  const loadSubmissions = useCallback(async () => {
    if (!profile) return
    let query = managerApi.from('catalog_submissions')
      .select('id,title,sku,operation,target_document_id,payload,status,created_by,created_at,updated_at,review_note,notification_sent_at,publish_error')
      .eq('catalog', 'plants')
      .order('updated_at', { ascending: false })
      .limit(100)
    if (profile.role === 'seller' || profile.role === 'manager' && !profile.permissions.canReviewPlantSubmissions && !profile.permissions.canApprovePlantSubmission && !profile.permissions.canPublishPlant && !profile.permissions.canEditPlantCard) query = query.eq('created_by', profile.user_id)
    const { data, error: listError } = await query
    if (listError) { setError('Не успяхме да заредим заявките. ' + listError.message); return }
    setSubmissions((data || []) as Submission[])
  }, [profile])

  useEffect(() => {
    let alive = true
    managerApi.auth.getSession().then(({ data }) => {
      if (alive) void loadProfile(data.session as Session | null)
    })
    const { data: listener } = managerApi.auth.onAuthStateChange((_event, nextSession) => {
      if (alive) {
        setLoading(true)
        void loadProfile(nextSession as Session | null)
      }
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [loadProfile])

  useEffect(() => {
    let active = true
    fetch('/api/manager/auth/bootstrap-status', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json().catch(() => ({})) as { available?: boolean; configured?: boolean }
      if (active) { setBootstrapAvailable(result.available === true); setBootstrapConfigured(result.configured === true) }
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => { void loadSubmissions() }, [loadSubmissions])

  useEffect(() => {
    let active = true
    setCategoriesLoading(true)
    getPlantCategories()
      .then((items) => { if (active) { setPlantCategories(items || []); setCategoriesError('') } })
      .catch((err) => { if (active) setCategoriesError(err instanceof Error ? err.message : 'Не успяхме да заредим категориите.') })
      .finally(() => { if (active) setCategoriesLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const previews = files.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setFilePreviews(previews)
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url))
  }, [files])

  const runCategorySeo = async (mode: 'all' | 'missing') => {
    if (categorySeoLoading) return
    if (mode === 'all' && !window.confirm('Ще бъдат създадени нови SEO предложения за всички категории на български, руски и английски език. Одобрените SEO полета на сайта няма да бъдат променени. Съществуващите чернови-предложения ще бъдат обновени. Продължаваме ли?')) return
    setCategorySeoLoading(true)
    setCategorySeoError('')
    setCategorySeoNotice('')
    setCategorySeoProgress('Подготовка на категориите…')
    let offset = 0
    let total = 0
    let processed = 0
    let generatedFields = 0
    let skipped = 0
    try {
      let hasMore = true
      while (hasMore) {
        const response = await fetch('/api/manager/category-seo', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, offset }),
        })
        const result = await response.json() as { total?: number; processed?: number; generatedFields?: number; skipped?: number; nextOffset?: number; hasMore?: boolean; error?: string }
        if (!response.ok) throw new Error(result.error || 'Генерацията на SEO не беше успешна.')
        total = Number(result.total || total)
        processed += Number(result.processed || 0)
        generatedFields += Number(result.generatedFields || 0)
        skipped += Number(result.skipped || 0)
        offset = Number(result.nextOffset || 0)
        hasMore = result.hasMore === true
        setCategorySeoProgress('Обработени категории: ' + processed + ' от ' + total + ' · създадени SEO полета: ' + generatedFields)
      }
      setCategorySeoNotice('Готово. Обработени категории: ' + processed + '. Създадени предложения за SEO полета: ' + generatedFields + '. Категории без нужда от промяна: ' + skipped + '.')
      setCategorySeoProgress('')
    } catch (err) {
      setCategorySeoError(err instanceof Error ? err.message : 'Възникна грешка при генерирането на SEO.')
    } finally {
      setCategorySeoLoading(false)
    }
  }

  const loadStaff = useCallback(async () => {
    if (!session || !profile || (profile.role !== 'owner' && (profile.role !== 'manager' || !profile.permissions.canManageStaff))) return
    setStaffLoading(true)
    setStaffError('')
    try {
      const response = await fetch('/api/manager/staff', {
        headers: { Authorization: 'Bearer ' + session.access_token },
        cache: 'no-store',
      })
      const result = await response.json() as { staff?: StaffMember[]; error?: string }
      if (!response.ok) throw new Error(result.error || 'Не успяхме да заредим служителите.')
      setStaffMembers(result.staff || [])
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Не успяхме да заредим служителите.')
    } finally {
      setStaffLoading(false)
    }
  }, [session, profile])

  useEffect(() => {
    if (profile?.role === 'owner' || profile?.role === 'manager' && profile?.permissions.canManageStaff) void loadStaff()
  }, [loadStaff, profile])

  const loadAnalytics = useCallback(async () => {
    if (!session || !profile || (profile.role !== 'owner' && (profile.role !== 'manager' || !profile.permissions.canViewAnalytics))) return
    setAnalyticsLoading(true)
    setAnalyticsError('')
    try {
      const { data, error: rpcError } = await managerApi.rpc('manager_site_analytics', { p_days: analyticsDays })
      if (rpcError) throw rpcError
      setAnalyticsData(data as AnalyticsReport)
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Не успяхме да заредим аналитиката.')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [session, profile, analyticsDays])

  useEffect(() => {
    if (activeTab === 'analytics' && (profile?.role === 'owner' || profile?.role === 'manager' && profile?.permissions.canViewAnalytics)) void loadAnalytics()
  }, [activeTab, profile, loadAnalytics])

  useEffect(() => {
    document.title = 'Florial Manager — вътрешна система'
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex,nofollow,noarchive')
  }, [])

  const selected = useMemo(() => submissions.find((item) => item.id === selectedId) || null, [submissions, selectedId])
  const savedImages = (selected?.payload?.images as IntakeImage[] | undefined) || []
  const removedSavedImageIdSet = new Set(removedSavedImageIds)
  const activeSavedImages = savedImages.filter((image) => !removedSavedImageIdSet.has(image.assetId || image.path))
  const pendingLibraryImages = selectedLibraryImages.filter((image) => !activeSavedImages.some((saved) => saved.assetId && saved.assetId === image.assetId))
  const selectedImageCount = activeSavedImages.length + pendingLibraryImages.length + files.length
  const selectedCategory = useMemo(() => plantCategories.find((item) => item._id === category) || null, [plantCategories, category])
  const categoryGroups = useMemo(() => {
    const groups = new Map<string, PlantCategory[]>()
    for (const item of plantCategories) {
      const groupName = item.parent?.name || 'Основни категории'
      groups.set(groupName, [...(groups.get(groupName) || []), item])
    }
    return Array.from(groups.entries())
  }, [plantCategories])

  const loadEvents = async (id: string, imagesOverride?: IntakeImage[]) => {
    setSelectedId(id)
    const selectedSubmission = submissions.find((item) => item.id === id)
    const imageItems = imagesOverride || ((Array.isArray(selectedSubmission?.payload?.reviewImages) ? selectedSubmission.payload.reviewImages : selectedSubmission?.payload?.images) as IntakeImage[] | undefined) || []
    setPreviewImages([])
    setPreviewLoading(imageItems.length > 0)
    if (imageItems.length) {
      const { data: signed, error: signedError } = await managerApi.images.createUrls(imageItems.map((item) => item.path))
      if (signedError) setError('Не успяхме да отворим снимките към заявката: ' + signedError.message)
      else {
        const mapped = (signed || []).map((item, index) => ({ name: imageItems[index]?.name || 'Снимка', url: item.signedUrl || '' })).filter((item) => item.url)
        setPreviewImages(mapped)
        if (mapped.length !== imageItems.length) setError('Част от снимките не е достъпна за преглед. Проверете файловете в хранилището.')
      }
    }
    setPreviewLoading(false)
    const { data } = await managerApi.from('catalog_submission_events')
      .select('id,event_type,from_status,to_status,note,created_at')
      .eq('submission_id', id).order('created_at', { ascending: false })
    setEvents(data || [])
  }

  const resetForm = () => {
    setSelectedId(null); setPreviewImages([]); setTitle(''); setLatinName(''); setProductType(''); setSku(''); setCategory(''); setReviewNote(''); setError(''); setNotice('')
    setDescription(''); setVariantName(''); setHeight(''); setPotVolume('')
    setPrice(''); setStockQuantity(''); setStockStatus('inStock'); setFiles([]); setSelectedLibraryImages([]); setRemovedSavedImageIds([])
  }

  const saveDraft = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!session || !profile) return
    const savedImages = activeSavedImages
    const newLibraryImages = pendingLibraryImages
    if (files.length + savedImages.length + newLibraryImages.length > 10) { setError('Максимумът е 10 снимки за една заявка.'); return }
    setSaving(true); setError(''); setNotice(''); setUploadProgress('Подготовка на снимките…')
    try {
      const payload = {
        name: title.trim(), latinName: latinName.trim(), productType, sku: sku.trim(),
        categoryId: category, categoryName: selectedCategory?.name || '', description: description.trim(),
        images: savedImages,
        saleVariants: [{
          _key: crypto.randomUUID(), name: variantName.trim(),
          saleHeightCm: height ? Number(height) : null,
          containerVolumeL: potVolume ? Number(potVolume) : null,
          priceEUR: price ? Number(price) : null,
          stockStatus, stockQuantity: stockQuantity.trim() ? Number(stockQuantity) : null,
        }],
      }
      let submissionId = selectedId
      if (!submissionId) {
        const { data, error: insertError } = await managerApi.from('catalog_submissions').insert({
          catalog: 'plants', operation: 'create', title: title.trim(), sku: sku.trim() || null,
          payload, status: 'draft', created_by: session.user.id,
        }).select('id').single()
        if (insertError) throw insertError
        submissionId = data.id
        setSelectedId(submissionId)
      }
      const currentImages = [...savedImages, ...newLibraryImages]
      const filesToUpload = [...files]
      for (let index = 0; index < filesToUpload.length; index += 1) {
        const file = filesToUpload[index]
        setUploadProgress(`Качване на снимка ${index + 1} от ${filesToUpload.length}…`)
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024) {
          throw new Error('Снимките трябва да са JPG, PNG или WebP и до 10 MB всяка.')
        }
        const { data: uploaded, error: uploadError } = await managerApi.images.upload(file)
        if (uploadError) throw uploadError
        if (!uploaded?.url || !uploaded?.id) throw new Error('Sanity не върна връзка към качената снимка.')
        currentImages.push({ path: uploaded.path, url: uploaded.url, assetId: uploaded.id, name: file.name, size: file.size, type: file.type })
        const partialPayload = { ...payload, images: currentImages }
        const { error: imageRecordError } = await managerApi.from('catalog_submissions').update({ payload: partialPayload, updated_at: new Date().toISOString() }).eq('id', submissionId)
        if (imageRecordError) throw new Error('Снимката е качена, но не успяхме да запазим връзката ѝ: ' + imageRecordError.message)
        const uploadedFiles = filesToUpload.slice(0, index + 1)
        setFiles((pending) => pending.filter((item) => !uploadedFiles.includes(item)))
      }
      setUploadProgress('Запазване на данните…')
      const finalPayload = { ...payload, images: currentImages }
      const { error: updateError } = await managerApi.from('catalog_submissions').update({
        title: title.trim(), sku: sku.trim() || null, payload: finalPayload, updated_at: new Date().toISOString(),
      }).eq('id', submissionId)
      if (updateError) throw updateError
      setFiles([])
      setSelectedLibraryImages([])
      setRemovedSavedImageIds([])
      setUploadProgress('')
      setNotice(`Черновата е запазена. Снимки в заявката: ${currentImages.length}.`)
      await loadSubmissions()
      if (submissionId) await loadEvents(submissionId, currentImages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Възникна грешка при запис.')
      await loadSubmissions()
    } finally { setUploadProgress(''); setSaving(false) }
  }

  const submitForReview = async () => {
    if (!session || !selectedId) { setError('Първо запазете черновата.'); return }
    if (files.length > 0 || selectedLibraryImages.length > 0 || removedSavedImageIds.length > 0) { setError('Първо запазете всички добавени или премахнати снимки в черновата.'); return }
    const selectedImagesValue = selected?.payload?.images
    const savedImages = Array.isArray(selectedImagesValue) ? selectedImagesValue as IntakeImage[] : []
    const quantity = Number(stockQuantity)
    const missing: string[] = []
    if (!title.trim()) missing.push('име на растението')
    if (!productType) missing.push('тип растение')
    if (!category || !plantCategories.some((item) => item._id === category)) missing.push('категория')
    if (savedImages.length === 0) missing.push('поне една качена фотография')
    if (!price.trim() || !Number.isFinite(Number(price)) || Number(price) <= 0) missing.push('положителна цена в EUR')
    if (!height.trim() || !Number.isFinite(Number(height)) || Number(height) <= 0) missing.push('положителна височина при продажба')
    if (!potVolume.trim() || !Number.isFinite(Number(potVolume)) || Number(potVolume) <= 0) missing.push('положителен обем на контейнера')
    if (!stockQuantity.trim() || !Number.isInteger(quantity) || quantity < 0) missing.push('цяло количество (0 или повече)')
    if (missing.length) { setError('Не може да изпратите заявката. Попълнете задължителните данни: ' + missing.join(', ') + '.'); return }
    const previousVariant = (selected?.payload?.saleVariants as Array<Record<string, unknown>> | undefined)?.[0] || {}
    const submissionPayload = {
      ...(selected?.payload || {}),
      name: title.trim(),
      latinName: latinName.trim(),
      productType,
      sku: sku.trim(),
      categoryId: category,
      categoryName: selectedCategory?.name || '',
      description: description.trim(),
      saleVariants: [{
        _key: String(previousVariant._key || crypto.randomUUID()),
        name: variantName.trim(),
        saleHeightCm: Number(height),
        containerVolumeL: Number(potVolume),
        priceEUR: Number(price),
        stockStatus,
        stockQuantity: quantity,
      }],
    }
    setSaving(true); setError(''); setNotice('')
    const { error: updateError } = await managerApi.from('catalog_submissions').update({
      title: title.trim(), sku: sku.trim() || null, payload: submissionPayload,
      status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', selectedId).in('status', ['draft', 'changes_requested'])
    if (updateError) {
      setError('Не успяхме да изпратим заявката: ' + updateError.message)
      setSaving(false); return
    }
    const response = await fetch('/api/manager/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({ submissionId: selectedId }),
    })
    const notification = await response.json().catch(() => ({})) as { error?: string }
    setNotice(response.ok ? 'Заявката е изпратена за проверка.' : 'Заявката е изпратена, но email известието не е потвърдено. ' + (notification.error || 'Проверете настройките на известията.'))
    await loadSubmissions()
    setSaving(false)
  }

  const approve = async (id: string) => {
    if (!profile || (profile.role !== 'owner' && !profile.permissions.canApprovePlantSubmission)) return
    const submission = submissions.find((item) => item.id === id)
    const publication = submission?.payload?.publication
    if (!publication || typeof publication !== 'object') {
      setError('Първо подгответе картата на растението, проверете данните и запазете финалната версия. След това можете да одобрите заявката.')
      return
    }
    if (!window.confirm('Потвърждавате ли одобрението на вече подготвената и запазена карта на растението? След това ще можете отделно да публикувате растението в магазина.')) return
    const { error: approveError } = await managerApi.from('catalog_submissions').update({
      status: 'approved', reviewed_by: profile.user_id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', id).in('status', ['submitted', 'in_review'])
    if (approveError) setError(approveError.message)
    else { setNotice('Заявката е одобрена. Отворете я отново, проверете данните за продукта и публикувайте растението отделно.'); await loadSubmissions() }
  }

  const rejectSubmission = async (id: string) => {
    if (!profile || (profile.role !== 'owner' && !profile.permissions.canReviewPlantSubmissions)) return
    if (reviewNote.trim().length < 3) { setError('Добавете причина за отказ (поне 3 символа).'); return }
    if (!window.confirm('Сигурни ли сте, че искате да отхвърлите тази заявка?')) return
    const { error: rejectError } = await managerApi.from('catalog_submissions').update({
      status: 'rejected', review_note: reviewNote.trim(), reviewed_by: profile.user_id,
      reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', id).in('status', ['submitted', 'in_review'])
    if (rejectError) setError('Не успяхме да отхвърлим заявката: ' + rejectError.message)
    else { setReviewNote(''); setNotice('Заявката е отхвърлена.'); await loadSubmissions(); await loadEvents(id) }
  }

  const requestChanges = async (id: string) => {
    if (reviewNote.trim().length < 3) { setError('Добавете коментар за корекциите (поне 3 символа).'); return }
    const { error: rpcError } = await managerApi.rpc('manager_request_catalog_changes', {
      submission_id: id, request_note: reviewNote.trim(),
    })
    if (rpcError) setError(rpcError.message)
    else { setReviewNote(''); setNotice('Заявката е върната за корекция.'); await loadSubmissions(); await loadEvents(id) }
  }

  const staffRequest = async (method: 'POST' | 'PATCH', body: Record<string, unknown>) => {
    if (!session) throw new Error('Необходима е активна сесия.')
    const response = await fetch('/api/manager/staff', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + session.access_token,
      },
      body: JSON.stringify(body),
    })
    const result = await response.json().catch(() => ({})) as { error?: string }
    if (!response.ok) throw new Error(result.error || 'Не успяхме да изпълним действието.')
  }

  const createStaff = async (event: FormEvent) => {
    event.preventDefault()
    setStaffSaving(true); setStaffError(''); setStaffNotice('')
    try {
      await staffRequest('POST', {
        action: 'create',
        email: newStaffEmail,
        displayName: newStaffName,
        role: newStaffRole,
        password: newStaffPassword,
        permissions: profile?.role === 'owner' || profile?.role === 'manager' && profile.permissions.canDelegatePermissions ? newStaffPermissions : undefined,
      })
      setNewStaffEmail(''); setNewStaffName(''); setNewStaffPassword(''); setNewStaffPermissions({ ...emptyPermissions })
      setStaffNotice('Служителят е създаден. Предайте му email адреса и зададената от вас парола.')
      await loadStaff()
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Не успяхме да създадем служителя.')
    } finally {
      setStaffSaving(false)
    }
  }

  const updateStaff = async (userId: string, body: Record<string, unknown>, successMessage: string) => {
    setStaffSaving(true); setStaffError(''); setStaffNotice('')
    try {
      await staffRequest('PATCH', { userId, ...body })
      setStaffNotice(successMessage)
      await loadStaff()
      return true
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Не успяхме да обновим служителя.')
      return false
    } finally {
      setStaffSaving(false)
    }
  }

  const saveStaffPassword = async (event: FormEvent, userId: string) => {
    event.preventDefault()
    const saved = await updateStaff(userId, { action: 'set_password', password: replacementPassword }, 'Паролата на служителя е обновена.')
    if (saved) {
      setPasswordTarget(null)
      setReplacementPassword('')
    }
  }

  const approvePlantChange = async (id: string) => {
    if (!session || !profile || (profile.role !== 'owner' && (profile.role !== 'manager' || !profile.permissions.canApprovePlantSubmission))) return
    if (!window.confirm('Одобрявате ли промяната? След това тя ще бъде публикувана отделно в каталога.')) return
    try {
      const response = await fetch('/api/manager/plant-catalog', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ action: 'approve', submissionId: id }) })
      const result = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Не успяхме да приложим промяната.')
      setNotice('Промяната е одобрена и очаква отделна публикация.')
      await loadSubmissions(); await loadEvents(id)
    } catch (err) { setError(err instanceof Error ? err.message : 'Не успяхме да приложим промяната.') }
  }

  const publishPlantChange = async (id: string) => {
    if (!session || !profile || (profile.role !== 'owner' && (profile.role !== 'manager' || !profile.permissions.canPublishPlant))) return
    if (!window.confirm('Публикувате ли одобрената промяна в каталога на растенията?')) return
    try {
      const response = await fetch('/api/manager/plant-catalog', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ action: 'publish', submissionId: id }) })
      const result = await response.json().catch(() => ({})) as { error?: string; alreadyApplied?: boolean }
      if (!response.ok) throw new Error(result.error || 'Не успяхме да публикуваме промяната.')
      setNotice(result.alreadyApplied ? 'Публикацията е потвърдена — промяната вече присъства в каталога.' : 'Промяната е публикувана в каталога на растенията.')
      await loadSubmissions(); await loadEvents(id)
    } catch (err) { setError(err instanceof Error ? err.message : 'Не успяхме да публикуваме промяната.') }
  }

  const signOut = async () => { await managerApi.auth.signOut(); resetForm(); setProfile(null); setSession(null) }

  if (loading) return <div className="min-h-screen bg-[#f5f6ef] grid place-items-center text-stone-600">Зареждане на Florial Manager…</div>

  if (!session || !profile) return (
    <main className="min-h-screen bg-[#f5f6ef] px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm border border-stone-200">
        <div className="text-xs font-bold tracking-[.24em] text-lime-800">FLORIAL / INTERNAL</div>
        {bootstrapAvailable ? <>
          <h1 className="mt-3 text-3xl font-semibold text-stone-900">Първоначална настройка</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">Създайте първия собственик на Florial Manager. Тази форма се показва само докато в D1 няма owner акаунт.</p>
          {!bootstrapConfigured && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Първо добавете secret MANAGER_BOOTSTRAP_SECRET в Cloudflare Pages → Settings → Variables and Secrets (Production), след това презаредете тази страница.</p>}
          <form className="mt-7 space-y-4" onSubmit={async (event) => {
            event.preventDefault(); setBootstrapError(''); setBootstrapSaving(true)
            try {
              const response = await fetch('/api/manager/auth/bootstrap', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Florial-Bootstrap-Secret': bootstrapSecret }, body: JSON.stringify({ displayName: ownerName, email, password }) })
              const responseText = await response.text()
              let result: { error?: string; requestId?: string; stage?: string } = {}
              try { result = JSON.parse(responseText) as typeof result } catch { /* A non-JSON response is reported by HTTP status below. */ }
              if (!response.ok) {
                const stageLabels: Record<string, string> = {
                  configuration: 'проверка настроек',
                  origin_check: 'проверка источника запроса',
                  owner_lookup: 'проверка существующего владельца',
                  request_body: 'прочитане на формуляра',
                  password_hash: 'подготовка на паролата',
                  owner_insert: 'запись владельца в D1',
                }
                const details = result.error || `Сервер вернул HTTP ${response.status} без подробного ответа.`
                const diagnostic = [
                  result.stage ? `етап: ${stageLabels[result.stage] || result.stage}` : '',
                  result.requestId ? `код проверки: ${result.requestId}` : '',
                ].filter(Boolean).join('; ')
                throw new Error(diagnostic ? `${details} (${diagnostic})` : details)
              }
              const login = await managerApi.auth.signInWithPassword({ email, password })
              if (login.error) throw new Error('Профилът на собственика е създаден. Влезте с посочения имейл и парола.')
              setBootstrapAvailable(false)
            } catch (err) {
              setBootstrapError(err instanceof TypeError ? 'Не успяхме да се свържем със сървъра. Проверете връзката и обновете страницата.' : err instanceof Error ? err.message : 'Не успяхме да създадем профил на собственик.')
            }
            finally { setBootstrapSaving(false) }
          }}>
            <label className={labelClass}>Име на собственика<input className={inputClass} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} autoComplete="name" required /></label>
            <label className={labelClass}>Email<input className={inputClass} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className={labelClass}>Парола за достъп<input className={inputClass} type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            <p className="-mt-3 text-xs text-stone-500">Паролата трябва да съдържа между 12 и 128 символа.</p>
            <label className={labelClass}>Еднократен секрет за първоначална настройка<input className={inputClass} type="password" autoComplete="off" value={bootstrapSecret} onChange={(e) => setBootstrapSecret(e.target.value)} required /></label>
            {bootstrapError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{bootstrapError}</p>}
            <button className="w-full rounded-xl bg-lime-800 px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={bootstrapSaving || !bootstrapConfigured || password.length < 12}>{bootstrapSaving ? 'Създаване…' : 'Създай профил на собственик'}</button>
          </form>
        </> : <>
          <h1 className="mt-3 text-3xl font-semibold text-stone-900">Вход за служители</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">Затворен достъп до системата за приемане на растения. Профилът се създава от собственика.</p>
          <form className="mt-7 space-y-4" onSubmit={async (event) => {
            event.preventDefault(); setError(''); setLoading(true)
            const { error: loginError } = await managerApi.auth.signInWithPassword({ email, password })
            if (loginError) { setError('Невалиден имейл или парола.'); setLoading(false) }
          }}>
            <label className={labelClass}>Имейл<input className={inputClass} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className={labelClass}>Парола<input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button className="w-full rounded-xl bg-lime-800 px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={loading}>Вход</button>
          </form>
        </>}
      </section>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#f5f6ef] text-stone-800">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div><div className="text-xs font-bold tracking-[.22em] text-lime-800">FLORIAL / INTERNAL</div><div className="text-xl font-semibold">Приемане на растения</div></div>
          <div className="text-right text-sm"><div className="font-semibold">{profile.display_name || session.user.email}</div><div className="text-stone-500">{profile.role === 'owner' ? 'Собственик' : profile.role === 'manager' ? 'Мениджър' : 'Служител'}</div></div>
          <button onClick={signOut} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold">Изход</button>
        </div>
      </header>
      <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pt-4" aria-label="Раздели на Manager">
        <button onClick={() => setActiveTab('submissions')} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'submissions' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>Растения</button>
        {(profile.role === 'owner' || profile.role === 'manager' && (profile.permissions.canViewServiceLeads || profile.permissions.canManageServiceLeads)) && <button onClick={() => setActiveTab('serviceLeads')} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'serviceLeads' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>Заявки за услуги</button>}
        {(profile.role === 'owner' || profile.role === 'manager' && (profile.permissions.canViewOrders || profile.permissions.canEditOrders || profile.permissions.canDeleteTestOrders)) && <button onClick={() => { setActiveTab('orders') }} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'orders' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>Поръчки</button>}
        {(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canManageStaff) && <button onClick={() => { setActiveTab('staff'); setStaffNotice(''); setStaffError(''); void loadStaff() }} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'staff' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>Служители</button>}
        {(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canViewAnalytics) && <button onClick={() => { setActiveTab('analytics'); setAnalyticsError('') }} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'analytics' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>Аналитика</button>}
        {(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canManageCategorySeo) && <button onClick={() => { setActiveTab('categories'); setCategorySeoError(''); setCategorySeoNotice(''); setCategorySeoProgress('') }} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'categories' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>Категории</button>}
        {profile.role === 'owner' && <button onClick={() => setActiveTab('productsSeo')} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'productsSeo' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>SEO на продуктите</button>}
      </nav>
      <div className={'mx-auto grid max-w-6xl gap-6 px-4 py-6 ' + (selected ? 'max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px]' : 'max-w-4xl') + (activeTab === 'submissions' ? '' : ' hidden')}>
        <section className="space-y-5">
          {profile.role === 'seller' && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {profile.permissions.canCreatePlant && <button type="button" onClick={() => { resetForm(); setSellerWorkspace('create'); setImageLibraryOpen(false) }} className={'rounded-2xl border p-5 text-left shadow-sm transition ' + (sellerWorkspace === 'create' ? 'border-lime-700 bg-lime-50' : 'border-stone-200 bg-white hover:border-lime-600')}><span className="block text-base font-semibold">Добавяне на ново растение</span><span className="mt-1 block text-sm text-stone-600">Създаване на продуктова карта</span></button>}
            {profile.permissions.canAddPlantVariant && <button type="button" onClick={() => { setSellerWorkspace('variant'); setSelectedId(null); setImageLibraryOpen(false) }} className={'rounded-2xl border p-5 text-left shadow-sm transition ' + (sellerWorkspace === 'variant' ? 'border-lime-700 bg-lime-50' : 'border-stone-200 bg-white hover:border-lime-600')}><span className="block text-base font-semibold">Добавяне на размер на растение</span><span className="mt-1 block text-sm text-stone-600">Добавяне на нов размер или вариант</span></button>}
            {profile.permissions.canEditPlantPrice && <button type="button" onClick={() => { setSellerWorkspace('price'); setSelectedId(null); setImageLibraryOpen(false) }} className={'rounded-2xl border p-5 text-left shadow-sm transition ' + (sellerWorkspace === 'price' ? 'border-lime-700 bg-lime-50' : 'border-stone-200 bg-white hover:border-lime-600')}><span className="block text-base font-semibold">Промяна на цена на растение</span><span className="mt-1 block text-sm text-stone-600">Изпращане на новата цена за одобрение</span></button>}
            {profile.permissions.canEditPlantStock && <button type="button" onClick={() => { setSellerWorkspace('stock'); setSelectedId(null); setImageLibraryOpen(false) }} className={'rounded-2xl border p-5 text-left shadow-sm transition ' + (sellerWorkspace === 'stock' ? 'border-lime-700 bg-lime-50' : 'border-stone-200 bg-white hover:border-lime-600')}><span className="block text-base font-semibold">Промяна на количеството на растенията</span><span className="mt-1 block text-sm text-stone-600">Директно обновяване на наличностите</span></button>}
          </div>}
          {profile.role !== 'seller' && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" disabled={profile.role === 'manager' && !(profile.permissions.canReviewPlantSubmissions || profile.permissions.canApprovePlantSubmission || profile.permissions.canPublishPlant || profile.permissions.canEditPlantCard)} onClick={() => { setSellerWorkspace('requests'); setShowCreateForm(false); setSelectedId(null) }} className={'rounded-2xl border p-4 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ' + (sellerWorkspace === 'requests' ? 'border-lime-700 bg-lime-50' : 'border-stone-200 bg-white hover:border-lime-600')}><span className="block font-semibold">Заявки на растения</span><span className="mt-1 block text-sm text-stone-600">{profile.role === 'manager' && !(profile.permissions.canReviewPlantSubmissions || profile.permissions.canApprovePlantSubmission || profile.permissions.canPublishPlant || profile.permissions.canEditPlantCard) ? 'Достъпът се предоставя от собственика.' : 'Преглед и обработка на заявките от продавачите.'}</span></button>
            {(profile.role === 'owner' || profile.permissions.canCreatePlant) && <button type="button" onClick={() => { resetForm(); setSellerWorkspace('create'); setShowCreateForm(true); setSelectedId(null) }} className={'rounded-2xl border p-4 text-left shadow-sm transition ' + (sellerWorkspace === 'create' ? 'border-lime-700 bg-lime-50' : 'border-stone-200 bg-white hover:border-lime-600')}><span className="block font-semibold">Добавяне на ново растение</span><span className="mt-1 block text-sm text-stone-600">Създаване на нова продуктова карта.</span></button>}
            {(profile.role === 'owner' || profile.permissions.canAddPlantVariant) && <button type="button" onClick={() => { setSellerWorkspace('variant'); setSelectedId(null); setShowCreateForm(false) }} className={'rounded-2xl border p-4 text-left shadow-sm transition ' + (sellerWorkspace === 'variant' ? 'border-lime-700 bg-lime-50' : 'border-stone-200 bg-white hover:border-lime-600')}><span className="block font-semibold">Добавяне на височина</span><span className="mt-1 block text-sm text-stone-600">Избор на растение и добавяне на нов размер.</span></button>}
            {(profile.role === 'owner' || profile.permissions.canEditPlantPrice) && <button type="button" onClick={() => { setSellerWorkspace('price'); setSelectedId(null); setShowCreateForm(false) }} className={'rounded-2xl border p-4 text-left shadow-sm transition ' + (sellerWorkspace === 'price' ? 'border-lime-700 bg-lime-50' : 'border-stone-200 bg-white hover:border-lime-600')}><span className="block font-semibold">Промяна на цена на растение</span><span className="mt-1 block text-sm text-stone-600">Избор на растение и конкретен вариант.</span></button>}
            {(profile.role === 'owner' || profile.permissions.canEditPlantStock) && <button type="button" onClick={() => { setSellerWorkspace('stock'); setSelectedId(null); setShowCreateForm(false) }} className={'rounded-2xl border p-4 text-left shadow-sm transition ' + (sellerWorkspace === 'stock' ? 'border-lime-700 bg-lime-50' : 'border-stone-200 bg-white hover:border-lime-600')}><span className="block font-semibold">Промяна на количеството на растенията</span><span className="mt-1 block text-sm text-stone-600">Директно обновяване на наличностите без одобрение.</span></button>}
          </div>}
          {(profile.role === 'seller' || sellerWorkspace === 'requests') && <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Заявки на растения</h1><p className="mt-1 text-sm text-stone-600">Всички заявки са в един списък. Изберете заявка, за да видите подробностите и наличните действия.</p></div>{profile.role !== 'seller' && <button type="button" onClick={() => setSellerWorkspace('home')} className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold">Назад към действията</button>}</div>}
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {notice && <div className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}
          {(profile.role === 'owner' || profile.role === 'manager' && (profile.permissions.canEditPlantCard || profile.permissions.canPublishPlant)) && selected && selected.operation === 'create' && ['submitted', 'in_review', 'approved', 'publish_failed'].includes(selected.status) && (
            <PlantPublicationEditor
              submission={selected}
              reviewMode={['submitted', 'in_review'].includes(selected.status)}
              categories={plantCategories}
              images={previewImages}
              imagesLoading={previewLoading}
              publishError={selected.publish_error}
              canPublish={profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canPublishPlant}
              canEdit={profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canEditPlantCard}
              accessToken={session.access_token}
              onSaved={async (imagesOverride) => {
                await loadSubmissions()
                if (selectedId) await loadEvents(selectedId, imagesOverride)
              }}
              onPublished={async () => {
                await loadSubmissions()
                if (selectedId) await loadEvents(selectedId)
                setNotice('Растението е публикувано в каталога на Florial.')
              }}
            />
          )}
          {(profile.role === 'seller' ? sellerWorkspace === 'variant' && profile.permissions.canAddPlantVariant : sellerWorkspace === 'variant' && (profile.role === 'owner' || profile.permissions.canAddPlantVariant)) && <PlantCatalogChangeForm accessToken={session.access_token} canAddVariant={true} canEditPrice={false} initialMode="variant" categories={plantCategories} onSubmitted={loadSubmissions} onBack={() => setSellerWorkspace('home')} />}
          {(profile.role === 'seller' ? sellerWorkspace === 'price' && profile.permissions.canEditPlantPrice : sellerWorkspace === 'price' && (profile.role === 'owner' || profile.permissions.canEditPlantPrice)) && <PlantCatalogChangeForm accessToken={session.access_token} canAddVariant={false} canEditPrice={true} initialMode="price" categories={plantCategories} onSubmitted={loadSubmissions} onBack={() => setSellerWorkspace('home')} />}
          {(profile.role === 'owner' || profile.permissions.canEditPlantStock) && sellerWorkspace === 'stock' && <PlantStockChangeForm accessToken={session.access_token} categories={plantCategories} onBack={() => setSellerWorkspace('home')} />}
          {(profile.role === 'seller' ? profile.permissions.canCreatePlant && sellerWorkspace === 'create' : (profile.role === 'owner' || profile.permissions.canCreatePlant) && showCreateForm) && (!selected || ['draft', 'changes_requested'].includes(selected.status)) && (
            <form onSubmit={saveDraft} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{selectedId ? 'Редактиране на чернова' : 'Нова приемка на растение'}</h2>
              <p className="mt-2 text-sm text-stone-600">Полетата със * са задължителни преди изпращане за проверка. Можете да запазите чернова и да ги попълните по-късно.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>Име на растението (BG) *<input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="напр. Маслина" /></label>
                <label className={labelClass}>Латинско име<input className={inputClass} value={latinName} onChange={(e) => setLatinName(e.target.value)} placeholder="Olea europaea" /></label>
                <label className={labelClass}>Артикулен код / SKU<input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} /></label>
                <label className={labelClass}>Тип на растението *<select className={inputClass} value={productType} onChange={(e) => setProductType(e.target.value)}><option value="">Изберете тип растение</option>{sellerPlantTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className={labelClass}>Категория на растението *<select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} disabled={categoriesLoading || plantCategories.length === 0}><option value="">{categoriesLoading ? 'Зареждане на категориите…' : 'Изберете категория'}</option>{categoryGroups.map(([groupName, items]) => <optgroup key={groupName} label={groupName}>{items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</optgroup>)}</select>{categoriesError && <span className="mt-1 block text-xs font-normal text-red-700">{categoriesError}</span>}</label>
                <label className={labelClass}>Вариант / размер<input className={inputClass} value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="C 25, 160–180 cm" /></label>
                <label className={labelClass}>Височина при продажба (cm) *<input className={inputClass} type="number" min="0.1" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} /></label>
                <label className={labelClass}>Обем на контейнера (L) *<input className={inputClass} type="number" min="0.1" step="0.1" value={potVolume} onChange={(e) => setPotVolume(e.target.value)} /></label>
                <label className={labelClass}>Продажна цена (EUR с ДДС) *<input className={inputClass} type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
                <label className={labelClass}>Количество *<input className={inputClass} type="number" min="0" step="1" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} /></label>
                <label className={labelClass}>Наличност<select className={inputClass} value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}><option value="inStock">Наличен</option><option value="outOfStock">Изчерпан</option><option value="onRequest">По заявка</option></select></label>
              </div>
              <label className={labelClass + ' mt-4'}>Описание<textarea className={inputClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <label className={labelClass}>Добави снимки от телефона или компютъра<input className={inputClass} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={saving || selectedImageCount >= 10} onChange={(e) => { const chosen = Array.from(e.currentTarget.files || []); setFiles((current) => [...current, ...chosen].slice(0, Math.max(0, 10 - activeSavedImages.length - pendingLibraryImages.length))); e.currentTarget.value = '' }} /></label>
                <span className="rounded-full bg-lime-50 px-3 py-2 text-sm font-semibold text-lime-900">Избрани снимки: {selectedImageCount} / 10</span>
              </div>
              <p className="mt-1 text-xs font-normal text-stone-500">Снимките от библиотеката и устройството се показват заедно. Проверете миниатюрите и премахнете ненужните с кръстчето.</p>
              <button type="button" onClick={() => setImageLibraryOpen((open) => !open)} disabled={saving || selectedImageCount >= 10} className="mt-3 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-50">{imageLibraryOpen ? 'Затвори библиотеката' : 'Избери от галереята Florial'}</button>
              {imageLibraryOpen && <PlantImageLibrary
                selectedAssetIds={pendingLibraryImages.map((image) => image.assetId || '')}
                usedAssetIds={activeSavedImages.map((image) => image.assetId).filter(Boolean) as string[]}
                maxSelectable={Math.max(0, 10 - activeSavedImages.length - files.length)}
                disabled={saving}
                onToggle={(image) => setSelectedLibraryImages((current) => {
                  const without = current.filter((item) => item.assetId !== image.assetId)
                  if (current.some((item) => item.assetId === image.assetId)) return without
                  return activeSavedImages.length + without.length + files.length < 10 ? [...without, image] : current
                })}
              />}
              {selectedImageCount > 0 && <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-stone-800">Снимки към заявката</h3><span className="text-xs text-stone-500">{selectedImageCount} от 10</span></div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {savedImages.map((image, index) => {
                    const imageKey = image.assetId || image.path
                    if (removedSavedImageIdSet.has(imageKey)) return null
                    const url = image.url || previewImages[index]?.url || ''
                    return <div key={'saved-' + imageKey} className="min-w-0">
                      <div className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                        {url ? <img src={url} alt={image.name || 'Снимка'} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-stone-500">Снимка</div>}
                        <button type="button" title="Премахни снимката" aria-label="Премахни снимката" disabled={saving} onClick={() => setRemovedSavedImageIds((current) => [...current, imageKey])} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-lg font-bold leading-none text-red-700 shadow">×</button>
                      </div><p className="mt-1 truncate text-center text-[11px] text-stone-500">В черновата</p>
                    </div>
                  })}
                  {pendingLibraryImages.map((image) => <div key={'library-' + image.assetId} className="min-w-0">
                    <div className="relative aspect-square overflow-hidden rounded-xl border border-lime-200 bg-stone-100"><img src={image.url} alt={image.name} className="h-full w-full object-cover" /><button type="button" title="Премахни снимката" aria-label="Премахни снимката" disabled={saving} onClick={() => setSelectedLibraryImages((current) => current.filter((item) => item.assetId !== image.assetId))} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-lg font-bold leading-none text-red-700 shadow">×</button></div>
                    <p className="mt-1 truncate text-center text-[11px] text-stone-500">Галерея Florial</p>
                  </div>)}
                  {filePreviews.map((preview, index) => <div key={'device-' + preview.file.name + '-' + index} className="min-w-0">
                    <div className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100"><img src={preview.url} alt={preview.file.name} className="h-full w-full object-cover" /><button type="button" title="Премахни снимката" aria-label="Премахни снимката" disabled={saving} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-lg font-bold leading-none text-red-700 shadow">×</button></div>
                    <p className="mt-1 truncate text-center text-[11px] text-stone-500" title={preview.file.name}>От устройството</p>
                  </div>)}
                </div>
              </div>}
              {uploadProgress && <p role="status" className="mt-3 rounded-lg bg-lime-50 p-3 text-sm text-lime-900">{uploadProgress}</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                <button disabled={saving} className="rounded-xl bg-stone-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Запазване…' : 'Запази черновата'}</button>
                {selectedId && <button type="button" disabled={saving || files.length > 0 || selectedLibraryImages.length > 0 || removedSavedImageIds.length > 0} onClick={submitForReview} className="rounded-xl bg-lime-800 px-5 py-3 font-semibold text-white disabled:opacity-50">Изпрати на проверка</button>}
              </div>
            </form>
          )}
          {(profile.role === 'seller' ? sellerWorkspace !== 'home' : sellerWorkspace === 'requests') && <div className="space-y-3">
            {submissions.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">Все още няма заявки.</div>}
            {submissions.map((item) => (
              <article key={item.id} className={'rounded-2xl border bg-white p-4 ' + (selectedId === item.id ? 'border-lime-700' : 'border-stone-200')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button onClick={() => {
                    setSelectedId(item.id); setSelectedLibraryImages([]); setRemovedSavedImageIds([]); setFiles([]); setTitle(String(item.payload.name || item.title)); setLatinName(String(item.payload.latinName || '')); setProductType(String(item.payload.productType || ''))
                    setSku(item.sku || ''); setCategory(String(item.payload.categoryId || plantCategories.find((candidate) => candidate.name.toLocaleLowerCase() === String(item.payload.categoryName || '').toLocaleLowerCase())?._id || '')); setDescription(String(item.payload.description || ''))
                    const variant = (item.payload.saleVariants as Array<Record<string, unknown>> | undefined)?.[0]
                    setVariantName(String(variant?.name || '')); setHeight(variant?.saleHeightCm ? String(variant.saleHeightCm) : '')
                    setPotVolume(variant?.containerVolumeL ? String(variant.containerVolumeL) : '')
                    setPrice(variant?.priceEUR ? String(variant.priceEUR) : '')
                    setStockQuantity(variant?.stockQuantity == null ? '' : String(variant.stockQuantity)); setStockStatus(String(variant?.stockStatus || 'inStock'))
                    void loadEvents(item.id)
                  }} className="text-left"><div className="font-semibold">{item.title || 'Без име'}</div><div className="mt-1 text-xs text-stone-500">SKU: {item.sku || '—'} · {new Date(item.updated_at).toLocaleString('bg-BG')}</div></button>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">{statusLabels[item.status] || item.status}</span>
                </div>
                {item.review_note && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Коментар: {item.review_note}</p>}
                {item.operation === 'update' && <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm text-stone-700">
                  <strong>Промяна за одобрение:</strong>{' '}
                  {item.payload.changeType === 'addVariant'
                    ? <>Добавяне на вариант <strong>{String((item.payload.proposedVariant as Record<string, unknown> | undefined)?.name || '—')}</strong>; височина: {String((item.payload.proposedVariant as Record<string, unknown> | undefined)?.saleHeightCm ?? '—')} см; контейнер: {String((item.payload.proposedVariant as Record<string, unknown> | undefined)?.containerVolumeL ?? '—')} л; цена: {typeof (item.payload.proposedVariant as Record<string, unknown> | undefined)?.priceEUR === 'number' ? Number((item.payload.proposedVariant as Record<string, unknown>).priceEUR).toFixed(2) + ' €' : 'по запитване'}.</>
                    : <>Промяна на цена за вариант <strong>{String(item.payload.variantName || '—')}</strong>: {typeof item.payload.oldPriceEUR === 'number' ? item.payload.oldPriceEUR.toFixed(2) + ' €' : 'не е зададена'} → <strong>{typeof item.payload.newPriceEUR === 'number' ? item.payload.newPriceEUR.toFixed(2) + ' €' : '—'}</strong>.</>}
                </div>}
                {(profile.role === 'owner' || profile.role === 'manager' && (profile.permissions.canApprovePlantSubmission || profile.permissions.canReviewPlantSubmissions)) && item.operation === 'update' && ['submitted', 'in_review'].includes(item.status) && <div className="mt-3 flex flex-wrap gap-2">{(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canApprovePlantSubmission) && <button onClick={() => void approvePlantChange(item.id)} className="rounded-lg bg-lime-800 px-4 py-2 text-sm font-semibold text-white">Одобри промяната</button>}{(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canReviewPlantSubmissions) && <button onClick={() => void rejectSubmission(item.id)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">Отхвърли</button>}</div>}
                {(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canPublishPlant) && item.operation === 'update' && ['approved', 'publish_failed'].includes(item.status) && <div className="mt-3"><button onClick={() => void publishPlantChange(item.id)} className="rounded-lg bg-lime-800 px-4 py-2 text-sm font-semibold text-white">Публикувай промяната</button></div>}
                {(profile.role === 'owner' || profile.role === 'manager' && (profile.permissions.canApprovePlantSubmission || profile.permissions.canReviewPlantSubmissions)) && item.operation === 'create' && ['submitted', 'in_review'].includes(item.status) && <div className="mt-3 flex flex-wrap gap-2">{(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canApprovePlantSubmission) && <button disabled={!item.payload.publication || typeof item.payload.publication !== 'object'} title={!item.payload.publication ? 'Първо подгответе и запазете финалната карта.' : 'Одобрете подготвената карта'} onClick={() => void approve(item.id)} className="rounded-lg bg-lime-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Одобри</button>}{(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canReviewPlantSubmissions) && <button onClick={() => void rejectSubmission(item.id)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">Отхвърли</button>}</div>}
                {(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canReviewPlantSubmissions) && ['submitted', 'in_review'].includes(item.status) && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input className={inputClass + ' mt-0'} placeholder="Коментар за корекции" value={selectedId === item.id ? reviewNote : ''} onChange={(e) => { setSelectedId(item.id); setReviewNote(e.target.value) }} /><button onClick={() => void requestChanges(item.id)} className="shrink-0 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold">Върни за корекция</button></div>}
              </article>
            ))}
          </div>}
        </section>
        <aside className={selected ? 'h-fit rounded-2xl border border-stone-200 bg-white p-5' : 'hidden'}>
          <SubmissionDetails submission={selected} images={previewImages} loading={previewLoading} />
          <h2 className="mt-6 border-t border-stone-100 pt-4 font-semibold">История на действията</h2>
          <ol className="mt-4 space-y-4">
            {events.map((event) => <li key={event.id} className="border-l-2 border-lime-700 pl-3"><div className="text-sm font-semibold">{event.to_status ? statusLabels[event.to_status] || event.event_type : event.event_type}</div><div className="text-xs text-stone-500">{new Date(event.created_at).toLocaleString('bg-BG')}</div>{event.note && <p className="mt-1 text-sm">{event.note}</p>}</li>)}
          </ol>
          <p className="mt-6 border-t border-stone-100 pt-4 text-xs leading-5 text-stone-500">Снимките се записват в Sanity Assets, а черновите и историята се съхраняват в D1. След одобрение упълномощен служител публикува растението отделно в каталога.</p>
        </aside>
      </div>
      {activeTab === 'productsSeo' && profile.role === 'owner' && <ProductSeoManager />}
      <section className={activeTab === 'categories' && (profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canManageCategorySeo) ? 'mx-auto max-w-6xl px-4 py-6' : 'hidden'}>
        <div className="max-w-3xl space-y-5">
          <div>
            <h1 className="text-2xl font-semibold">Работа с категории</h1>
            <p className="mt-1 text-sm leading-6 text-stone-600">Генериране на предложения за H1, Meta Title и Meta Description за категориите в каталозите за поливно оборудване и растения на български, руски и английски език.</p>
          </div>
          {categorySeoError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{categorySeoError}</div>}
          {categorySeoNotice && <div role="status" className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{categorySeoNotice}</div>}
          {categorySeoProgress && <div className="rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700">{categorySeoProgress}</div>}
          <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">1. Генериране за всички категории</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Създава нови предложения за всички SEO полета на всички категории. Съществуващите одобрени стойности на сайта се запазват; обновяват се само черновите-предложения.</p>
            <button type="button" disabled={categorySeoLoading} onClick={() => void runCategorySeo('all')} className="mt-4 rounded-xl bg-lime-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{categorySeoLoading ? 'Обработване…' : 'Генерирай SEO за всички категории'}</button>
          </article>
          <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">2. Попълване на липсващи SEO полета</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Проверява H1, Meta Title и Meta Description поотделно за всеки език. Генерира само празните полета и не заменя вече попълнени одобрени стойности или съществуващи предложения.</p>
            <button type="button" disabled={categorySeoLoading} onClick={() => void runCategorySeo('missing')} className="mt-4 rounded-xl border border-lime-800 px-4 py-3 text-sm font-semibold text-lime-900 disabled:opacity-50">{categorySeoLoading ? 'Обработване…' : 'Попълни липсващите SEO полета'}</button>
          </article>
          <p className="text-xs leading-5 text-stone-500">Генерираните стойности се записват като предложения за проверка в Sanity. Те не стават активни SEO стойности автоматично.</p>
        </div>
      </section>
      <section className={activeTab === 'serviceLeads' && (profile.role === 'owner' || profile.role === 'manager' && (profile.permissions.canViewServiceLeads || profile.permissions.canManageServiceLeads)) ? 'mx-auto max-w-6xl px-4 py-6' : 'hidden'}>
        {(profile.role === 'owner' || profile.role === 'manager' && (profile.permissions.canViewServiceLeads || profile.permissions.canManageServiceLeads)) && <ServiceLeadsManager canManage={profile.role === 'owner' || profile.permissions.canManageServiceLeads} />}
      </section>
      <section className={activeTab === 'orders' && (profile.role === 'owner' || profile.role === 'manager' && (profile.permissions.canViewOrders || profile.permissions.canEditOrders || profile.permissions.canDeleteTestOrders)) ? 'mx-auto max-w-6xl px-4 py-6' : 'hidden'}>
        {(profile.role === 'owner' || profile.role === 'manager' && (profile.permissions.canViewOrders || profile.permissions.canEditOrders || profile.permissions.canDeleteTestOrders)) && <OrdersManager canEdit={profile.role === 'owner' || profile.permissions.canEditOrders} canDeleteTestOrders={profile.role === 'owner' || profile.permissions.canDeleteTestOrders} />}
      </section>
      <section className={activeTab === 'analytics' && (profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canViewAnalytics) ? 'mx-auto max-w-6xl px-4 py-6' : 'hidden'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-semibold">Аналитика на сайта</h1><p className="mt-1 text-sm text-stone-600">Анонимни обобщени събития по българско местно време.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Период на аналитиката" className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm" value={analyticsDays} onChange={(event) => setAnalyticsDays(Number(event.target.value) as 1 | 7 | 30 | 90)}>
              <option value={1}>Днес</option><option value={7}>Последни 7 дни</option><option value={30}>Последни 30 дни</option><option value={90}>Последни 90 дни</option>
            </select>
            <button type="button" onClick={() => void loadAnalytics()} disabled={analyticsLoading} className="rounded-xl bg-lime-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{analyticsLoading ? 'Обновяване…' : 'Обнови'}</button>
          </div>
        </div>
        {analyticsError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{analyticsError}</div>}
        {analyticsLoading && !analyticsData && <p className="mt-6 text-sm text-stone-500">Зареждане на аналитиката…</p>}
        {analyticsData && <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Прегледи на страници', value: analyticsData.totals.page_views },
              { label: 'Общо контактни действия', value: analyticsData.totals.contact_clicks },
              { label: 'WhatsApp кликове', value: analyticsData.totals.chat_click },
              { label: 'Всички събития', value: analyticsData.totals.total_events },
            ].map((item) => <article key={item.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><div className="text-sm text-stone-500">{item.label}</div><div className="mt-2 text-3xl font-semibold tabular-nums">{item.value.toLocaleString('bg-BG')}</div></article>)}
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Прегледи по дни</h2>
              <p className="mt-1 text-xs text-stone-500">Датите са по часовата зона Europe/Sofia.</p>
              {analyticsData.daily.length === 0 ? <p className="py-8 text-center text-sm text-stone-500">Няма събития за избрания период.</p> : <div className="mt-5 flex h-48 items-end gap-1.5 overflow-x-auto pb-7">
                {analyticsData.daily.map((day) => {
                  const maxViews = Math.max(1, ...analyticsData.daily.map((item) => item.page_views))
                  const barHeight = Math.max(day.page_views > 0 ? 4 : 0, Math.round((day.page_views / maxViews) * 100))
                  return <div key={day.event_day} className="flex h-full min-w-7 flex-1 flex-col items-center justify-end gap-2" title={`${day.event_day}: ${day.page_views} прегледа, ${day.call_bg + day.call_en_ru + day.chat_click} контакта`}>
                    <div className="flex w-full flex-1 items-end"><div className="w-full rounded-t-md bg-lime-700" style={{ height: `${barHeight}%` }} /></div>
                    <span className="whitespace-nowrap text-[10px] text-stone-500">{day.event_day.slice(5)}</span>
                  </div>
                })}
              </div>}
            </section>
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Контактни действия</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3"><span>Телефон BG · +359 876 777 902</span><strong className="tabular-nums">{analyticsData.totals.call_bg}</strong></div>
                <div className="flex items-center justify-between gap-3"><span>Телефон ENG / UA / RU · +359 885 834 860</span><strong className="tabular-nums">{analyticsData.totals.call_en_ru}</strong></div>
                <div className="flex items-center justify-between gap-3"><span>WhatsApp · +380 67 480 7486</span><strong className="tabular-nums">{analyticsData.totals.chat_click}</strong></div>
              </div>
              <h3 className="mt-6 font-semibold">Език на интерфейса</h3>
              <div className="mt-3 space-y-2">{analyticsData.by_language.map((item) => <div key={item.lang} className="flex justify-between text-sm"><span>{item.lang.toUpperCase()}</span><strong className="tabular-nums">{item.event_count}</strong></div>)}</div>
            </section>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Най-посещавани страници</h2>
              <div className="mt-3 space-y-2">{analyticsData.top_pages.length ? analyticsData.top_pages.map((item) => <div key={item.page_path} className="flex items-center justify-between gap-3 border-b border-stone-100 py-2 text-sm"><span className="min-w-0 break-all">{item.page_path}</span><strong className="shrink-0 tabular-nums">{item.page_views}</strong></div>) : <p className="text-sm text-stone-500">Няма прегледи за избрания период.</p>}</div>
            </section>
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Събития</h2>
              <div className="mt-3 space-y-2">{analyticsData.by_event.map((item) => <div key={item.event_type} className="flex items-center justify-between gap-3 border-b border-stone-100 py-2 text-sm"><span>{({ page_view: 'Преглед на страница', call_bg: 'Обаждане BG', call_en_ru: 'Обаждане ENG / UA / RU', chat_click: 'WhatsApp' } as Record<string, string>)[item.event_type] || item.event_type}</span><strong className="tabular-nums">{item.event_count}</strong></div>)}</div>
            </section>
          </div>
          <p className="mt-5 rounded-xl border border-stone-200 bg-white p-4 text-xs leading-5 text-stone-500">Отчетът показва броя на записаните събития, а не уникални посетители. Не се събират IP адреси, user-agent, referrer, идентификатори на посетители или съдържание на формуляри.</p>
        </>}
      </section>
      <section className={activeTab === 'staff' && (profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canManageStaff) ? 'mx-auto max-w-6xl px-4 py-6' : 'hidden'}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold">Управление на служителите</h1>
              <p className="mt-1 text-sm text-stone-600">Достъпът до служителите и правата за делегиране се определят от профила на собственика.</p>
            </div>
            {staffError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{staffError}</div>}
            {staffNotice && <div className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{staffNotice}</div>}
            {staffLoading && <p className="text-sm text-stone-500">Зареждане на служителите…</p>}
            <div className="space-y-3">
              {staffMembers.map((staff) => (
                <article key={staff.user_id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{staff.display_name || staff.email || 'Без име'}</div>
                      <div className="mt-1 break-all text-sm text-stone-500">{staff.email || staff.user_id}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-stone-100 px-2 py-1">{staff.role === 'owner' ? 'Собственик' : staff.role === 'manager' ? 'Мениджър' : 'Продавач'}</span>
                        <span className={'rounded-full px-2 py-1 ' + (staff.is_active ? 'bg-lime-100 text-lime-900' : 'bg-stone-200 text-stone-600')}>{staff.is_active ? 'Активен' : 'Деактивиран'}</span>
                      </div>
                    </div>
                    {staff.role !== 'owner' && <div className="flex flex-wrap gap-2">
                      {(profile.role === 'owner' || profile.role === 'manager' && profile.permissions.canDelegatePermissions) && <select aria-label={'Роля на ' + staff.email} className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm" value={staff.role} disabled={staffSaving} onChange={(event) => void updateStaff(staff.user_id, { action: 'update', role: event.target.value }, 'Ролята е обновена.')}>
                        <option value="seller">Продавач</option>
                        <option value="manager">Мениджър</option>
                      </select>}
                      <button type="button" disabled={staffSaving} onClick={() => { setPasswordTarget(passwordTarget === staff.user_id ? null : staff.user_id); setReplacementPassword('') }} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold">Задай парола</button>
                      {(profile.role === 'owner' || profile.permissions.canDelegatePermissions) && <fieldset className="mt-3 rounded-xl border border-stone-200 p-3"><legend className="px-1 text-xs font-semibold">Разрешения</legend><div className="grid gap-2 sm:grid-cols-2">{permissionOptions.filter((item) => profile.role === 'owner' || item.key !== 'canEditPlantStock' && profile.permissions[item.key]).filter((item) => staff.role !== 'seller' || !['canEditPlantCard','canReviewPlantSubmissions','canApprovePlantSubmission','canPublishPlant','canManageStaff','canDelegatePermissions','canViewAnalytics','canViewOrders','canEditOrders','canDeleteTestOrders','canManageCategorySeo'].includes(item.key)).map((item) => <label key={item.key} className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={staffSaving} checked={staff.permissions[item.key]} onChange={(event) => void updateStaff(staff.user_id,{action:'update',permissions:{...staff.permissions,[item.key]:event.target.checked}},'Разрешенията са обновени.')} />{item.label}</label>)}</div></fieldset>}
                      <button type="button" disabled={staffSaving} onClick={() => {
                        const action = staff.is_active ? 'deactivate' : 'activate'
                        if (staff.is_active && !window.confirm('Да изключа ли достъпа на този служител? Историята му ще бъде запазена.')) return
                        void updateStaff(staff.user_id, { action }, staff.is_active ? 'Достъпът е изключен. Историята е запазена.' : 'Достъпът е възстановен.')
                      }} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold">{staff.is_active ? 'Изключи достъп' : 'Активирай'}</button>
                    </div>}
                  </div>
                  {passwordTarget === staff.user_id && <form onSubmit={(event) => void saveStaffPassword(event, staff.user_id)} className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input className={inputClass + ' mt-0'} type="password" minLength={12} maxLength={128} autoComplete="new-password" placeholder="Нова парола — минимум 12 символа" value={replacementPassword} onChange={(event) => setReplacementPassword(event.target.value)} required />
                    <button disabled={staffSaving} className="shrink-0 rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white">Запази</button>
                  </form>}
                </article>
              ))}
              {!staffLoading && staffMembers.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">Все още няма добавени служители.</div>}
            </div>
          </div>
          <form onSubmit={createStaff} className="h-fit rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Добавяне на служител</h2>
            <label className={labelClass + ' mt-4'}>Име на служителя<input className={inputClass} value={newStaffName} onChange={(event) => setNewStaffName(event.target.value)} maxLength={120} required /></label>
            <label className={labelClass + ' mt-4'}>Email<input className={inputClass} type="email" autoComplete="off" value={newStaffEmail} onChange={(event) => setNewStaffEmail(event.target.value)} required /></label>
            <label className={labelClass + ' mt-4'}>Роля<select className={inputClass} value={newStaffRole} onChange={(event) => { const role = event.target.value as 'seller' | 'manager'; setNewStaffRole(role); if (role === 'seller') setNewStaffPermissions((current) => ({ ...current, canEditPlantCard: false, canReviewPlantSubmissions: false, canApprovePlantSubmission: false, canPublishPlant: false, canManageStaff: false, canDelegatePermissions: false, canViewAnalytics: false, canViewOrders: false, canEditOrders: false, canDeleteTestOrders: false })) }}><option value="seller">Продавач</option>{(profile.role === 'owner' || profile.permissions.canDelegatePermissions) && <option value="manager">Мениджър</option>}</select></label>
            {(profile.role === 'owner' || profile.permissions.canDelegatePermissions) && <fieldset className="mt-4 rounded-xl border border-stone-200 p-3"><legend className="px-1 text-sm font-semibold">Права на новия служител</legend><div className="grid gap-2 sm:grid-cols-2">{permissionOptions.filter((item) => profile.role === 'owner' || item.key !== 'canEditPlantStock' && profile.permissions[item.key]).filter((item) => newStaffRole !== 'seller' || !['canEditPlantCard','canReviewPlantSubmissions','canApprovePlantSubmission','canPublishPlant','canManageStaff','canDelegatePermissions','canViewAnalytics','canViewOrders','canEditOrders','canDeleteTestOrders'].includes(item.key)).map((item) => <label key={item.key} className="flex items-center gap-2 text-sm font-normal"><input type="checkbox" checked={newStaffPermissions[item.key]} onChange={(event) => setNewStaffPermissions((current) => ({ ...current, [item.key]: event.target.checked }))} />{item.label}</label>)}</div><p className="mt-2 text-xs font-normal text-stone-500">Могат да бъдат предоставени само права, които имате лично.</p></fieldset>}
            <label className={labelClass + ' mt-4'}>Парола<input className={inputClass} type="password" autoComplete="new-password" minLength={12} maxLength={128} value={newStaffPassword} onChange={(event) => setNewStaffPassword(event.target.value)} required /><span className="mt-1 block text-xs font-normal text-stone-500">Минимум 12 символа. След запис паролата няма да се показва повторно.</span></label>
            <button disabled={staffSaving} className="mt-5 w-full rounded-xl bg-lime-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{staffSaving ? 'Запазване…' : 'Създай служител'}</button>
          </form>
        </div>
        <p className="mt-5 rounded-xl border border-stone-200 bg-white p-4 text-xs leading-5 text-stone-500">При изключване на достъпа профилът се запазва, за да остане историята на заявките. Паролите не се съхраняват в каталожните таблици. В интерфейса няма функция за самостоятелна смяна или възстановяване на парола.</p>
      </section>
    </main>
  )
}
