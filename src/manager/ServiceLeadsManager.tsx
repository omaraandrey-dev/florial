import { useCallback, useEffect, useMemo, useState } from 'react'

type LeadStatus = 'new' | 'processing' | 'contacted' | 'proposal_preparing' | 'proposal_sent' | 'waiting_customer' | 'approved' | 'completed' | 'rejected' | 'closed'
type Lead = {
  id: string; lead_number: string; service_slug: string; service_name: string; locale: string
  customer_name: string; phone: string; email: string | null; location: string; address: string | null
  comment: string | null; fields_json?: Record<string, unknown>; status: LeadStatus
  created_at: string; updated_at: string; assigned_to: string | null; assigned_name: string | null
}
type LeadEvent = {
  id: string; actor_id: string | null; actor_name: string | null; actor_role: string
  event_type: string; from_status: string | null; to_status: string | null
  note: string | null; metadata: Record<string, unknown>; created_at: string
}
type Assignee = { user_id: string; display_name: string; role: string }
type Props = { canManage: boolean }
const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'Нова' }, { value: 'processing', label: 'В обработка' },
  { value: 'contacted', label: 'Свързахме се с клиента' }, { value: 'proposal_preparing', label: 'Подготовка на оферта' },
  { value: 'proposal_sent', label: 'Офертата е изпратена' }, { value: 'waiting_customer', label: 'Очакваме отговор' },
  { value: 'approved', label: 'Съгласувана' }, { value: 'completed', label: 'Изпълнена' },
  { value: 'rejected', label: 'Отказана' }, { value: 'closed', label: 'Закрита' },
]
const statusLabel = (value: string) => statusOptions.find((item) => item.value === value)?.label || value
const statusClass = (value: string) => {
  if (value === 'new') return 'border-red-200 bg-red-100 text-red-800'
  if (value === 'processing') return 'border-orange-200 bg-orange-100 text-orange-800'
  if (value === 'contacted') return 'border-blue-200 bg-blue-100 text-blue-800'
  if (value === 'proposal_preparing') return 'border-amber-200 bg-amber-100 text-amber-900'
  if (value === 'proposal_sent') return 'border-orange-200 bg-orange-100 text-orange-900'
  if (value === 'waiting_customer') return 'border-violet-200 bg-violet-100 text-violet-900'
  if (value === 'approved') return 'border-emerald-200 bg-emerald-100 text-emerald-900'
  if (value === 'completed') return 'border-green-200 bg-green-100 text-green-900'
  if (value === 'rejected') return 'border-rose-200 bg-rose-100 text-rose-900'
  return 'border-stone-200 bg-stone-100 text-stone-700'
}
const eventLabel = (event: LeadEvent) => {
  if (event.event_type === 'internal_comment') return 'Вътрешен коментар'
  if (event.event_type === 'status_changed') return 'Промяна на статуса'
  if (event.event_type === 'assignment_changed') return 'Промяна на отговорника'
  if (event.event_type === 'email_delivery_result') return 'Резултат от изпращане на email'
  if (event.event_type === 'created' || event.event_type === 'lead_created') return 'Получена заявка'
  return event.event_type
}
const dateLabel = (value: string) => new Date(value).toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' })
const inputClass = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-lime-700 focus:ring-2 focus:ring-lime-100'

