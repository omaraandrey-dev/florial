import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type StaffProfile = { user_id: string; role: 'seller' | 'manager' | 'owner'; display_name: string; is_active: boolean }
type Submission = {
  id: string; title: string; sku: string | null; payload: Record<string, unknown>;
  status: string; created_by: string; created_at: string; updated_at: string;
  review_note: string | null; notification_sent_at: string | null
}
type Session = { access_token: string; user: { id: string; email?: string } }
type IntakeImage = { path: string; name: string; size: number; type: string }

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

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setSession(null); setProfile(null); setSubmissions([]); setLoading(false); return
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
      .select('id,title,sku,payload,status,created_by,created_at,updated_at,review_note,notification_sent_at')
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

  const loadEvents = async (id: string) => {
    setSelectedId(id)
    const selectedSubmission = submissions.find((item) => item.id === id)
    const imageItems = (selectedSubmission?.payload?.images as IntakeImage[] | undefined) || []
    if (imageItems.length) {
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrls(imageItems.map((item) => item.path), 3600)
      setPreviewImages((signed || []).map((item, index) => ({ name: imageItems[index]?.name || 'Снимка', url: item.signedUrl || '' })).filter((item) => item.url))
    } else setPreviewImages([])
    const { data } = await supabase.from('catalog_submission_events')
      .select('id,event_type,from_status,to_status,note,created_at')
      .eq('submission_id', id).order('created_at', { ascending: false })
    setEvents(data || [])
  }

  const resetForm = () => {
    setSelectedId(null); setTitle(''); setLatinName(''); setSku(''); setCategory('')
    setDescription(''); setVariantName(''); setHeight(''); setPotVolume('')
    setPrice(''); setStockQuantity('1'); setStockStatus('inStock'); setFiles([])
  }

  const saveDraft = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!session || !profile) return
    if (!title.trim()) { setError('Въведете име на растението.'); return }
    setSaving(true); setError(''); setNotice('')
    try {
      const payload = {
        name: title.trim(), latinName: latinName.trim(), sku: sku.trim(),
        categoryName: category.trim(), description: description.trim(),
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
      for (const file of files) {
        if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
          throw new Error('Снимките трябва да са до 10 MB и във формат на изображение.')
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-90)
        const path = session.user.id + '/' + submissionId + '/' + crypto.randomUUID() + '-' + safeName
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false })
        if (uploadError) throw uploadError
        currentImages.push({ path, name: file.name, size: file.size, type: file.type })
      }
      const finalPayload = { ...payload, images: currentImages }
      const { error: updateError } = await supabase.from('catalog_submissions').update({
        title: title.trim(), sku: sku.trim() || null, payload: finalPayload, updated_at: new Date().toISOString(),
      }).eq('id', submissionId)
      if (updateError) throw updateError
      setFiles([])
      setNotice('Черновата е запазена.')
      await loadSubmissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Възникна грешка при запис.')
    } finally { setSaving(false) }
  }

  const submitForReview = async () => {
    if (!session || !selectedId) { setError('Първо запазете черновата.'); return }
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
    const { error: approveError } = await supabase.from('catalog_submissions').update({
      status: 'approved', reviewed_by: profile.user_id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', id).in('status', ['submitted', 'in_review'])
    if (approveError) setError(approveError.message)
    else { setNotice('Заявката е одобрена. Публикацията в Sanity ще бъде включена в следващия етап.'); await loadSubmissions() }
  }

  const requestChanges = async (id: string) => {
    if (reviewNote.trim().length < 3) { setError('Добавете коментар за корекциите (поне 3 символа).'); return }
    const { error: rpcError } = await supabase.rpc('manager_request_catalog_changes', {
      submission_id: id, request_note: reviewNote.trim(),
    })
    if (rpcError) setError(rpcError.message)
    else { setReviewNote(''); setNotice('Заявката е върната за корекция.'); await loadSubmissions(); await loadEvents(id) }
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
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-2xl font-semibold">Заявки за каталог „Растения“</h1><p className="mt-1 text-sm text-stone-600">Черновите не се виждат в публичния магазин.</p></div>
            {profile.role === 'seller' && <button onClick={resetForm} className="rounded-xl bg-lime-800 px-4 py-3 text-sm font-semibold text-white">+ Ново растение</button>}
          </div>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {notice && <div className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}
          {profile.role === 'seller' && (
            <form onSubmit={saveDraft} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{selectedId ? 'Редактиране на чернова' : 'Нова приемка на растение'}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>Име на растението (BG) *<input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="напр. Маслина" /></label>
                <label className={labelClass}>Латинско име<input className={inputClass} value={latinName} onChange={(e) => setLatinName(e.target.value)} placeholder="Olea europaea" /></label>
                <label className={labelClass}>Артикулен код / SKU<input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} /></label>
                <label className={labelClass}>Категория<input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Декоративни дървета" /></label>
                <label className={labelClass}>Вариант / размер<input className={inputClass} value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="C 25, 160–180 cm" /></label>
                <label className={labelClass}>Височина при продажба (cm)<input className={inputClass} type="number" min="0" step="1" value={height} onChange={(e) => setHeight(e.target.value)} /></label>
                <label className={labelClass}>Обем на контейнера (L)<input className={inputClass} type="number" min="0" step="0.5" value={potVolume} onChange={(e) => setPotVolume(e.target.value)} /></label>
                <label className={labelClass}>Продажна цена (EUR с ДДС)<input className={inputClass} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
                <label className={labelClass}>Количество<input className={inputClass} type="number" min="0" step="1" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} /></label>
                <label className={labelClass}>Наличност<select className={inputClass} value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}><option value="inStock">Наличен</option><option value="outOfStock">Изчерпан</option><option value="preorder">По заявка</option></select></label>
              </div>
              <label className={labelClass + ' mt-4'}>Описание<textarea className={inputClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
              <label className={labelClass + ' mt-4'}>Снимки (до 10 MB на файл)<input className={inputClass} type="file" accept="image/*" capture="environment" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 8))} /></label>
              {files.length > 0 && <p className="mt-2 text-sm text-stone-500">Избрани снимки: {files.map((file) => file.name).join(', ')}</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                <button disabled={saving} className="rounded-xl bg-stone-800 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Запазване…' : 'Запази черновата'}</button>
                {selectedId && <button type="button" disabled={saving} onClick={submitForReview} className="rounded-xl bg-lime-800 px-5 py-3 font-semibold text-white disabled:opacity-50">Изпрати на проверка</button>}
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
                    setSku(item.sku || ''); setCategory(String(item.payload.categoryName || '')); setDescription(String(item.payload.description || ''))
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
                {profile.role === 'owner' && ['submitted', 'in_review'].includes(item.status) && <button onClick={() => void approve(item.id)} className="mt-3 rounded-lg bg-lime-800 px-4 py-2 text-sm font-semibold text-white">Одобри</button>}
                {profile.role !== 'seller' && ['submitted', 'in_review'].includes(item.status) && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input className={inputClass + ' mt-0'} placeholder="Коментар за корекции" value={selectedId === item.id ? reviewNote : ''} onChange={(e) => { setSelectedId(item.id); setReviewNote(e.target.value) }} /><button onClick={() => void requestChanges(item.id)} className="shrink-0 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold">Върни за корекция</button></div>}
              </article>
            ))}
          </div>
        </section>
        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold">История на заявката</h2>
          {!selectedId && <p className="mt-2 text-sm text-stone-500">Изберете заявка, за да видите историята.</p>}
          {selected && <p className="mt-2 text-sm text-stone-500">{selected.title}</p>}
          {previewImages.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2">{previewImages.map((photo) => <a key={photo.url} href={photo.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-stone-200"><img src={photo.url} alt={photo.name} className="h-28 w-full object-cover" /><span className="block truncate p-2 text-xs">{photo.name}</span></a>)}</div>}
          <ol className="mt-4 space-y-4">
            {events.map((event) => <li key={event.id} className="border-l-2 border-lime-700 pl-3"><div className="text-sm font-semibold">{event.to_status ? statusLabels[event.to_status] || event.event_type : event.event_type}</div><div className="text-xs text-stone-500">{new Date(event.created_at).toLocaleString('bg-BG')}</div>{event.note && <p className="mt-1 text-sm">{event.note}</p>}</li>)}
          </ol>
          <p className="mt-6 border-t border-stone-100 pt-4 text-xs leading-5 text-stone-500">Системата пази черновите и снимките в затворено хранилище. Одобрението в тази версия не публикува автоматично в публичния каталог.</p>
        </aside>
      </div>
    </main>
  )
}
