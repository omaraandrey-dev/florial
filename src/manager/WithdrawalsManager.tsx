import { useCallback, useEffect, useState } from 'react'

type Withdrawal = {
  id: string
  order_id: string | null
  contract_reference: string
  customer_name: string
  customer_email: string
  locale: 'bg' | 'ru' | 'en'
  declaration_text: string
  customer_comment: string | null
  status: string
  confirmation_status: string
  confirmation_sent_at: string | null
  confirmation_error: string | null
  review_note: string | null
  submitted_at: string
  created_at: string
  updated_at: string
}
type Event = { id: string; actor_name: string | null; actor_role: string; event_type: string; from_status: string | null; to_status: string | null; note: string | null; created_at: string }
type Props = { canManage: boolean }
const statuses = [
  ['received', 'Получено'],
  ['review_required', 'Нужна е проверка'],
  ['awaiting_return', 'Очаква се връщане'],
  ['refund_in_progress', 'Възстановяване в процес'],
  ['completed', 'Приключено'],
]
const statusLabel = (value: string) => statuses.find(([key]) => key === value)?.[1] || value
const confirmationLabel = (value: string) => ({
  sent: 'Изпратено',
  pending: 'Очаква изпращане',
  failed: 'Грешка при изпращане',
  not_configured: 'Имейлът не е конфигуриран',
} as Record<string, string>)[value] || value
const dateLabel = (value: string) => new Date(value).toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' })
const inputClass = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-lime-700 focus:ring-2 focus:ring-lime-100'