export default function ServiceLeadsManager({ canManage }: Props) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [services, setServices] = useState<Array<{ service_slug: string; service_name: string; lead_count: number }>>([])
  const [selectedId, setSelectedId] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [events, setEvents] = useState<LeadEvent[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [service, setService] = useState('')
  const [location, setLocation] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftQuery, setDraftQuery] = useState('')
  const [draftStatus, setDraftStatus] = useState('')
  const [draftService, setDraftService] = useState('')
  const [draftLocation, setDraftLocation] = useState('')
  const [draftAssignedTo, setDraftAssignedTo] = useState('')
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')
  const [comment, setComment] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (status) params.set('status', status)
    if (service) params.set('service', service)
    if (location.trim()) params.set('location', location.trim())
    if (assignedTo) params.set('assignedTo', assignedTo)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return params.toString()
  }, [query, status, service, location, assignedTo, from, to])

  const loadLeads = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/manager/service-leads' + (queryString ? '?' + queryString : ''), { credentials: 'same-origin', cache: 'no-store' })
      const result = await response.json() as { leads?: Lead[]; services?: typeof services; assignees?: Assignee[]; error?: string }
      if (!response.ok) throw new Error(result.error || 'Не успяхме да заредим заявките.')
      setLeads(result.leads || [])
      setServices(result.services || [])
      setAssignees(result.assignees || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Не успяхме да заредим заявките.') }
    finally { setLoading(false) }
  }, [queryString])

  const loadDetail = useCallback(async (id: string) => {
    if (!id) return
    try {
      const response = await fetch('/api/manager/service-leads?id=' + encodeURIComponent(id), { credentials: 'same-origin', cache: 'no-store' })
      const result = await response.json() as { lead?: Lead; events?: LeadEvent[]; assignees?: Assignee[]; error?: string }
      if (!response.ok) throw new Error(result.error || 'Не успяхме да отворим заявката.')
      setSelected(result.lead || null)
      setEvents(result.events || [])
      setAssignees(result.assignees || [])
    } catch (err) { setError(err instanceof Error ? err.message : 'Не успяхме да отворим заявката.') }
  }, [])

  useEffect(() => { void loadLeads() }, [loadLeads])
  useEffect(() => { if (selectedId) void loadDetail(selectedId) }, [selectedId, loadDetail])

  const mutate = async (body: Record<string, unknown>, success: string) => {
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/manager/service-leads', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Не успяхме да запазим промените.')
      setNotice(success)
      await loadLeads()
      if (selectedId) await loadDetail(selectedId)
      return true
    } catch (err) { setError(err instanceof Error ? err.message : 'Не успяхме да запазим промените.'); return false }
    finally { setSaving(false) }
  }

  const countFor = (statuses: LeadStatus[]) => leads.filter((lead) => statuses.includes(lead.status)).length
  const activeFilterCount = [query, status, service, location, assignedTo, from, to].filter(Boolean).length
  const beginFilterEdit = () => {
    setDraftQuery(query); setDraftStatus(status); setDraftService(service); setDraftLocation(location)
    setDraftAssignedTo(assignedTo); setDraftFrom(from); setDraftTo(to); setFiltersOpen((value) => !value)
  }
  const applyFilters = () => {
    setQuery(draftQuery); setStatus(draftStatus); setService(draftService); setLocation(draftLocation)
    setAssignedTo(draftAssignedTo); setFrom(draftFrom); setTo(draftTo); setFiltersOpen(false)
  }
  const clearFilters = () => {
    setDraftQuery(''); setDraftStatus(''); setDraftService(''); setDraftLocation('')
    setDraftAssignedTo(''); setDraftFrom(''); setDraftTo('')
    setQuery(''); setStatus(''); setService(''); setLocation(''); setAssignedTo(''); setFrom(''); setTo('')
    setFiltersOpen(false)
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Заявки за услуги</h1>
        <p className="mt-1 text-sm text-stone-600">Клиентски запитвания за монтаж, поливане, озеленяване и поддръжка.</p>
      </div>
      <button type="button" onClick={() => void loadLeads()} disabled={loading} className="min-h-11 rounded-xl bg-lime-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-lime-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700 focus-visible:ring-offset-2 disabled:opacity-50">
        {loading ? 'Обновяване…' : 'Обнови списъка'}
      </button>
    </div>

    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-stone-200 bg-white p-3 sm:grid-cols-4">
      <div className="rounded-xl bg-red-50 p-3"><div className="text-xs font-medium text-red-800">Нови</div><strong className="mt-1 block text-xl font-bold tabular-nums text-red-700">{countFor(['new'])}</strong></div>
      <div className="rounded-xl bg-blue-50 p-3"><div className="text-xs font-medium text-blue-800">В работа</div><strong className="mt-1 block text-xl font-bold tabular-nums text-blue-700">{countFor(['processing', 'contacted'])}</strong></div>
      <div className="rounded-xl bg-amber-50 p-3"><div className="text-xs font-medium text-amber-900">Оферти и отговор</div><strong className="mt-1 block text-xl font-bold tabular-nums text-amber-800">{countFor(['proposal_preparing', 'proposal_sent', 'waiting_customer'])}</strong></div>
      <div className="rounded-xl bg-green-50 p-3"><div className="text-xs font-medium text-green-800">С решение</div><strong className="mt-1 block text-xl font-bold tabular-nums text-green-700">{countFor(['approved', 'completed', 'rejected', 'closed'])}</strong></div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2">
      <button type="button" aria-expanded={filtersOpen} onClick={beginFilterEdit} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700 focus-visible:ring-offset-2">
        <span>Филтър</span><span aria-hidden="true">{filtersOpen ? '−' : '+'}</span>
        {activeFilterCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-lime-800 px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span>}
      </button>
      <span className="text-xs text-stone-500">{leads.length} заявки в резултатите</span>
    </div>

    {filtersOpen && <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-xs font-semibold text-stone-600">Търсене<input aria-label="Търсене на заявки" className={inputClass + ' mt-1'} value={draftQuery} onChange={(e) => setDraftQuery(e.target.value)} placeholder="Номер, име, телефон, email…" /></label>
      <label className="text-xs font-semibold text-stone-600">Статус<select aria-label="Филтър по статус" className={inputClass + ' mt-1'} value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}><option value="">Всички статуси</option>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="text-xs font-semibold text-stone-600">Услуга<select aria-label="Филтър по услуга" className={inputClass + ' mt-1'} value={draftService} onChange={(e) => setDraftService(e.target.value)}><option value="">Всички услуги</option>{services.map((item) => <option key={item.service_slug} value={item.service_slug}>{item.service_name} ({item.lead_count})</option>)}</select></label>
      <label className="text-xs font-semibold text-stone-600">Населено място<input className={inputClass + ' mt-1'} value={draftLocation} onChange={(e) => setDraftLocation(e.target.value)} placeholder="Несебър, Равда…" /></label>
      <label className="text-xs font-semibold text-stone-600">Отговорник<select className={inputClass + ' mt-1'} value={draftAssignedTo} onChange={(e) => setDraftAssignedTo(e.target.value)}><option value="">Всички</option><option value="unassigned">Без отговорник</option>{assignees.map((item) => <option key={item.user_id} value={item.user_id}>{item.display_name} · {item.role === 'owner' ? 'Собственик' : item.role === 'manager' ? 'Мениджър' : 'Служител'}</option>)}</select></label>
      <label className="text-xs font-semibold text-stone-600">От дата<input type="date" className={inputClass + ' mt-1'} value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} /></label>
      <label className="text-xs font-semibold text-stone-600">До дата<input type="date" className={inputClass + ' mt-1'} value={draftTo} onChange={(e) => setDraftTo(e.target.value)} /></label>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-4">
        <button type="button" onClick={applyFilters} className="min-h-10 rounded-xl bg-lime-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lime-900">Приложи филтъра</button>
        <button type="button" onClick={clearFilters} className="min-h-10 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Изчисти</button>
      </div>
    </div>}

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}

    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-stone-900">Получени заявки</h2>
        {loading && <span className="text-xs text-stone-500">Зареждане…</span>}
      </div>
      {!loading && leads.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">Няма заявки, отговарящи на избраните филтри.</div>}

      {leads.map((lead) => {
        const isOpen = selectedId === lead.id
        const detail = selected?.id === lead.id ? selected : null
        return <div key={lead.id} className={'overflow-hidden rounded-2xl border bg-white shadow-sm transition ' + (isOpen ? 'border-lime-700 ring-1 ring-lime-700' : 'border-stone-200')}>
          <button type="button" onClick={() => {
            if (isOpen) { setSelectedId(''); setSelected(null); setEvents([]); setComment(''); setStatusNote('') }
            else { setSelectedId(lead.id); setSelected(null); setEvents([]); setComment(''); setStatusNote('') }
          }} aria-expanded={isOpen} className="w-full p-4 text-left transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-700">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className={'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ' + statusClass(lead.status)}>{statusLabel(lead.status)}</span>
                <span className="text-xs font-semibold text-stone-500">{lead.lead_number}</span>
                <span className="font-semibold text-stone-900">{lead.service_name}</span>
              </div>
              <span aria-hidden="true" className="text-lg text-stone-500">{isOpen ? '⌃' : '⌄'}</span>
            </div>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-center">
              <div className="font-semibold text-stone-900">{lead.customer_name}</div>
              <div className="text-stone-600">{lead.location}{lead.address ? ' · ' + lead.address : ''}</div>
              <div className="text-stone-600">{lead.phone}</div>
              <div className="text-xs text-stone-500 xl:text-right">{dateLabel(lead.created_at)}</div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className={lead.assigned_name ? 'text-lime-800' : 'text-stone-500'}>{lead.assigned_name ? 'Отговорник: ' + lead.assigned_name : 'Без отговорник'}</span>
              {lead.comment && <span className="max-w-full truncate text-stone-500">{lead.comment}</span>}
            </div>
          </button>

          {isOpen && <div className="border-t border-stone-200 bg-stone-50/70 p-4 sm:p-5">
            {!detail && <p className="py-5 text-center text-sm text-stone-500">Зареждане на детайлите…</p>}
            {detail && <>
              <div className="grid gap-4 lg:grid-cols-3">
                <article className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-bold text-stone-900">Клиент</h3>
                  <dl className="space-y-2 text-sm">
                    <div><dt className="text-xs text-stone-500">Име</dt><dd className="font-semibold text-stone-900">{detail.customer_name}</dd></div>
                    <div><dt className="text-xs text-stone-500">Телефон</dt><dd><a className="font-semibold text-lime-800 underline-offset-2 hover:underline" href={'tel:' + detail.phone}>{detail.phone}</a></dd></div>
                    <div><dt className="text-xs text-stone-500">Email</dt><dd>{detail.email ? <a className="break-all font-semibold text-lime-800 underline-offset-2 hover:underline" href={'mailto:' + detail.email}>{detail.email}</a> : 'Не е посочен'}</dd></div>
                    <div><dt className="text-xs text-stone-500">Език на заявката</dt><dd>{detail.locale.toUpperCase()}</dd></div>
                  </dl>
                </article>
                <article className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-bold text-stone-900">Услуга и обект</h3>
                  <dl className="space-y-2 text-sm">
                    <div><dt className="text-xs text-stone-500">Услуга</dt><dd className="font-semibold text-stone-900">{detail.service_name}</dd></div>
                    <div><dt className="text-xs text-stone-500">Населено място</dt><dd>{detail.location}</dd></div>
                    <div><dt className="text-xs text-stone-500">Адрес / обект</dt><dd>{detail.address || 'Не е посочен'}</dd></div>
                  </dl>
                </article>
                <article className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-bold text-stone-900">Описание на клиента</h3>
                  <p className="whitespace-pre-wrap break-words text-sm text-stone-700">{detail.comment || 'Няма допълнително описание.'}</p>
                  {detail.fields_json && Object.keys(detail.fields_json).length > 0 && <div className="mt-3 border-t border-stone-100 pt-3">
                    <h4 className="text-xs font-bold text-stone-700">Допълнителни данни</h4>
                    {Object.entries(detail.fields_json).map(([key, value]) => <div key={key} className="mt-1 break-words text-sm"><span className="text-stone-500">{key}: </span>{String(value)}</div>)}
                  </div>}
                </article>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                <span>Получена: {dateLabel(detail.created_at)}</span><span>Последна промяна: {dateLabel(detail.updated_at)}</span>
              </div>

              {canManage && <article className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="font-semibold text-stone-900">Обработка на заявката</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-stone-700">Статус<select className={inputClass + ' mt-1'} value={detail.status} disabled={saving} onChange={(e) => void mutate({ action: 'status', leadId: detail.id, status: e.target.value, note: statusNote }, 'Статусът е обновен.')}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                  <label className="block text-sm font-semibold text-stone-700">Отговорник<select className={inputClass + ' mt-1'} value={detail.assigned_to || ''} disabled={saving} onChange={(e) => void mutate({ action: 'assign', leadId: detail.id, assignedTo: e.target.value || null }, 'Отговорникът е променен.')}><option value="">Без отговорник</option>{assignees.map((item) => <option key={item.user_id} value={item.user_id}>{item.display_name} · {item.role === 'owner' ? 'Собственик' : item.role === 'manager' ? 'Мениджър' : 'Служител'}</option>)}</select></label>
                  <label className="block text-sm font-semibold text-stone-700 sm:col-span-2">Бележка към промяната (незадължително)<input className={inputClass + ' mt-1'} maxLength={500} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Кратка служебна бележка" /></label>
                </div>
              </article>}

              <article className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="font-semibold text-stone-900">История на заявката</h3>
                {events.length === 0 && <p className="mt-3 text-sm text-stone-500">Все още няма събития.</p>}
                <div className="mt-3 space-y-3">{events.map((event) => <div key={event.id} className="border-l-2 border-stone-200 pl-3">
                  <div className="text-sm font-semibold text-stone-800">{eventLabel(event)}</div><div className="mt-0.5 text-xs text-stone-500">{event.actor_name || (event.actor_role === 'system' ? 'Система' : 'Служител')} · {dateLabel(event.created_at)}</div>
                  {event.from_status && event.to_status && <div className="mt-1 text-sm">{statusLabel(event.from_status)} → {statusLabel(event.to_status)}</div>}
                  {event.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-700">{event.note}</p>}
                  {event.event_type === 'assignment_changed' && <p className="mt-1 text-xs text-stone-500">Нов отговорник: {String(event.metadata?.assignedName || 'не е зададен')}</p>}
                </div>)}</div>
              </article>

              {canManage && <article className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="font-semibold text-stone-900">Вътрешен коментар</h3>
                <p className="mt-1 text-xs text-stone-500">Коментарът е видим само на служителите с достъп до заявките и не се изпраща на клиента.</p>
                <textarea className={inputClass + ' mt-3'} rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Добавете вътрешна бележка…" />
                <button type="button" disabled={saving || !comment.trim()} onClick={async () => { const ok = await mutate({ action: 'comment', leadId: detail.id, note: comment }, 'Коментарът е записан.'); if (ok) setComment('') }} className="mt-3 min-h-10 rounded-xl bg-lime-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lime-900 disabled:opacity-50">Запази коментар</button>
              </article>}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <a href={'tel:' + detail.phone} className="inline-flex min-h-10 items-center rounded-xl border border-lime-800 bg-white px-4 py-2 text-sm font-semibold text-lime-900 hover:bg-lime-50">Обади се на клиента</a>
                  {detail.email && <a href={'mailto:' + detail.email} className="inline-flex min-h-10 items-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Изпрати email</a>}
                </div>
                <button type="button" onClick={() => { setSelectedId(''); setSelected(null); setEvents([]); setComment(''); setStatusNote('') }} className="min-h-10 rounded-xl bg-lime-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-lime-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700 focus-visible:ring-offset-2">OK</button>
              </div>
            </>}
          </div>}
        </div>
      })}
    </section>
  </div>
}
