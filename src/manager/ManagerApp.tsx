import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { getPlantCategories, type PlantCategory } from './plantCategories'
import SubmissionDetails from './SubmissionDetails'
import PlantPublicationEditor from './PlantPublicationEditor'

type StaffProfile = { user_id: string; role: 'seller' | 'manager' | 'owner'; display_name: string; is_active: boolean }
type Submission = {
  id: string; title: string; sku: string | null; payload: Record<string, unknown>;
  status: string; created_by: string; created_at: string; updated_at: string;
  review_note: string | null; notification_sent_at: string | null; publish_error: string | null
}
type Session = { access_token: string; user: { id: string; email?: string } }
type IntakeImage = { path: string; name: string; size: number; type: string }
type LocalPreview = { file: File; url: string }
type StaffMember = { user_id: string; email: string; display_name: string; role: 'seller' | 'manager' | 'owner'; is_active: boolean; created_at?: string }
type AnalyticsReport = {
  period_days: number
  totals: { page_views: number; call_bg: number; call_en_ru: number; chat_click: number; contact_clicks: number; total_events: number }
  daily: Array<{ event_day: string; page_views: number; call_bg: number; call_en_ru: number; chat_click: number }>
  by_event: Array<{ event_type: string; event_count: number }>
  by_language: Array<{ lang: string; event_count: number }>
  top_pages: Array<{ page_path: string; page_views: number }>
}

const bucket = 'florial-manager-intake'
const statusLabels: Record<string, string> = {
  draft: 'Чернова', submitted: 'Изпратена за проверка', in_review: 'В процес на проверка',
  changes_requested: 'Нужни са корекции', approved: 'Одобрена', publishing: 'Публикува се',
  published: 'Публикувана', publish_failed: 'Грешка при публикуване', rejected: 'Отхвърлена',
}
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base text-stone-800 outline-none transition focus:border-lime-700 focus:ring-2 focus:ring-lime-100'
const labelClass = 'block text-sm font-semibold text-stone-700'

