import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'

type LawnShape = 'rectangle' | 'l-shape' | 'irregular'
type WaterSource = 'mains' | 'well' | 'tank' | 'unknown'

interface IrrigationAssistantPageProps {
  onNavigateHome: () => void
}

export function IrrigationAssistantPage({ onNavigateHome }: IrrigationAssistantPageProps) {
  const { language } = useI18n()
  const [step, setStep] = useState(1)
  const [shape, setShape] = useState<LawnShape>('rectangle')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [area, setArea] = useState('')
  const [waterSource, setWaterSource] = useState<WaterSource>('unknown')
  const [flowRate, setFlowRate] = useState('')
  const [pressure, setPressure] = useState('')
  const [notes, setNotes] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  const copy = useMemo(() => {
    if (language === 'ru') return {
      title: 'Помощник подбора полива Florial',
      intro: 'Начнём с автоматического полива газона. Ответьте на несколько вопросов об участке и источнике воды — это поможет подготовить технически корректный подбор.',
      back: 'На главную', module: 'Модуль 1 · Газон', step: 'Шаг', of: 'из 3',
      areaTitle: 'Расскажите о газоне', shape: 'Форма участка',
      rectangle: 'Прямоугольный', lShape: 'Г-образный', irregular: 'Сложная форма',
      length: 'Длина, м', width: 'Ширина, м', areaLabel: 'Площадь газона, м²',
      next: 'Далее', prev: 'Назад', waterTitle: 'Источник воды',
      mains: 'Водопровод', well: 'Скважина / колодец', tank: 'Резервуар / ёмкость', unknown: 'Пока не знаю',
      flow: 'Измеренный расход, л/мин', pressure: 'Давление, бар',
      optional: 'Если знаете — укажите. Если нет, оставьте поле пустым.',
      detailsTitle: 'Дополнительные сведения', notes: 'Например: форма газона, дорожки, уклоны, места, которые нельзя поливать.',
      finish: 'Сформировать исходные данные', summaryTitle: 'Исходные данные участка',
      summaryArea: 'Площадь', summaryShape: 'Форма', summaryWater: 'Источник воды',
      summaryFlow: 'Расход', summaryPressure: 'Давление', summaryNotes: 'Примечания',
      ready: 'Данные собраны', disclaimer: 'Это первый этап подбора, а не готовый гидравлический проект. Точное количество дождевателей, зон, диаметры труб и список совместимого оборудования определяются после проверки расхода и рабочего давления, геометрии участка и характеристик конкретных моделей. Мы не будем подставлять приблизительные значения вместо инженерного расчёта.',
      restart: 'Изменить ответы', home: 'Вернуться в магазин', unit: 'м²', flowUnit: 'л/мин',
    }
    if (language === 'en') return {
      title: 'Florial Irrigation Assistant',
      intro: 'Let’s start with automatic lawn irrigation. Answer a few questions about the site and water supply to prepare a technically sound equipment selection.',
      back: 'Home', module: 'Module 1 · Lawn', step: 'Step', of: 'of 3',
      areaTitle: 'Tell us about your lawn', shape: 'Plot shape',
      rectangle: 'Rectangle', lShape: 'L-shaped', irregular: 'Irregular',
      length: 'Length, m', width: 'Width, m', areaLabel: 'Lawn area, m²',
      next: 'Continue', prev: 'Back', waterTitle: 'Water source',
      mains: 'Mains water', well: 'Borehole / well', tank: 'Storage tank', unknown: 'Not sure yet',
      flow: 'Measured flow rate, L/min', pressure: 'Pressure, bar',
      optional: 'Enter these if known; otherwise leave them blank.',
      detailsTitle: 'Additional details', notes: 'For example: lawn outline, paths, slopes or areas that must not be watered.',
      finish: 'Prepare site details', summaryTitle: 'Site information',
      summaryArea: 'Area', summaryShape: 'Shape', summaryWater: 'Water source',
      summaryFlow: 'Flow rate', summaryPressure: 'Pressure', summaryNotes: 'Notes',
      ready: 'Information collected', disclaimer: 'This is the first stage of selection, not a completed hydraulic design. Exact sprinkler quantities, zones, pipe diameters and compatible equipment depend on verified flow and working pressure, site geometry and the specifications of the selected models. We will not replace engineering calculations with guessed values.',
      restart: 'Edit answers', home: 'Return to the shop', unit: 'm²', flowUnit: 'L/min',
    }
    return {
      title: 'Помощник за напояване Florial',
      intro: 'Нека започнем с автоматичното напояване на тревна площ. Отговорете на няколко въпроса за терена и водоизточника, за да подготвим технически коректен подбор.',
      back: 'Начало', module: 'Модул 1 · Тревна площ', step: 'Стъпка', of: 'от 3',
      areaTitle: 'Разкажете ни за тревната площ', shape: 'Форма на терена',
      rectangle: 'Правоъгълна', lShape: 'Г-образна', irregular: 'Неправилна форма',
      length: 'Дължина, м', width: 'Ширина, м', areaLabel: 'Площ на тревната площ, м²',
      next: 'Напред', prev: 'Назад', waterTitle: 'Водоизточник',
      mains: 'Водопровод', well: 'Сондаж / кладенец', tank: 'Резервоар / съд', unknown: 'Все още не знам',
      flow: 'Измерен дебит, л/мин', pressure: 'Налягане, bar',
      optional: 'Попълнете, ако знаете стойностите. В противен случай оставете полетата празни.',
      detailsTitle: 'Допълнителна информация', notes: 'Например: форма на тревната площ, алеи, наклони или места, които не трябва да се напояват.',
      finish: 'Подготви данните за терена', summaryTitle: 'Данни за терена',
      summaryArea: 'Площ', summaryShape: 'Форма', summaryWater: 'Водоизточник',
      summaryFlow: 'Дебит', summaryPressure: 'Налягане', summaryNotes: 'Бележки',
      ready: 'Данните са събрани', disclaimer: 'Това е първият етап от подбора, а не завършен хидравличен проект. Точният брой разпръсквачи, зони, диаметри на тръбите и съвместимо оборудване се определят след проверка на дебита и работното налягане, геометрията на терена и характеристиките на конкретните модели. Няма да заменяме инженерното изчисление с предположения.',
      restart: 'Промени отговорите', home: 'Обратно към магазина', unit: 'м²', flowUnit: 'л/мин',
    }
  }, [language])

  const calculatedArea = shape === 'rectangle'
    ? Number(length) > 0 && Number(width) > 0 ? Number(length) * Number(width) : 0
    : Number(area) > 0 ? Number(area) : 0
  const shapeLabel = shape === 'rectangle' ? copy.rectangle : shape === 'l-shape' ? copy.lShape : copy.irregular
  const waterLabel = waterSource === 'mains' ? copy.mains : waterSource === 'well' ? copy.well : waterSource === 'tank' ? copy.tank : copy.unknown

  useEffect(() => {
    applyPageSeo({ fallbackTitle: copy.title + ' | Florial', fallbackDescription: copy.intro, noIndex: true, language })
  }, [copy, language])

  const selectClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-left text-sm text-slate-800 transition hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200'
  const activeClass = 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700'

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-4xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={onNavigateHome} className="mb-6 text-sm font-semibold text-emerald-800 hover:text-emerald-950">
        ← {copy.back}
      </button>
      <header className="mb-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-green-700 px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">{copy.module}</p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">{copy.intro}</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {!showSummary ? (
          <>
            <div className="mb-6 flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>{copy.step} {step} {copy.of}</span><span>{Math.round(step / 3 * 100)}%</span>
            </div>
            <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: (step / 3 * 100) + '%' }} />
            </div>
            {step === 1 ? (
              <div>
                <h2 className="mb-5 text-xl font-bold text-slate-900">{copy.areaTitle}</h2>
                <p className="mb-3 text-sm font-semibold text-slate-700">{copy.shape}</p>
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                  {([['rectangle', copy.rectangle], ['l-shape', copy.lShape], ['irregular', copy.irregular]] as Array<[LawnShape, string]>).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setShape(value)} className={selectClass + (shape === value ? ' ' + activeClass : '')}>{label}</button>
                  ))}
                </div>
                {shape === 'rectangle' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">{copy.length}<input type="number" min="0" step="0.1" value={length} onChange={(event) => setLength(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
                    <label className="block text-sm font-semibold text-slate-700">{copy.width}<input type="number" min="0" step="0.1" value={width} onChange={(event) => setWidth(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
                  </div>
                ) : (
                  <label className="block text-sm font-semibold text-slate-700">{copy.areaLabel}<input type="number" min="0" step="1" value={area} onChange={(event) => setArea(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
                )}
              </div>
            ) : step === 2 ? (
              <div>
                <h2 className="mb-5 text-xl font-bold text-slate-900">{copy.waterTitle}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([['mains', copy.mains], ['well', copy.well], ['tank', copy.tank], ['unknown', copy.unknown]] as Array<[WaterSource, string]>).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setWaterSource(value)} className={selectClass + (waterSource === value ? ' ' + activeClass : '')}>{label}</button>
                  ))}
                </div>
                <p className="mb-5 mt-6 text-sm text-slate-500">{copy.optional}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">{copy.flow}<input type="number" min="0" step="0.1" value={flowRate} onChange={(event) => setFlowRate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
                  <label className="block text-sm font-semibold text-slate-700">{copy.pressure}<input type="number" min="0" step="0.1" value={pressure} onChange={(event) => setPressure(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="mb-5 text-xl font-bold text-slate-900">{copy.detailsTitle}</h2>
                <textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={copy.notes} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6" />
              </div>
            )}
            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <button type="button" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40">{copy.prev}</button>
              {step < 3 ? (
                <button type="button" disabled={step === 1 && calculatedArea <= 0} onClick={() => setStep((current) => Math.min(3, current + 1))} className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{copy.next}</button>
              ) : (
                <button type="button" onClick={() => setShowSummary(true)} className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800">{copy.finish}</button>
              )}
            </div>
          </>
        ) : (
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-700">{copy.ready}</p>
            <h2 className="mb-6 text-2xl font-bold text-slate-900">{copy.summaryTitle}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryArea}</dt><dd className="mt-1 text-lg font-bold text-slate-900">{calculatedArea.toLocaleString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG')} {copy.unit}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryShape}</dt><dd className="mt-1 font-bold text-slate-900">{shapeLabel}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryWater}</dt><dd className="mt-1 font-bold text-slate-900">{waterLabel}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryFlow}</dt><dd className="mt-1 font-bold text-slate-900">{flowRate ? flowRate + ' ' + copy.flowUnit : '—'}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryPressure}</dt><dd className="mt-1 font-bold text-slate-900">{pressure ? pressure + ' bar' : '—'}</dd></div>
              {notes && <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">{copy.summaryNotes}</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800">{notes}</dd></div>}
            </dl>
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">{copy.disclaimer}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => { setShowSummary(false); setStep(1) }} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">{copy.restart}</button>
              <button type="button" onClick={onNavigateHome} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">{copy.home}</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
