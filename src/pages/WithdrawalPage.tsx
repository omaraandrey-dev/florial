import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type Locale = 'bg' | 'ru' | 'en'
type Result = { accepted: boolean; message?: string; confirmationStatus?: string; reference?: string }

const localeFromUrl = (): Locale => {
  const value = new URLSearchParams(window.location.search).get('lang')
  return value === 'ru' || value === 'en' ? value : 'bg'
}

const translations: Record<Locale, Record<string, string>> = {
  bg: {
    title: 'Откажете се от договора тук',
    intro: 'Тази функция Ви позволява да изпратите онлайн заявление за отказ от договор, сключен от разстояние чрез онлайн интерфейса на Florial.',
    notice: 'В предвидените от закона случаи потребителят има 14-дневен срок за отказ; началният момент зависи от вида на договора. Правото и срокът зависят от приложимите законови правила. Подаването се регистрира с дата и час. Florial ще прегледа заявлението; формата не решава автоматично дали е приложимо законово изключение.',
    standardForm: 'Стандартен формуляр за отказ (Приложение № 6)',,
    name: 'Име и фамилия',
    reference: 'Номер на поръчка или данни, идентифициращи договора',
    email: 'Имейл адрес за потвърждение',
    comment: 'Допълнителна информация (незадължително)',
    commentHint: 'Не е необходимо да посочвате причина за отказа.',
    continue: 'Преглед на заявлението',
    confirm: 'Потвърждавам отказа',
    back: 'Назад и редакция',
    summary: 'Проверете заявлението преди изпращане',
    declaration: 'Съдържание на заявлението',
    submitted: 'Дата и часът ще бъдат записани от сървъра при изпращане.',
    privacy: 'Данните се използват за идентифициране на договора и обработване на заявлението съгласно Политиката за поверителност.',
    success: 'Заявлението е регистрирано.',
    pending: 'Заявлението е получено, но потвърждението по имейл все още не е изпратено. Свържете се с Florial, ако не получите потвърждение.',
    error: 'Не успяхме да изпратим заявлението. Моля, опитайте отново.',
    required: 'Попълнете задължителните полета.',
    contact: 'Нуждаете се от съдействие? Свържете се с Florial: +359 876 777 902.',
    receivedRef: 'Референция',
  },
  ru: {
    title: 'Откажитесь от договора здесь',
    intro: 'Эта функция позволяет отправить онлайн-заявление об отказе от договора, заключённого дистанционно через интерфейс Florial.',
    notice: 'В предусмотренных законом случаях потребитель имеет 14 дней для отказа; начало срока зависит от вида договора. Право и срок определяются применимыми нормами закона. Заявление регистрируется с датой и временем. Florial рассмотрит заявление; форма автоматически не определяет применимость законного исключения.',
    standardForm: 'Стандартная форма отказа (Приложение № 6)',,
    name: 'Имя и фамилия',
    reference: 'Номер заказа или данные, идентифицирующие договор',
    email: 'Электронная почта для подтверждения',
    comment: 'Дополнительная информация (необязательно)',
    commentHint: 'Указывать причину отказа не требуется.',
    continue: 'Проверить заявление',
    confirm: 'Подтверждаю отказ',
    back: 'Назад и изменить',
    summary: 'Проверьте заявление перед отправкой',
    declaration: 'Содержание заявления',
    submitted: 'Дата и время будут зафиксированы сервером при отправке.',
    privacy: 'Данные используются для идентификации договора и обработки заявления согласно Политике конфиденциальности.',
    success: 'Заявление зарегистрировано.',
    pending: 'Заявление получено, но подтверждение по электронной почте пока не отправлено. Свяжитесь с Florial, если не получите подтверждение.',
    error: 'Не удалось отправить заявление. Попробуйте ещё раз.',
    required: 'Заполните обязательные поля.',
    contact: 'Нужна помощь? Свяжитесь с Florial: +359 876 777 902.',
    receivedRef: 'Референция',
  },
  en: {
    title: 'Withdraw from the contract here',
    intro: 'Use this function to submit an online withdrawal declaration for a distance contract concluded through the Florial online interface.',
    notice: 'Where provided by law, consumers have 14 days to withdraw; the start of the period depends on the contract type. The right and time limit are governed by applicable law. Your declaration is registered with a date and time. Florial will review it; the form does not automatically determine whether a legal exception applies.',
    standardForm: 'Standard withdrawal form (Annex No. 6)',,
    name: 'Full name',
    reference: 'Order number or information identifying the contract',
    email: 'Email address for confirmation',
    comment: 'Additional information (optional)',
    commentHint: 'You do not need to give a reason for withdrawal.',
    continue: 'Review declaration',
    confirm: 'Confirm withdrawal',
    back: 'Back and edit',
    summary: 'Review your declaration before sending',
    declaration: 'Declaration content',
    submitted: 'The server will record the submission date and time.',
    privacy: 'Your data is used to identify the contract and process the declaration under the Privacy Policy.',
    success: 'Your declaration has been registered.',
    pending: 'Your declaration was received, but the email confirmation has not been sent yet. Please contact Florial if you do not receive confirmation.',
    error: 'We could not submit the declaration. Please try again.',
    required: 'Complete the required fields.',
    contact: 'Need help? Contact Florial: +359 876 777 902.',
    receivedRef: 'Reference',
  },
}

