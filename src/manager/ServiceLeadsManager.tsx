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

  const selectedLabel = selected ? statusLabel(selected.status) : ''
  const newCount = leads.filter((lead) => lead.status === 'new').length
  const activeCount = leads.filter((lead) => !['completed', 'rejected', 'closed'].includes(lead.status)).length

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Заявки за услуги</h1><p className="mt-1 text-sm text-stone-600">Клиентски запитвания за монтаж, поливане, озеленяване и поддръжка.</p></div>
      <button type="button" onClick={() => void loadLeads()} disabled={loading} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{loading ? 'Обновяване…' : 'Обнови списъка'}</button>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-stone-200 bg-white p-4"><div className="text-sm text-stone-500">В показания списък</div><div className="mt-1 text-2xl font-semibold tabular-nums">{leads.length}</div></div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4"><div className="text-sm text-stone-500">Нови</div><div className="mt-1 text-2xl font-semibold tabular-nums">{newCount}</div></div>
      <div className="col-span-2 rounded-2xl border border-stone-200 bg-white p-4 sm:col-span-1"><div className="text-sm text-stone-500">Активни</div><div className="mt-1 text-2xl font-semibold tabular-nums">{activeCount}</div></div>
    </div>
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="mb-3 font-semibold">Търсене и филтри</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-stone-600">Търсене<input className={inputClass + ' mt-1'} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Номер, име, телефон, email…" /></label>
        <label className="text-xs font-semibold text-stone-600">Статус<select className={inputClass + ' mt-1'} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Всички статуси</option>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="text-xs font-semibold text-stone-600">Услуга<select className={inputClass + ' mt-1'} value={service} onChange={(e) => setService(e.target.value)}><option value="">Всички услуги</option>{services.map((item) => <option key={item.service_slug} value={item.service_slug}>{item.service_name} ({item.lead_count})</option>)}</select></label>
        <label className="text-xs font-semibold text-stone-600">Населено място<input className={inputClass + ' mt-1'} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Несебър, Равда…" /></label>
        <label className="text-xs font-semibold text-stone-600">Отговорник<select className={inputClass + ' mt-1'} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}><option value="">Всички</option><option value="unassigned">Без отговорник</option>{assignees.map((item) => <option key={item.user_id} value={item.user_id}>{item.display_name} · {item.role === 'owner' ? 'Собственик' : item.role === 'manager' ? 'Мениджър' : 'Служител'}</option>)}</select></label>
        <label className="text-xs font-semibold text-stone-600">От дата<input type="date" className={inputClass + ' mt-1'} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs font-semibold text-stone-600">До дата<input type="date" className={inputClass + ' mt-1'} value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <div className="mt-3 flex justify-end"><button type="button" onClick={() => { setQuery(''); setStatus(''); setService(''); setLocation(''); setAssignedTo(''); setFrom(''); setTo('') }} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold">Изчисти филтрите</button></div>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
      <section className="space-y-3">
        <h2 className="font-semibold">Получени заявки</h2>
        {loading && <p className="text-sm text-stone-500">Зареждане…</p>}
        {!loading && leads.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">Няма заявки, отговарящи на избраните филтри.</div>}
        {leads.map((lead) => <button key={lead.id} type="button" onClick={() => setSelectedId(lead.id)} className={'w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ' + (selectedId === lead.id ? 'border-lime-700 ring-1 ring-lime-700' : 'border-stone-200 hover:border-lime-600')}>
          <div className="flex flex-wrap items-start justify-between gap-2"><span className="font-semibold">{lead.lead_number}</span><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold">{statusLabel(lead.status)}</span></div>
          <div className="mt-2 font-semibold">{lead.customer_name}</div>
          <div className="mt-1 text-sm text-stone-600">{lead.service_name} · {lead.location}</div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500"><span>{lead.phone}{lead.email ? ' · ' + lead.email : ''}</span><span>{dateLabel(lead.created_at)}</span></div>
          {lead.assigned_name && <div className="mt-2 text-xs text-lime-800">Отговорник: {lead.assigned_name}</div>}
        </button>)}
      </section>
      <section className="min-w-0 space-y-4">
        <h2 className="font-semibold">Детайли за заявката</h2>
        {!selected && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">Изберете заявка от списъка.</div>}
        {selected && <>
          <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs text-stone-500">{selected.lead_number}</div><h3 className="mt-1 text-xl font-semibold">{selected.customer_name}</h3><p className="mt-1 text-sm text-stone-600">{selected.service_name}</p></div><span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-900">{selectedLabel}</span></div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-stone-500">Телефон</dt><dd><a className="font-semibold text-lime-800" href={'tel:' + selected.phone}>{selected.phone}</a></dd></div>
              <div><dt className="text-xs text-stone-500">Email</dt><dd>{selected.email ? <a className="break-all font-semibold text-lime-800" href={'mailto:' + selected.email}>{selected.email}</a> : 'Не е посочен'}</dd></div>
              <div><dt className="text-xs text-stone-500">Населено място</dt><dd>{selected.location}</dd></div>
              <div><dt className="text-xs text-stone-500">Език</dt><dd>{selected.locale.toUpperCase()}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-stone-500">Адрес / обект</dt><dd>{selected.address || 'Не е посочен'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-stone-500">Описание на клиента</dt><dd className="whitespace-pre-wrap break-words">{selected.comment || 'Няма допълнително описание.'}</dd></div>
            </dl>
            {selected.fields_json && Object.keys(selected.fields_json).length > 0 && <div className="mt-4 rounded-xl bg-stone-50 p-3"><h4 className="text-sm font-semibold">Допълнителни данни</h4>{Object.entries(selected.fields_json).map(([key, value]) => <div key={key} className="mt-1 text-sm"><span className="text-stone-500">{key}: </span>{String(value)}</div>)}</div>}
            <p className="mt-4 text-xs text-stone-500">Получена: {dateLabel(selected.created_at)} · Обновена: {dateLabel(selected.updated_at)}</p>
          </article>
          {canManage && <article className="rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="font-semibold">Обработка на заявката</h3>
            <label className="mt-3 block text-xs font-semibold text-stone-600">Статус<select className={inputClass + ' mt-1'} value={selected.status} disabled={saving} onChange={(e) => void mutate({ action: 'status', leadId: selected.id, status: e.target.value, note: statusNote }, 'Статусът е обновен.')}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="mt-3 block text-xs font-semibold text-stone-600">Бележка към промяната (незадължително)<input className={inputClass + ' mt-1'} maxLength={500} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Кратка служебна бележка" /></label>
            <label className="mt-3 block text-xs font-semibold text-stone-600">Отговорник<select className={inputClass + ' mt-1'} value={selected.assigned_to || ''} disabled={saving} onChange={(e) => void mutate({ action: 'assign', leadId: selected.id, assignedTo: e.target.value || null }, 'Отговорникът е променен.')}><option value="">Без отговорник</option>{assignees.map((item) => <option key={item.user_id} value={item.user_id}>{item.display_name} · {item.role === 'owner' ? 'Собственик' : item.role === 'manager' ? 'Мениджър' : 'Служител'}</option>)}</select></label>
          </article>}
          <article className="rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="font-semibold">История на заявката</h3>
            {events.length === 0 && <p className="mt-3 text-sm text-stone-500">Все още няма събития.</p>}
            <div className="mt-3 space-y-3">{events.map((event) => <div key={event.id} className="border-l-2 border-stone-200 pl-3">
              <div className="text-sm font-semibold">{eventLabel(event)}</div><div className="mt-0.5 text-xs text-stone-500">{event.actor_name || (event.actor_role === 'system' ? 'Система' : 'Служител')} · {dateLabel(event.created_at)}</div>
              {event.from_status && event.to_status && <div className="mt-1 text-sm">{statusLabel(event.from_status)} → {statusLabel(event.to_status)}</div>}
              {event.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-700">{event.note}</p>}
              {event.event_type === 'assignment_changed' && <p className="mt-1 text-xs text-stone-500">Нов отговорник: {String(event.metadata?.assignedName || 'не е зададен')}</p>}
            </div>)}</div>
          </article>
          {canManage && <article className="rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="font-semibold">Вътрешен коментар</h3>
            <p className="mt-1 text-xs text-stone-500">Коментарът е видим само на служителите с достъп до заявките и не се изпраща на клиента.</p>
            <textarea className={inputClass + ' mt-3'} rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Добавете вътрешна бележка…" />
            <button type="button" disabled={saving || !comment.trim()} onClick={async () => { const ok = await mutate({ action: 'comment', leadId: selected.id, note: comment }, 'Коментарът е записан.'); if (ok) setComment('') }} className="mt-3 rounded-xl bg-lime-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Запази коментар</button>
          </article>}
        </>}
      </section>
    </div>
  </div>
}