export default function ManagerApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [events, setEvents] = useState<Array<{ id: number; event_type: string; from_status: string | null; to_status: string | null; note: string | null; created_at: string }>>([])
  const [title, setTitle] = useState('')
  const [latinName, setLatinName] = useState('')
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
  const [stockQuantity, setStockQuantity] = useState('1')
  const [stockStatus, setStockStatus] = useState('inStock')
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [previewImages, setPreviewImages] = useState<Array<{ name: string; url: string }>>([])
  const [activeTab, setActiveTab] = useState<'submissions' | 'staff' | 'analytics'>('submissions')
  const [analyticsDays, setAnalyticsDays] = useState<7 | 30 | 90>(30)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsReport | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')
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

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setSession(null); setProfile(null); setSubmissions([]); setActiveTab('submissions'); setLoading(false); return
    }
    setSession(currentSession)
    const { data, error: profileError } = await supabase
      .from('catalog_staff_profiles')
      .select('user_id,role,display_name,is_active')
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
    let query = supabase.from('catalog_submissions')
      .select('id,title,sku,payload,status,created_by,created_at,updated_at,review_note,notification_sent_at,publish_error')
      .eq('catalog', 'plants')
      .order('updated_at', { ascending: false })
      .limit(100)
    if (profile.role === 'seller') query = query.eq('created_by', profile.user_id)
    const { data, error: listError } = await query
    if (listError) { setError('Не успяхме да заредим заявките. ' + listError.message); return }
    setSubmissions((data || []) as Submission[])
  }, [profile])

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (alive) void loadProfile(data.session as Session | null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (alive) {
        setLoading(true)
        void loadProfile(nextSession as Session | null)
      }
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [loadProfile])

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

  const loadStaff = useCallback(async () => {
    if (!session || profile?.role !== 'owner') return
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
    if (profile?.role === 'owner') void loadStaff()
  }, [loadStaff, profile])

  const loadAnalytics = useCallback(async () => {
    if (!session || profile?.role !== 'owner') return
    setAnalyticsLoading(true)
    setAnalyticsError('')
    try {
      const { data, error: rpcError } = await supabase.rpc('manager_site_analytics', { p_days: analyticsDays })
      if (rpcError) throw rpcError
      setAnalyticsData(data as AnalyticsReport)
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Не успяхме да заредим аналитиката.')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [session, profile, analyticsDays])

  useEffect(() => {
    if (activeTab === 'analytics' && profile?.role === 'owner') void loadAnalytics()
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
    const imageItems = imagesOverride || (selectedSubmission?.payload?.images as IntakeImage[] | undefined) || []
    setPreviewImages([])
    setPreviewLoading(imageItems.length > 0)
    if (imageItems.length) {
      const { data: signed, error: signedError } = await supabase.storage.from(bucket).createSignedUrls(imageItems.map((item) => item.path), 3600)
      if (signedError) setError('Не удалось открыть фотографии заявки: ' + signedError.message)
      else {
        const mapped = (signed || []).map((item, index) => ({ name: imageItems[index]?.name || 'Снимка', url: item.signedUrl || '' })).filter((item) => item.url)
        setPreviewImages(mapped)
        if (mapped.length !== imageItems.length) setError('Часть фотографий недоступна для просмотра. Проверьте файлы в хранилище.')
      }
    }
    setPreviewLoading(false)
    const { data } = await supabase.from('catalog_submission_events')
      .select('id,event_type,from_status,to_status,note,created_at')
      .eq('submission_id', id).order('created_at', { ascending: false })
    setEvents(data || [])
  }

  const resetForm = () => {
    setSelectedId(null); setPreviewImages([]); setTitle(''); setLatinName(''); setSku(''); setCategory(''); setReviewNote(''); setError(''); setNotice('')
    setDescription(''); setVariantName(''); setHeight(''); setPotVolume('')
    setPrice(''); setStockQuantity('1'); setStockStatus('inStock'); setFiles([])
  }

  const saveDraft = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!session || !profile) return
    if (!title.trim()) { setError('Въведете име на растението.'); return }
    if (!category) { setError('Изберете категория от списъка.'); return }
    if (files.length + (((selected?.payload?.images as IntakeImage[] | undefined) || []).length) > 8) { setError('Максимумът е 8 снимки за една заявка.'); return }
    setSaving(true); setError(''); setNotice(''); setUploadProgress('Подготовка на снимките…')
    try {
      const payload = {
        name: title.trim(), latinName: latinName.trim(), sku: sku.trim(),
        categoryId: category, categoryName: selectedCategory?.name || '', description: description.trim(),
        images: (selected?.payload?.images as IntakeImage[] | undefined) || [],
        saleVariants: [{
          _key: crypto.randomUUID(), name: variantName.trim(),
          saleHeightCm: height ? Number(height) : null,
          containerVolumeL: potVolume ? Number(potVolume) : null,
          priceEUR: price ? Number(price) : null,
          stockStatus, stockQuantity: Number(stockQuantity || 0),
        }],
      }
      let submissionId = selectedId
      if (!submissionId) {
        const { data, error: insertError } = await supabase.from('catalog_submissions').insert({
          catalog: 'plants', operation: 'create', title: title.trim(), sku: sku.trim() || null,
          payload, status: 'draft', created_by: session.user.id,
        }).select('id').single()
        if (insertError) throw insertError
        submissionId = data.id
        setSelectedId(submissionId)
      }
      const currentImages = [...(selected?.payload?.images as IntakeImage[] | undefined || [])]
      const filesToUpload = [...files]
      for (let index = 0; index < filesToUpload.length; index += 1) {
        const file = filesToUpload[index]
        setUploadProgress(`Загружане на снимка ${index + 1} от ${filesToUpload.length}…`)
        if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
          throw new Error('Снимките трябва да са до 10 MB и във формат на изображение.')
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-90)
        const path = session.user.id + '/' + submissionId + '/' + crypto.randomUUID() + '-' + safeName
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false })
        if (uploadError) throw uploadError
        currentImages.push({ path, name: file.name, size: file.size, type: file.type })
        const partialPayload = { ...payload, images: currentImages }
        const { error: imageRecordError } = await supabase.from('catalog_submissions').update({ payload: partialPayload, updated_at: new Date().toISOString() }).eq('id', submissionId)
        if (imageRecordError) throw new Error('Снимката е качена, но не успяхме да запазим връзката ѝ: ' + imageRecordError.message)
        const uploadedFiles = filesToUpload.slice(0, index + 1)
        setFiles((pending) => pending.filter((item) => !uploadedFiles.includes(item)))
      }
      setUploadProgress('Запазване на данните…')
      const finalPayload = { ...payload, images: currentImages }
      const { error: updateError } = await supabase.from('catalog_submissions').update({
        title: title.trim(), sku: sku.trim() || null, payload: finalPayload, updated_at: new Date().toISOString(),
      }).eq('id', submissionId)
      if (updateError) throw updateError
      setFiles([])
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
    if (files.length > 0) { setError('Първо запазете и качете избраните снимки.'); return }
    setSaving(true); setError(''); setNotice('')
    const { error: updateError } = await supabase.from('catalog_submissions').update({
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
    setNotice(response.ok ? 'Заявката е изпратена на собственика.' : 'Заявката е изпратена, но email известието не е потвърдено. ' + (notification.error || 'Проверете настройките на известията.'))
    await loadSubmissions()
    setSaving(false)
  }

  const approve = async (id: string) => {
    if (!profile || profile.role !== 'owner') return
    if (!window.confirm('Потвърждавате ли одобрението? Заявката ще бъде готова за следващия етап, но няма да се публикува автоматично в магазина.')) return
    const { error: approveError } = await supabase.from('catalog_submissions').update({
      status: 'approved', reviewed_by: profile.user_id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', id).in('status', ['submitted', 'in_review'])
    if (approveError) setError(approveError.message)
    else { setNotice('Заявката е одобрена. Публикацията в Sanity ще бъде включена в следващия етап.'); await loadSubmissions() }
  }

  const rejectSubmission = async (id: string) => {
    if (!profile || profile.role !== 'owner') return
    if (reviewNote.trim().length < 3) { setError('Добавете причина за отказ (поне 3 символа).'); return }
    if (!window.confirm('Сигурни ли сте, че искате да отхвърлите тази заявка?')) return
    const { error: rejectError } = await supabase.from('catalog_submissions').update({
      status: 'rejected', review_note: reviewNote.trim(), reviewed_by: profile.user_id,
      reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', id).in('status', ['submitted', 'in_review'])
    if (rejectError) setError('Не удалось отклонить заявку: ' + rejectError.message)
    else { setReviewNote(''); setNotice('Заявката е отхвърлена.'); await loadSubmissions(); await loadEvents(id) }
  }

  const requestChanges = async (id: string) => {
    if (reviewNote.trim().length < 3) { setError('Добавете коментар за корекциите (поне 3 символа).'); return }
    const { error: rpcError } = await supabase.rpc('manager_request_catalog_changes', {
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
    if (!response.ok) throw new Error(result.error || 'Не удалось выполнить действие.')
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
      })
      setNewStaffEmail(''); setNewStaffName(''); setNewStaffPassword('')
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

  const signOut = async () => { await supabase.auth.signOut(); resetForm(); setProfile(null); setSession(null) }

  if (loading) return <div className="min-h-screen bg-[#f5f6ef] grid place-items-center text-stone-600">Зареждане на Florial Manager…</div>

  if (!session || !profile) return (
    <main className="min-h-screen bg-[#f5f6ef] px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm border border-stone-200">
        <div className="text-xs font-bold tracking-[.24em] text-lime-800">FLORIAL / INTERNAL</div>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Вход за служители</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">Затворен достъп до системата за приемане на растения. Регистрацията е достъпна само чрез покана от собственика.</p>
        <form className="mt-7 space-y-4" onSubmit={async (event) => {
          event.preventDefault(); setError(''); setLoading(true)
          const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
          if (loginError) { setError('Невалиден имейл или парола.'); setLoading(false) }
        }}>
          <label className={labelClass}>Имейл<input className={inputClass} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className={labelClass}>Парола<input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button className="w-full rounded-xl bg-lime-800 px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={loading}>Вход</button>
        </form>
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
      <nav className="mx-auto flex max-w-6xl gap-2 px-4 pt-4" aria-label="Раздели на Manager">
        <button onClick={() => setActiveTab('submissions')} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'submissions' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>Заявки</button>
        {profile.role === 'owner' && <button onClick={() => { setActiveTab('staff'); setStaffNotice(''); setStaffError(''); void loadStaff() }} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'staff' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>Служители</button>}
        {profile.role === 'owner' && <button onClick={() => { setActiveTab('analytics'); setAnalyticsError('') }} className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (activeTab === 'analytics' ? 'bg-lime-800 text-white' : 'border border-stone-300 bg-white text-stone-700')}>Аналитика</button>}
      </nav>
      <div className={'mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px] ' + (activeTab === 'submissions' ? '' : 'hidden')}>
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-2xl font-semibold">Заявки за каталог „Растения“</h1><p className="mt-1 text-sm text-stone-600">Черновите не се виждат в публичния магазин.</p></div>
            {profile.role === 'seller' && <button onClick={resetForm} className="rounded-xl bg-lime-800 px-4 py-3 text-sm font-semibold text-white">+ Ново растение</button>}
          </div>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {notice && <div className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}
          {profile.role === 'owner' && selected && ['approved', 'publish_failed'].includes(selected.status) && (
            <PlantPublicationEditor
              submission={selected}
              categories={plantCategories}
              images={previewImages}
              imagesLoading={previewLoading}
              publishError={selected.publish_error}
              accessToken={session.access_token}
              onSaved={async () => {
                await loadSubmissions()
                if (selectedId) await loadEvents(selectedId)
              }}
              onPublished={async () => {
                await loadSubmissions()
                if (selectedId) await loadEvents(selectedId)
                setNotice('Растението е публикувано в каталога на Florial.')
              }}
            />
          )}
          {profile.role === 'seller' && (!selected || ['draft', 'changes_requested'].includes(selected.status)) && (
            <form onSubmit={saveDraft} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{selectedId ? 'Редактиране на чернова' : 'Нова приемка на растение'}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>Име на растението (BG) *<input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="напр. Маслина" /></label>
                <label className={labelClass}>Латинско име<input className={inputClass} value={latinName} onChange={(e) => setLatinName(e.target.value)} placeholder="Olea europaea" /></label>
                <label className={labelClass}>Артикулен код / SKU<input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} /></label>
                <label className={labelClass}>Категория на растението *<select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} required disabled={categoriesLoading || plantCategories.length === 0}><option value="">{categoriesLoading ? 'Зареждане на категориите…' : 'Изберете категория'}</option>{categoryGroups.map(([groupName, items]) => <optgroup key={groupName} label={groupName}>{items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</optgroup>)}</select>{categoriesError && <span className="mt-1 block text-xs font-normal text-red-700">{categoriesError}</span>}</label>
                <label className={labelClass}>Вариант / размер<input className={inputClass} value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="C 25, 160–180 cm" /></label>
                <label className={labelClass}>Височина при продажба (cm)<input className={inputClass} type="number" min="0" step="1" value={height} onChange={(e) => setHeight(e.target.value)} /></label>
                <label className={labelClass}>Обем на контейнера (L)<input className={inputClass} type="number" min="0" step="0.5" value={potVolume} onChange={(e) => setPotVolume(e.target.value)} /></label>
                <label className={labelClass}>Продажна цена (EUR с ДДС)<input className={inputClass} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
                <label className={labelClass}>Количество<input className={inputClass} type="number" min="0" step="1" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} /></label>
                <label className={labelClass}>Наличност<select className={inputClass} value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}><option value="inStock">Наличен</option><option value="outOfStock">Изчерпан</option><option value="onRequest">По заявка</option></select></label>
              </div>
              <label className={labelClass + ' mt-4'}>Описание<textarea className={inputClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
              <label className={labelClass + ' mt-4'}>Снимки (до 8 файла, 10 MB всеки)<input className={inputClass} type="file" accept="image/*" multiple onChange={(e) => { const chosen = Array.from(e.currentTarget.files || []); const savedCount = ((selected?.payload?.images as IntakeImage[] | undefined) || []).length; setFiles((current) => [...current, ...chosen].slice(0, Math.max(0, 8 - savedCount))); e.currentTarget.value = '' }} /></label>
              <p className="mt-1 text-xs font-normal text-stone-500">Изберете снимки от галерията или направете нова снимка с камерата на телефона.</p>
              {filePreviews.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{filePreviews.map((preview, index) => <div key={`${preview.file.name}-${index}`} className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50"><img src={preview.url} alt={preview.file.name} className="h-32 w-full object-cover" /><div className="flex items-center justify-between gap-2 p-2"><span className="min-w-0 truncate text-xs" title={preview.file.name}>{preview.file.name}</span><button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="shrink-0 rounded-md border border-stone-300 px-2 py-1 text-xs">Премахни</button></div></div>)}</div>}
              {uploadProgress && <p role="status" className="mt-3 rounded-lg bg-lime-50 p-3 text-sm text-lime-900">{uploadProgress}</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                <button disabled={saving} className="rounded-xl bg-stone-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Запазване…' : 'Запази черновата'}</button>
                {selectedId && <button type="button" disabled={saving || files.length > 0 || !category} onClick={submitForReview} className="rounded-xl bg-lime-800 px-5 py-3 font-semibold text-white disabled:opacity-50">Изпрати на проверка</button>}
              </div>
            </form>
          )}
          <div className="space-y-3">
            {submissions.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">Все още няма заявки.</div>}
            {submissions.map((item) => (
              <article key={item.id} className={'rounded-2xl border bg-white p-4 ' + (selectedId === item.id ? 'border-lime-700' : 'border-stone-200')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button onClick={() => {
                    setSelectedId(item.id); setTitle(String(item.payload.name || item.title)); setLatinName(String(item.payload.latinName || ''))
                    setSku(item.sku || ''); setCategory(String(item.payload.categoryId || plantCategories.find((candidate) => candidate.name.toLocaleLowerCase() === String(item.payload.categoryName || '').toLocaleLowerCase())?._id || '')); setDescription(String(item.payload.description || ''))
                    const variant = (item.payload.saleVariants as Array<Record<string, unknown>> | undefined)?.[0]
                    setVariantName(String(variant?.name || '')); setHeight(variant?.saleHeightCm ? String(variant.saleHeightCm) : '')
                    setPotVolume(variant?.containerVolumeL ? String(variant.containerVolumeL) : '')
                    setPrice(variant?.priceEUR ? String(variant.priceEUR) : '')
                    setStockQuantity(String(variant?.stockQuantity ?? 1)); setStockStatus(String(variant?.stockStatus || 'inStock'))
                    void loadEvents(item.id)
                  }} className="text-left"><div className="font-semibold">{item.title || 'Без име'}</div><div className="mt-1 text-xs text-stone-500">SKU: {item.sku || '—'} · {new Date(item.updated_at).toLocaleString('bg-BG')}</div></button>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">{statusLabels[item.status] || item.status}</span>
                </div>
                {item.review_note && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Коментар: {item.review_note}</p>}
                {profile.role === 'owner' && ['submitted', 'in_review'].includes(item.status) && <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void approve(item.id)} className="rounded-lg bg-lime-800 px-4 py-2 text-sm font-semibold text-white">Одобри</button><button onClick={() => void rejectSubmission(item.id)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">Отхвърли</button></div>}
                {profile.role !== 'seller' && ['submitted', 'in_review'].includes(item.status) && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input className={inputClass + ' mt-0'} placeholder="Коментар за корекции" value={selectedId === item.id ? reviewNote : ''} onChange={(e) => { setSelectedId(item.id); setReviewNote(e.target.value) }} /><button onClick={() => void requestChanges(item.id)} className="shrink-0 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold">Върни за корекция</button></div>}
              </article>
            ))}
          </div>
        </section>
        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5">
          <SubmissionDetails submission={selected} images={previewImages} loading={previewLoading} />
          <h2 className="mt-6 border-t border-stone-100 pt-4 font-semibold">История на действията</h2>
          <ol className="mt-4 space-y-4">
            {events.map((event) => <li key={event.id} className="border-l-2 border-lime-700 pl-3"><div className="text-sm font-semibold">{event.to_status ? statusLabels[event.to_status] || event.event_type : event.event_type}</div><div className="text-xs text-stone-500">{new Date(event.created_at).toLocaleString('bg-BG')}</div>{event.note && <p className="mt-1 text-sm">{event.note}</p>}</li>)}
          </ol>
          <p className="mt-6 border-t border-stone-100 pt-4 text-xs leading-5 text-stone-500">Системата пази черновите и снимките в затворено хранилище. След одобрение собственикът проверява финалната карточка и публикува отделно в каталога.</p>
        </aside>
      </div>
      <section className={activeTab === 'analytics' && profile.role === 'owner' ? 'mx-auto max-w-6xl px-4 py-6' : 'hidden'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-semibold">Аналитика на сайта</h1><p className="mt-1 text-sm text-stone-600">Анонимни обобщени събития по българско местно време.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Период на аналитиката" className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm" value={analyticsDays} onChange={(event) => setAnalyticsDays(Number(event.target.value) as 7 | 30 | 90)}>
              <option value={7}>Последни 7 дни</option><option value={30}>Последни 30 дни</option><option value={90}>Последни 90 дни</option>
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
      <section className={activeTab === 'staff' && profile.role === 'owner' ? 'mx-auto max-w-6xl px-4 py-6' : 'hidden'}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold">Управление на служителите</h1>
              <p className="mt-1 text-sm text-stone-600">Само собственикът може да добавя служители, задава пароли и управлява достъпа.</p>
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
                      <select aria-label={'Роля на ' + staff.email} className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm" value={staff.role} disabled={staffSaving} onChange={(event) => void updateStaff(staff.user_id, { action: 'update', role: event.target.value }, 'Ролята е обновена.')}>
                        <option value="seller">Продавач</option>
                        <option value="manager">Мениджър</option>
                      </select>
                      <button type="button" disabled={staffSaving} onClick={() => { setPasswordTarget(passwordTarget === staff.user_id ? null : staff.user_id); setReplacementPassword('') }} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold">Задай парола</button>
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
            <h2 className="text-lg font-semibold">Добавить сотрудника</h2>
            <label className={labelClass + ' mt-4'}>Имя сотрудника<input className={inputClass} value={newStaffName} onChange={(event) => setNewStaffName(event.target.value)} maxLength={120} required /></label>
            <label className={labelClass + ' mt-4'}>Email<input className={inputClass} type="email" autoComplete="off" value={newStaffEmail} onChange={(event) => setNewStaffEmail(event.target.value)} required /></label>
            <label className={labelClass + ' mt-4'}>Роль<select className={inputClass} value={newStaffRole} onChange={(event) => setNewStaffRole(event.target.value as 'seller' | 'manager')}><option value="seller">Продавач</option><option value="manager">Мениджър</option></select></label>
            <label className={labelClass + ' mt-4'}>Парола<input className={inputClass} type="password" autoComplete="new-password" minLength={12} maxLength={128} value={newStaffPassword} onChange={(event) => setNewStaffPassword(event.target.value)} required /><span className="mt-1 block text-xs font-normal text-stone-500">Минимум 12 символа. След запис паролата няма да се показва повторно.</span></label>
            <button disabled={staffSaving} className="mt-5 w-full rounded-xl bg-lime-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{staffSaving ? 'Запазване…' : 'Създай служител'}</button>
          </form>
        </div>
        <p className="mt-5 rounded-xl border border-stone-200 bg-white p-4 text-xs leading-5 text-stone-500">При изключване на достъпа профилът се запазва, за да остане историята на заявките. Паролите не се съхраняват в каталожните таблици. В интерфейса няма функция за самостоятелна смяна или възстановяване на парола.</p>
      </section>
    </main>
  )
}