export function WithdrawalPage() {
  const locale = useMemo(localeFromUrl, [])
  const t = translations[locale]
  const [customerName, setCustomerName] = useState('')
  const [contractReference, setContractReference] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [review, setReview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const declaration = locale === 'ru'
    ? 'Настоящим однозначно заявляю о желании отказаться от договора, идентифицированного следующим образом: ' + contractReference.trim() + '. Имя потребителя: ' + customerName.trim() + '.' + (comment.trim() ? ' Дополнительная информация: ' + comment.trim() : '')
    : locale === 'en'
      ? 'I hereby unequivocally declare that I wish to withdraw from the contract identified as: ' + contractReference.trim() + '. Consumer name: ' + customerName.trim() + '.' + (comment.trim() ? ' Additional information: ' + comment.trim() : '')
      : 'С настоящото заявявам недвусмислено, че желая да се откажа от договор, идентифициран с: ' + contractReference.trim() + '. Име на потребителя: ' + customerName.trim() + '.' + (comment.trim() ? ' Допълнителна информация: ' + comment.trim() : '')

  const continueToReview = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!customerName.trim() || !contractReference.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.required)
      return
    }
    setReview(true)
  }

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, contractReference, email, comment, locale }),
      })
      const data = await response.json() as Result & { error?: string }
      if (!response.ok || !data.accepted) throw new Error(data.error || t.error)
      setResult(data)
      setReview(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setBusy(false)
    }
  }

  const heading = locale === 'bg' ? 'Право на отказ от договор' : locale === 'ru' ? 'Право на отказ от договора' : 'Right to withdraw from a contract'

  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
    <div className="mb-5 flex justify-end gap-2 text-sm">
      <a className={locale === 'bg' ? 'font-bold text-lime-800' : 'text-stone-500 hover:text-lime-800'} href="/withdrawal">BG</a>
      <span className="text-stone-300">|</span>
      <a className={locale === 'ru' ? 'font-bold text-lime-800' : 'text-stone-500 hover:text-lime-800'} href="/withdrawal?lang=ru">RU</a>
      <span className="text-stone-300">|</span>
      <a className={locale === 'en' ? 'font-bold text-lime-800' : 'text-stone-500 hover:text-lime-800'} href="/withdrawal?lang=en">EN</a>
    </div>
    <header className="mb-7">
      <p className="text-sm font-semibold uppercase tracking-wide text-lime-800">Florial</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight text-stone-900">{heading}</h1>
      <p className="mt-4 text-base leading-7 text-stone-600">{t.intro}</p>
    </header>

    {result ? <section className="rounded-2xl border border-lime-200 bg-lime-50 p-6" role="status" aria-live="polite">
      <h2 className="text-xl font-semibold text-lime-950">{t.success}</h2>
      <p className="mt-3 leading-7 text-stone-700">{result.message || t.success}</p>
      {result.reference && <p className="mt-3 text-sm text-stone-600">{t.receivedRef}: <strong>{result.reference}</strong></p>}
      {result.confirmationStatus !== 'sent' && <p className="mt-3 text-sm text-stone-700">{t.pending}</p>}
      <p className="mt-4 text-sm text-stone-600">{t.contact}</p>
    </section> : <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{t.notice}</div>
      <p className="mb-6 text-sm"><a className="font-semibold text-lime-800 underline" href="https://www.mi.government.bg/file/2026/03/zzp_6.03.2026.pdf" target="_blank" rel="noreferrer">{t.standardForm}</a></p>
      {!review ? <form className="space-y-5" onSubmit={continueToReview}>
        <label className="block text-sm font-semibold text-stone-700">{t.name}
          <input required autoComplete="name" maxLength={160} value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-3 text-base font-normal outline-none focus:border-lime-700 focus:ring-2 focus:ring-lime-100" />
        </label>
        <label className="block text-sm font-semibold text-stone-700">{t.reference}
          <input required maxLength={100} value={contractReference} onChange={(event) => setContractReference(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-3 text-base font-normal outline-none focus:border-lime-700 focus:ring-2 focus:ring-lime-100" />
        </label>
        <label className="block text-sm font-semibold text-stone-700">{t.email}
          <input required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-3 text-base font-normal outline-none focus:border-lime-700 focus:ring-2 focus:ring-lime-100" />
        </label>
        <label className="block text-sm font-semibold text-stone-700">{t.comment}
          <textarea rows={3} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-3 text-base font-normal outline-none focus:border-lime-700 focus:ring-2 focus:ring-lime-100" />
          <span className="mt-1 block text-xs font-normal text-stone-500">{t.commentHint}</span>
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-lime-800 px-5 py-3.5 text-sm font-semibold text-white hover:bg-lime-900">{t.continue}</button>
      </form> : <div>
        <h2 className="text-xl font-semibold text-stone-900">{t.summary}</h2>
        <dl className="mt-4 grid gap-3 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-stone-500">{t.name}</dt><dd className="mt-1 break-words font-semibold">{customerName}</dd></div>
          <div><dt className="text-stone-500">{t.reference}</dt><dd className="mt-1 break-words font-semibold">{contractReference}</dd></div>
          <div className="sm:col-span-2"><dt className="text-stone-500">{t.email}</dt><dd className="mt-1 break-all font-semibold">{email}</dd></div>
        </dl>
        <h3 className="mt-5 font-semibold">{t.declaration}</h3>
        <p className="mt-2 whitespace-pre-wrap rounded-xl border border-stone-200 p-4 text-sm leading-6 text-stone-700">{declaration}</p>
        <p className="mt-3 text-xs leading-5 text-stone-500">{t.submitted}</p>
        <p className="mt-2 text-xs leading-5 text-stone-500">{t.privacy} <a href="/privacy-policy" className="font-semibold text-lime-800 underline">Privacy Policy</a></p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={() => { setReview(false); setError('') }} className="rounded-xl border border-stone-300 px-5 py-3.5 text-sm font-semibold text-stone-700 disabled:opacity-50">{t.back}</button>
          <button type="button" disabled={busy} onClick={() => void submit()} className="rounded-xl bg-lime-800 px-5 py-3.5 text-sm font-semibold text-white hover:bg-lime-900 disabled:opacity-50">{busy ? '…' : t.confirm}</button>
        </div>
      </div>}
    </section>}
    <p className="mt-6 text-sm leading-6 text-stone-500">{t.contact}</p>
  </main>
}