export default function WithdrawalsManager({ canManage }: Props) {
  const [rows, setRows] = useState<Withdrawal[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [selected, setSelected] = useState<Withdrawal | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [draftStatus, setDraftStatus] = useState('received')
  const [reviewNote, setReviewNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadRows = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (filterStatus) params.set('status', filterStatus)
      const response = await fetch('/api/manager/withdrawals?' + params.toString(), { credentials: 'same-origin', cache: 'no-store' })
      const data = await response.json() as { withdrawals?: Withdrawal[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'Не успяхме да заредим заявленията.')
      setRows(data.withdrawals || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не успяхме да заредим заявленията.')
    } finally { setLoading(false) }
  }, [query, filterStatus])

  const loadDetail = useCallback(async (id: string) => {
    if (!id) return
    try {
      const response = await fetch('/api/manager/withdrawals?id=' + encodeURIComponent(id), { credentials: 'same-origin', cache: 'no-store' })
      const data = await response.json() as { withdrawal?: Withdrawal; events?: Event[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'Не успяхме да отворим заявлението.')
      setSelected(data.withdrawal || null)
      setEvents(data.events || [])
      if (data.withdrawal) {
        setDraftStatus(data.withdrawal.status)
        setReviewNote(data.withdrawal.review_note || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не успяхме да отворим заявлението.')
    }
  }, [])

  useEffect(() => { void loadRows() }, [loadRows])
  useEffect(() => { if (selectedId) void loadDetail(selectedId) }, [selectedId, loadDetail])

  const save = async () => {
    if (!selected) return
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/manager/withdrawals', {
        method: 'PATCH', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status: draftStatus, reviewNote }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Не успяхме да запазим промените.')
      setNotice('Промените са запазени.')
      await loadRows()
      await loadDetail(selected.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не успяхме да запазим промените.')
    } finally { setSaving(false) }
  }

  const resend = async () => {
    if (!selected) return
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/manager/withdrawals', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend_confirmation', id: selected.id }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Не успяхме да изпратим потвърждението.')
      setNotice('Потвърждението е изпратено повторно.')
      await loadRows()
      await loadDetail(selected.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не успяхме да изпратим потвърждението.')
    } finally { setSaving(false) }
  }

  const newCount = rows.filter((row) => row.status === 'received').length
  const pendingEmail = rows.filter((row) => row.confirmation_status !== 'sent').length

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Откази от договори</h1><p className="mt-1 text-sm text-stone-600">Регистрирани онлайн заявления и потвърждения към клиентите.</p></div>
      <button type="button" onClick={() => void loadRows()} disabled={loading} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{loading ? 'Обновяване…' : 'Обнови списъка'}</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-stone-200 bg-white p-4"><div className="text-sm text-stone-500">Общо в списъка</div><div className="mt-1 text-2xl font-semibold tabular-nums">{rows.length}</div></div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4"><div className="text-sm text-stone-500">Нови</div><div className="mt-1 text-2xl font-semibold tabular-nums">{newCount}</div></div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4"><div className="text-sm text-stone-500">Потвърждение за проверка</div><div className="mt-1 text-2xl font-semibold tabular-nums">{pendingEmail}</div></div>
    </div>
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-stone-600">Търсене<input className={inputClass + ' mt-1'} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Референция, име, имейл…" /></label>
        <label className="text-xs font-semibold text-stone-600">Статус<select className={inputClass + ' mt-1'} value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option value="">Всички статуси</option>{statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </div>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm text-lime-900">{notice}</div>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="space-y-3">
        <h2 className="font-semibold">Получени заявления</h2>
        {loading && <p className="text-sm text-stone-500">Зареждане…</p>}
        {!loading && rows.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">Няма заявления за избраните филтри.</div>}
        {rows.map((row) => <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} className={'w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ' + (selectedId === row.id ? 'border-lime-700 ring-1 ring-lime-700' : 'border-stone-200 hover:border-lime-600')}>
          <div className="flex flex-wrap items-start justify-between gap-2"><span className="font-semibold">{row.contract_reference}</span><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold">{statusLabel(row.status)}</span></div>
          <div className="mt-2 font-semibold">{row.customer_name}</div>
          <div className="mt-1 break-all text-sm text-stone-600">{row.customer_email}</div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-stone-500"><span>{row.locale.toUpperCase()} · {confirmationLabel(row.confirmation_status)}</span><span>{dateLabel(row.submitted_at)}</span></div>
        </button>)}
      </section>
      <section className="min-w-0 space-y-4">
        <h2 className="font-semibold">Детайли на заявлението</h2>
        {!selected && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">Изберете заявление от списъка.</div>}
        {selected && <>
          <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs text-stone-500">{selected.contract_reference}</div><h3 className="mt-1 text-xl font-semibold">{selected.customer_name}</h3></div><span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-900">{statusLabel(selected.status)}</span></div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-stone-500">Имейл</dt><dd><a className="break-all font-semibold text-lime-800" href={'mailto:' + selected.customer_email}>{selected.customer_email}</a></dd></div>
              <div><dt className="text-xs text-stone-500">Език</dt><dd>{selected.locale.toUpperCase()}</dd></div>
              <div><dt className="text-xs text-stone-500">Свързана поръчка</dt><dd>{selected.order_id ? 'Да' : 'Не — необходима е ръчна проверка'}</dd></div>
              <div><dt className="text-xs text-stone-500">Подадено</dt><dd>{dateLabel(selected.submitted_at)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-stone-500">Съдържание на заявлението</dt><dd className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-stone-50 p-3">{selected.declaration_text}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-stone-500">Потвърждение по имейл</dt><dd>{confirmationLabel(selected.confirmation_status)}{selected.confirmation_sent_at ? ' · ' + dateLabel(selected.confirmation_sent_at) : ''}</dd></div>
              {selected.confirmation_error && <div className="sm:col-span-2 text-sm text-red-700">{selected.confirmation_error}</div>}
            </dl>
            {canManage && selected.confirmation_status !== 'sent' && <button type="button" disabled={saving} onClick={() => void resend()} className="mt-4 rounded-xl border border-lime-800 px-4 py-2.5 text-sm font-semibold text-lime-900 disabled:opacity-50">Изпрати потвърждението повторно</button>}
          </article>
          {canManage && <article className="rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="font-semibold">Обработка</h3>
            <label className="mt-3 block text-xs font-semibold text-stone-600">Статус<select className={inputClass + ' mt-1'} value={draftStatus} disabled={saving} onChange={(event) => setDraftStatus(event.target.value)}>{statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label className="mt-3 block text-xs font-semibold text-stone-600">Вътрешна бележка<textarea rows={3} maxLength={1000} className={inputClass + ' mt-1'} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Бележка само за екипа на Florial…" /></label>
            <button type="button" disabled={saving} onClick={() => void save()} className="mt-3 rounded-xl bg-lime-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Запазване…' : 'Запази промените'}</button>
          </article>}
          <article className="rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="font-semibold">История</h3>
            {events.length === 0 && <p className="mt-3 text-sm text-stone-500">Все още няма събития.</p>}
            <div className="mt-3 space-y-3">{events.map((event) => <div key={event.id} className="border-l-2 border-stone-200 pl-3"><div className="text-sm font-semibold">{event.event_type}</div><div className="mt-0.5 text-xs text-stone-500">{event.actor_name || 'Система'} · {dateLabel(event.created_at)}</div>{event.note && <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">{event.note}</p>}</div>)}</div>
          </article>
        </>}
      </section>
    </div>
  </div>
}
