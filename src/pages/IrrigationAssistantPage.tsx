import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'
import { buildLawnBoundary, type LawnCutoutCorner, type LawnInputShape } from '../lib/irrigation/lawnGeometryInput.mjs'
import { validateLawnGeometry } from '../lib/irrigation/lawnGeometry.mjs'
import { buildIrrigationIntakeSnapshot, evaluateIrrigationIntake } from '../lib/irrigation/irrigationIntake.mjs'
import { buildPreliminaryLawnLayout } from '../lib/irrigation/irrigationLayoutBridge.mjs'

interface IrrigationAssistantPageProps {
  onNavigateHome: () => void
}

function svgPolyline(points: Array<{ x: number; y: number }>) {
  return points.map((point) => point.x + ',' + point.y).join(' ')
}

function sprinklerArcPoints(sprinkler: {
  position: { x: number; y: number }
  radiusM: number
  arcDeg: number
  directionDeg?: number | null
}) {
  const direction = sprinkler.directionDeg ?? 0
  const start = (direction - sprinkler.arcDeg / 2) * Math.PI / 180
  const count = Math.max(12, Math.ceil(sprinkler.arcDeg / 6))
  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = start + (sprinkler.arcDeg * Math.PI / 180) * index / count
    return {
      x: sprinkler.position.x + Math.cos(angle) * sprinkler.radiusM,
      y: sprinkler.position.y + Math.sin(angle) * sprinkler.radiusM,
    }
  })
}

export function IrrigationAssistantPage({ onNavigateHome }: IrrigationAssistantPageProps) {
  const { language } = useI18n()
  const [step, setStep] = useState(1)
  const [shape, setShape] = useState<LawnInputShape>('rectangle')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [cutoutWidth, setCutoutWidth] = useState('')
  const [cutoutDepth, setCutoutDepth] = useState('')
  const [cutoutCorner, setCutoutCorner] = useState<LawnCutoutCorner>('top-right')
  const [notes, setNotes] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  const copy = useMemo(() => language === 'ru' ? {
    title: 'Помощник подбора полива Florial',
    intro: 'Укажите примерные размеры газона. Мы подготовим предварительную схему дождевателей и разводки труб по стандартным условиям Florial.',
    module: 'Предварительное проектирование автоматического полива · Газон',
    step: 'Этап', of: 'из 2', welcome: 'Здравствуйте! Для начала зададим примерную форму и размеры газона. Источник воды и гидравлические параметры уже заданы стандартом Florial.',
    prompts: ['Какая форма и примерные размеры газона?', 'Есть ли особенности участка, которые нужно учесть?'],
    geometryTitle: 'Зададим примерный контур газона', shape: 'Форма участка', rectangle: 'Прямоугольник', lShape: 'Г-образный участок',
    length: 'Длина, м', width: 'Ширина, м', cutoutWidth: 'Ширина выреза, м', cutoutDepth: 'Глубина выреза, м',
    cutoutCorner: 'В каком углу находится вырез?', cornerTopLeft: 'Сверху слева', cornerTopRight: 'Сверху справа', cornerBottomLeft: 'Снизу слева', cornerBottomRight: 'Снизу справа',
    geometryHint: 'Укажите приблизительные размеры. Для Г-образной формы задайте общие габариты и размеры отсутствующей прямоугольной части. Точные замеры на этом этапе не требуются.',
    geometryPreview: 'Предварительный контур по размерам', calculatedArea: 'Площадь', perimeter: 'Периметр',
    geometryInvalid: 'Проверьте размеры: значения должны быть больше нуля, а вырез — меньше общей длины и ширины.',
    notesTitle: 'Дополнительные особенности участка', notesPlaceholder: 'Например: дорожки, терраса, деревья, клумбы, бассейн или места, которые нельзя поливать.',
    notesHint: 'Пока это примечание для инженера. Препятствия ещё не нанесены на схему автоматически.',
    next: 'Продолжить', back: 'Назад', finish: 'Построить схему', summaryTitle: 'Предварительный проект полива',
    area: 'Площадь', shapeLabel: 'Форма', notesLabel: 'Особенности участка',
    ready: 'Схема подготовлена по стандартным условиям Florial', geometryReady: 'Контур принят для предварительной схемы', geometryMissing: 'Проверьте геометрию участка',
    waterTitle: 'Стандартные условия водоснабжения',
    waterAssumptions: 'Подключение к дюймовому крану в правом верхнем углу участка · давление 4 бара · подводящая труба Ø25 мм.',
    manufacturerBasis: 'Радиусы R-VAN берутся из таблицы Rain Bird при рекомендованных 3,1 бар на форсунке. 4 бара — заданное давление в точке подключения; гидравлические потери не рассчитываются.',
    pipeAssumptions: 'Основная разводка по периметру — Ø32 мм. Ответвления к внутренним дождевателям — Ø25 мм.',
    lineAssumptions: 'На одну линию: до 6 дождевателей с секторным поливом или до 4 дождевателей с круговым поливом 360°.',
    hydraulicNotCalculated: 'Гидравлический расчёт не выполняется. Схема строится по заданным стандартным условиям Florial.',
    disclaimer: 'Заказчику показываются условия, под которые подготовлена схема. Если фактический кран, давление или водопровод отличаются, заказчик обеспечивает соответствие этим условиям либо согласует изменения с монтажником.',
    edit: 'Изменить размеры', home: 'Вернуться в магазин', unit: 'м²', noValue: 'Не указано',
    conversation: 'Диалог с помощником', projectPanel: 'Условия проекта', progress: 'Подготовка схемы',
    assistant: 'Помощник Florial', you: 'Вы', notSent: 'Введённые данные остаются в этом окне браузера и пока не отправляются на сервер.',
    layoutTitle: 'Схема размещения дождевателей и труб', candidate: 'Выбранная серия', heads: 'Дождеватели',
    zones: 'Линии полива', positions: 'Позиции и характеристики дождевателей',
    generated: 'Построена предварительная схема по геометрии участка.',
    incomplete: 'Схема построена не полностью. Требуется проверить отмеченные ограничения.',
    unsupported: 'Для этой геометрии пока нет подтверждённого автоматического варианта. Не подменяем его неподтверждённой схемой.',
    narrow: 'Для узкой полосы нужно подобрать и ориентировать полосовые форсунки R-VAN LCS, RCS или SST по точным размерам производителя. Автоматический вариант для этих размеров пока не подтверждён.',
    legendHeads: 'Место установки дождевателя', legendCoverage: 'Дуга / радиус полива', legendPipe: 'Трасса трубы', stripSpecsTitle: 'Полосовые форсунки Rain Bird по таблице производителя (3,1 бар)',
  } : language === 'en' ? {
    title: 'Florial irrigation assistant',
    intro: 'Enter approximate lawn dimensions. We will prepare a preliminary sprinkler and pipe layout using Florial standard assumptions.',
    module: 'Preliminary automatic irrigation design · Lawn',
    step: 'Step', of: 'of 2', welcome: 'Hello! First, enter the approximate lawn shape and dimensions. Water-source and hydraulic assumptions are already defined by Florial.',
    prompts: ['What is the lawn shape and its approximate size?', 'Are there any site features we should note?'],
    geometryTitle: 'Set the approximate lawn outline', shape: 'Lawn shape', rectangle: 'Rectangle', lShape: 'L-shaped lawn',
    length: 'Length, m', width: 'Width, m', cutoutWidth: 'Cut-out width, m', cutoutDepth: 'Cut-out depth, m',
    cutoutCorner: 'Which corner is cut out?', cornerTopLeft: 'Top left', cornerTopRight: 'Top right', cornerBottomLeft: 'Bottom left', cornerBottomRight: 'Bottom right',
    geometryHint: 'Enter approximate dimensions. For an L-shape, enter the overall dimensions and the missing rectangular cut-out. Exact site measurements are not required at this stage.',
    geometryPreview: 'Preliminary outline from dimensions', calculatedArea: 'Area', perimeter: 'Perimeter',
    geometryInvalid: 'Check the dimensions: values must be positive and the cut-out must be smaller than the overall length and width.',
    notesTitle: 'Additional site details', notesPlaceholder: 'For example: paths, patio, trees, flower beds, pool or areas that must not be watered.',
    notesHint: 'This is an engineer note only. Obstacles are not yet automatically drawn into the layout.',
    next: 'Continue', back: 'Back', finish: 'Generate layout', summaryTitle: 'Preliminary irrigation project',
    area: 'Area', shapeLabel: 'Shape', notesLabel: 'Site details',
    ready: 'Layout prepared using Florial standard assumptions', geometryReady: 'Outline accepted for preliminary layout', geometryMissing: 'Check the lawn geometry',
    waterTitle: 'Standard water-supply assumptions',
    waterAssumptions: 'Connection to a 1-inch tap at the top-right corner · 4 bar pressure · 25 mm supply pipe.',
    manufacturerBasis: 'R-VAN radii use the Rain Bird table at its recommended 3.1 bar nozzle pressure. The 4 bar value is the fixed inlet-tap assumption; hydraulic losses are not calculated.',
    pipeAssumptions: 'Main route along the perimeter — 32 mm. Branches to internal sprinklers — 25 mm.',
    lineAssumptions: 'Per line: up to 6 sector sprinklers or up to 4 full-circle 360° sprinklers.',
    hydraulicNotCalculated: 'No hydraulic calculation is performed. The layout uses Florial’s predefined standard assumptions.',
    disclaimer: 'The customer is shown the conditions used to prepare the layout. If the actual tap, pressure or water supply differs, the customer must provide matching conditions or agree changes with the installer.',
    edit: 'Edit dimensions', home: 'Return to shop', unit: 'm²', noValue: 'Not provided',
    conversation: 'Assistant conversation', projectPanel: 'Project assumptions', progress: 'Preparing layout',
    assistant: 'Florial assistant', you: 'You', notSent: 'Your entries stay in this browser view and are not sent to a server yet.',
    layoutTitle: 'Sprinkler and pipe layout', candidate: 'Selected family', heads: 'Sprinklers',
    zones: 'Irrigation lines', positions: 'Sprinkler positions and specifications',
    generated: 'A preliminary layout has been generated from the lawn geometry.',
    incomplete: 'The layout is incomplete. Review the displayed limitations.',
    unsupported: 'There is no confirmed automatic layout for this geometry yet. No unsupported layout is substituted.',
    narrow: 'A narrow strip requires exact orientation and sizing of Rain Bird R-VAN LCS, RCS or SST strip nozzles. An automatic layout for these dimensions is not yet confirmed.',
    legendHeads: 'Sprinkler location', legendCoverage: 'Spray arc / radius', legendPipe: 'Pipe route', stripSpecsTitle: 'Rain Bird strip-nozzle data from the manufacturer table (3.1 bar)',
  } : {
    title: 'Помощник за напояване Florial',
    intro: 'Въведете приблизителните размери на тревната площ. Ще подготвим предварителна схема на разпръсквачите и тръбите според стандартните условия на Florial.',
    module: 'Предварително проектиране на автоматично напояване · Тревна площ',
    step: 'Етап', of: 'от 2', welcome: 'Здравейте! Първо задайте приблизителната форма и размери на тревната площ. Условията за водоснабдяване вече са определени от стандарта на Florial.',
    prompts: ['Каква е формата и какви са приблизителните размери на тревната площ?', 'Има ли особености на терена, които трябва да отбележим?'],
    geometryTitle: 'Задайте приблизителния контур на тревната площ', shape: 'Форма на терена', rectangle: 'Правоъгълна', lShape: 'Г-образна тревна площ',
    length: 'Дължина, м', width: 'Ширина, м', cutoutWidth: 'Ширина на изреза, м', cutoutDepth: 'Дълбочина на изреза, м',
    cutoutCorner: 'В кой ъгъл е изрезът?', cornerTopLeft: 'Горе вляво', cornerTopRight: 'Горе вдясно', cornerBottomLeft: 'Долу вляво', cornerBottomRight: 'Долу вдясно',
    geometryHint: 'Въведете приблизителни размери. За Г-образна форма задайте общите габарити и размерите на липсващата правоъгълна част. Точни измервания не са необходими на този етап.',
    geometryPreview: 'Предварителен контур по размерите', calculatedArea: 'Площ', perimeter: 'Периметър',
    geometryInvalid: 'Проверете размерите: стойностите трябва да са положителни, а изрезът — по-малък от общата дължина и ширина.',
    notesTitle: 'Допълнителни особености на терена', notesPlaceholder: 'Например: алеи, тераса, дървета, цветни лехи, басейн или зони, които не трябва да се напояват.',
    notesHint: 'Това е бележка за инженера. Препятствията все още не се нанасят автоматично върху схемата.',
    next: 'Напред', back: 'Назад', finish: 'Създай схема', summaryTitle: 'Предварителен проект за напояване',
    area: 'Площ', shapeLabel: 'Форма', notesLabel: 'Особености на терена',
    ready: 'Схемата е подготвена според стандартните условия на Florial', geometryReady: 'Контурът е приет за предварителна схема', geometryMissing: 'Проверете геометрията на тревната площ',
    waterTitle: 'Стандартни условия за водоснабдяване',
    waterAssumptions: 'Свързване към кран 1 цол в горния десен ъгъл · налягане 4 bar · захранваща тръба Ø25 мм.',
    manufacturerBasis: 'Радиусите на R-VAN са по таблицата на Rain Bird при препоръчителни 3,1 bar при дюзата. 4 bar е зададеното налягане при входния кран; хидравличните загуби не се изчисляват.',
    pipeAssumptions: 'Основно трасе по периметъра — Ø32 мм. Отклонения към вътрешните разпръсквачи — Ø25 мм.',
    lineAssumptions: 'На една линия: до 6 секторни разпръсквача или до 4 кръгови разпръсквача 360°.',
    hydraulicNotCalculated: 'Не се извършва хидравлично изчисление. Схемата използва предварително зададените стандартни условия на Florial.',
    disclaimer: 'На клиента се показват условията, по които е подготвена схемата. Ако реалният кран, налягането или водопроводът са различни, клиентът осигурява съответствие с тези условия или съгласува промени с монтажника.',
    edit: 'Промени размерите', home: 'Обратно към магазина', unit: 'м²', noValue: 'Не е посочено',
    conversation: 'Разговор с помощника', projectPanel: 'Условия на проекта', progress: 'Подготовка на схема',
    assistant: 'Помощник Florial', you: 'Вие', notSent: 'Въведените данни остават в този прозорец на браузъра и засега не се изпращат към сървър.',
    layoutTitle: 'Схема на разпръсквачите и тръбите', candidate: 'Избрана серия', heads: 'Разпръсквачи',
    zones: 'Поливни линии', positions: 'Позиции и характеристики на разпръсквачите',
    generated: 'Създадена е предварителна схема според геометрията на терена.',
    incomplete: 'Схемата е създадена частично. Проверете показаните ограничения.',
    unsupported: 'За тази геометрия все още няма потвърдена автоматична схема. Не заместваме резултата с непроверен вариант.',
    narrow: 'За тясна ивица трябва да се подберат и ориентират лентови дюзи Rain Bird R-VAN LCS, RCS или SST според точните размери на производителя. Автоматичен вариант за тези размери все още не е потвърден.',
    legendHeads: 'Място на разпръсквача', legendCoverage: 'Дъга / радиус на поливане', legendPipe: 'Трасе на тръбата', stripSpecsTitle: 'Лентови дюзи Rain Bird според таблицата на производителя (3,1 bar)',
  }, [language])

  const boundaryVertices = useMemo(() => buildLawnBoundary({
    shape,
    length: Number(length.replace(',', '.')),
    width: Number(width.replace(',', '.')),
    cutoutWidth: Number(cutoutWidth.replace(',', '.')),
    cutoutDepth: Number(cutoutDepth.replace(',', '.')),
    cutoutCorner,
  }), [shape, length, width, cutoutWidth, cutoutDepth, cutoutCorner])

  const geometryValidation = useMemo(() => {
    if (!boundaryVertices) return null
    return validateLawnGeometry({
      schemaVersion: 1,
      coordinateSystem: 'local_cartesian_m',
      status: 'confirmed',
      regions: [{ id: 'lawn-1', boundary: { vertices: boundaryVertices }, exclusions: [] }],
    })
  }, [boundaryVertices])

  const intakeInput = { language, shape, length, width, cutoutWidth, cutoutDepth, cutoutCorner, geometryValidation, notes }
  const readiness = useMemo(() => evaluateIrrigationIntake(intakeInput), [language, shape, length, width, cutoutWidth, cutoutDepth, cutoutCorner, geometryValidation, notes])
  const snapshot = useMemo(() => buildIrrigationIntakeSnapshot(intakeInput), [language, shape, length, width, cutoutWidth, cutoutDepth, cutoutCorner, geometryValidation, notes])
  const layoutResult = useMemo(() => showSummary ? buildPreliminaryLawnLayout(snapshot) : null, [snapshot, showSummary])
  const calculatedArea = geometryValidation?.computedAreaM2 ?? 0
  const calculatedPerimeter = geometryValidation?.computedPerimeterM ?? 0
  const geometryAccepted = readiness.geometryReady
  const shapeLabel = shape === 'rectangle' ? copy.rectangle : copy.lShape
  const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG'
  const numberFormat = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 })
  const svgPoints = boundaryVertices?.map((point) => String(Math.round(point.x * 1000) / 1000) + ',' + String(Math.round(point.y * 1000) / 1000)).join(' ')
  const progress = showSummary ? 100 : Math.round(step / 2 * 100)
  const viewWidth = Math.max(Number(length.replace(',', '.')) || 1, 1)
  const viewHeight = Math.max(Number(width.replace(',', '.')) || 1, 1)

  function updateGeometry(setter: (value: string) => void, value: string) {
    setter(value)
  }

  function answerSummary(stage: number) {
    if (stage === 1) return geometryAccepted
      ? shapeLabel + ' · ' + length + ' × ' + width + ' м · ' + numberFormat(calculatedArea) + ' ' + copy.unit
      : copy.geometryMissing
    return notes.trim() || copy.noValue
  }

  useEffect(() => {
    applyPageSeo({ fallbackTitle: copy.title + ' | Florial', fallbackDescription: copy.intro, noIndex: true, language })
  }, [copy, language])

  const selectClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-left text-sm text-slate-800 transition hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200'
  const activeClass = 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700'
  const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const steps = copy.prompts

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-6xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li><a href={localizedHref('/', language)} className="font-medium text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline">{language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало'}</a></li>
          <li aria-hidden="true">/</li>
          <li><a href={localizedHref('/category/vsichko-za-polivane', language)} className="font-medium text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline">{language === 'ru' ? 'Всё оборудование для полива' : language === 'en' ? 'All irrigation equipment' : 'Всичко за поливане'}</a></li>
          <li aria-hidden="true">/</li>
          <li><a href={localizedHref('/services/category/polivni-sistemi', language)} className="font-medium text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline">{language === 'ru' ? 'Инженер по системам полива' : language === 'en' ? 'Irrigation systems specialist' : 'Инженер по поливни системи'}</a></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-slate-700">{copy.title}</li>
        </ol>
      </nav>

      <header className="mb-7 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-green-700 px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">{copy.module}</p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">{copy.intro}</p>
      </header>

      <div className="mb-5 flex items-center justify-between gap-4 text-sm font-semibold text-slate-600">
        <span>{copy.progress}</span><span>{copy.step} {showSummary ? 2 : step} {copy.of}</span>
      </div>
      <div className="mb-7 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: progress + '%' }} /></div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-label={copy.conversation}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg" aria-hidden="true">F</div>
            <div><p className="font-bold text-slate-900">{copy.assistant}</p><p className="text-xs text-slate-500">{copy.conversation}</p></div>
          </div>
          <div className="space-y-4" aria-live="polite">
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{copy.welcome}</div>
            {Array.from({ length: showSummary ? 2 : step - 1 }, (_, index) => index + 1).map((stage) => (
              <div key={stage} className="space-y-2">
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{steps[stage - 1]}</div>
                <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-800"><p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{copy.you}</p>{answerSummary(stage)}</div>
              </div>
            ))}
            {!showSummary && <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{steps[step - 1]}</div>}
          </div>

          {!showSummary ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              {step === 1 ? (
                <div>
                  <h2 className="mb-4 text-lg font-bold text-slate-900">{copy.geometryTitle}</h2>
                  <p className="mb-3 text-sm font-semibold text-slate-700">{copy.shape}</p>
                  <div className="mb-5 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => setShape('rectangle')} aria-pressed={shape === 'rectangle'} className={selectClass + (shape === 'rectangle' ? ' ' + activeClass : '')}>{copy.rectangle}</button>
                    <button type="button" onClick={() => setShape('l-shape')} aria-pressed={shape === 'l-shape'} className={selectClass + (shape === 'l-shape' ? ' ' + activeClass : '')}>{copy.lShape}</button>
                  </div>
                  <p className="mb-4 text-sm leading-6 text-slate-600">{copy.geometryHint}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">{copy.length}<input type="text" inputMode="decimal" value={length} onChange={(event) => updateGeometry(setLength, event.target.value)} className={inputClass} /></label>
                    <label className="block text-sm font-semibold text-slate-700">{copy.width}<input type="text" inputMode="decimal" value={width} onChange={(event) => updateGeometry(setWidth, event.target.value)} className={inputClass} /></label>
                  </div>
                  {shape === 'l-shape' && <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">{copy.cutoutWidth}<input type="text" inputMode="decimal" value={cutoutWidth} onChange={(event) => updateGeometry(setCutoutWidth, event.target.value)} className={inputClass} /></label>
                    <label className="block text-sm font-semibold text-slate-700">{copy.cutoutDepth}<input type="text" inputMode="decimal" value={cutoutDepth} onChange={(event) => updateGeometry(setCutoutDepth, event.target.value)} className={inputClass} /></label>
                    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">{copy.cutoutCorner}<select value={cutoutCorner} onChange={(event) => setCutoutCorner(event.target.value as LawnCutoutCorner)} className={inputClass}>
                      <option value="top-left">{copy.cornerTopLeft}</option><option value="top-right">{copy.cornerTopRight}</option><option value="bottom-left">{copy.cornerBottomLeft}</option><option value="bottom-right">{copy.cornerBottomRight}</option>
                    </select></label>
                  </div>}
                  {boundaryVertices && geometryValidation?.valid && <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <h3 className="mb-3 text-sm font-bold text-emerald-950">{copy.geometryPreview}</h3>
                    <div className="rounded-xl border border-emerald-100 bg-white p-3">
                      <svg viewBox={'-0.5 -0.5 ' + (viewWidth + 1) + ' ' + (viewHeight + 1)} role="img" aria-label={copy.geometryPreview} className="max-h-56 w-full" preserveAspectRatio="xMidYMid meet">
                        <polygon points={svgPoints} fill="#bbf7d0" stroke="#047857" strokeWidth="0.12" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">{copy.calculatedArea}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{numberFormat(calculatedArea)} {copy.unit}</p></div>
                      <div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">{copy.perimeter}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{numberFormat(calculatedPerimeter)} m</p></div>
                    </div>
                    <p role="status" className="mt-3 text-sm leading-6 text-emerald-900">{copy.geometryReady}</p>
                  </div>}
                  {!boundaryVertices && (length !== '' || width !== '' || (shape === 'l-shape' && (cutoutWidth !== '' || cutoutDepth !== ''))) && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">{copy.geometryInvalid}</p>}
                  {boundaryVertices && geometryValidation && !geometryValidation.valid && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900">{copy.geometryInvalid}</p>}
                </div>
              ) : (
                <div>
                  <h2 className="mb-4 text-lg font-bold text-slate-900">{copy.notesTitle}</h2>
                  <textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={copy.notesPlaceholder} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6 text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                  <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">{copy.notesHint}</p>
                </div>
              )}
              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button type="button" disabled={step === 1} onClick={() => setStep(1)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40">{copy.back}</button>
                {step === 1 ? <button type="button" disabled={!geometryAccepted} onClick={() => setStep(2)} className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{copy.next}</button> : <button type="button" onClick={() => setShowSummary(true)} className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800">{copy.finish}</button>}
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">{copy.ready}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">{copy.summaryTitle}</h2>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{copy.area}</dt><dd className="mt-1 font-bold text-slate-900">{geometryAccepted ? numberFormat(calculatedArea) + ' ' + copy.unit : copy.noValue}</dd></div>
                  <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{copy.shapeLabel}</dt><dd className="mt-1 font-bold text-slate-900">{shapeLabel}</dd></div>
                  {notes.trim() && <div className="rounded-xl bg-white p-3 sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">{copy.notesLabel}</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800">{notes.trim()}</dd></div>}
                </dl>
              </div>

              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900">{copy.waterTitle}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  <li>{copy.waterAssumptions}</li><li>{copy.pipeAssumptions}</li><li>{copy.lineAssumptions}</li><li>{copy.manufacturerBasis}</li><li>{copy.manufacturerBasis}</li>
                </ul>
              </section>

              {layoutResult && <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{copy.layoutTitle}</h3>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-900">Preliminary</span>
                </div>
                {layoutResult.status === 'layout_generated' || layoutResult.status === 'layout_incomplete' ? <>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{copy.candidate}: Rain Bird R-VAN {layoutResult.operatingScenario?.model}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{layoutResult.status === 'layout_generated' ? copy.generated : copy.incomplete}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">{copy.heads}</p><p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{layoutResult.layout?.sprinklers?.length ?? 0}</p></div>
                    <div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">{copy.zones}</p><p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{layoutResult.layout?.zones?.length ?? 0}</p></div>
                  </div>
                  {boundaryVertices && (layoutResult.layout?.sprinklers?.length ?? 0) > 0 && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                    <svg viewBox={'-0.8 -0.8 ' + (viewWidth + 1.6) + ' ' + (viewHeight + 1.6)} role="img" aria-label={copy.layoutTitle} className="max-h-[30rem] w-full" preserveAspectRatio="xMidYMid meet">
                      <g transform={'translate(0 ' + viewHeight + ') scale(1 -1)'}>
                        <polygon points={svgPoints} fill="#dcfce7" stroke="#047857" strokeWidth="0.12" strokeLinejoin="round" />
                        {layoutResult.layout.pipeNetwork?.trunk?.length > 1 && <polyline points={svgPolyline(layoutResult.layout.pipeNetwork.trunk)} fill="none" stroke="#334155" strokeWidth="0.1" strokeDasharray="0.35 0.18" strokeLinejoin="round" />}
                        {layoutResult.layout.pipeNetwork?.branches?.map((branch: { sprinklerId: string; points: Array<{ x: number; y: number }> }) => <polyline key={branch.sprinklerId} points={svgPolyline(branch.points)} fill="none" stroke="#0ea5e9" strokeWidth="0.075" strokeDasharray="0.18 0.14" />)}
                        {layoutResult.layout.sprinklers.map((sprinkler: { id: string; position: { x: number; y: number }; radiusM: number; arcDeg: number; directionDeg?: number | null }) => sprinkler.arcDeg === 360
                          ? <circle key={sprinkler.id + '-coverage'} cx={sprinkler.position.x} cy={sprinkler.position.y} r={sprinkler.radiusM} fill="none" stroke="#0f766e" strokeWidth="0.07" strokeDasharray="0.22 0.16" opacity="0.85" />
                          : <polyline key={sprinkler.id + '-coverage'} points={svgPolyline(sprinklerArcPoints(sprinkler))} fill="none" stroke="#0f766e" strokeWidth="0.09" strokeDasharray="0.22 0.16" strokeLinecap="round" opacity="0.9" />)}
                        {layoutResult.layout.sprinklers.map((sprinkler: { id: string; position: { x: number; y: number } }) => <circle key={sprinkler.id} cx={sprinkler.position.x} cy={sprinkler.position.y} r="0.16" fill="#0369a1" stroke="#ffffff" strokeWidth="0.07" />)}
                        <circle cx={layoutResult.layout.pipeNetwork?.source?.x ?? viewWidth} cy={layoutResult.layout.pipeNetwork?.source?.y ?? viewHeight} r="0.22" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.07" />
                      </g>
                    </svg>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-700" />{copy.legendHeads}</span>
                      <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-teal-700" />{copy.legendCoverage}</span>
                      <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-slate-700" />{copy.legendPipe}</span>
                    </div>
                  </div>}
                  <div className="mt-3 rounded-xl bg-white p-3 text-sm">
                    <p className="font-semibold text-slate-800">{copy.zones}</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {layoutResult.layout?.zones?.map((zone: { id: string; sprinklerCount: number; maximumHeads: number; type: string }) => <li key={zone.id}>{zone.id}: {zone.sprinklerCount}/{zone.maximumHeads} · {zone.type === 'full-circle' ? '360°' : 'sector'}</li>)}
                    </ul>
                  </div>
                  <details className="mt-3 rounded-xl bg-white p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-800">{copy.positions}</summary>
                    <ol className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                      {layoutResult.layout?.sprinklers?.map((sprinkler: { id: string; position: { x: number; y: number }; arcDeg: number; radiusM: number; zoneId?: string; performanceModel?: string }) => <li key={sprinkler.id}>{sprinkler.id}: X {numberFormat(sprinkler.position.x)}, Y {numberFormat(sprinkler.position.y)} · {sprinkler.performanceModel ?? layoutResult.operatingScenario?.model} · {sprinkler.arcDeg}° · R {numberFormat(sprinkler.radiusM)} м · {sprinkler.zoneId}</li>)}
                    </ol>
                  </details>
                </> : layoutResult.status === 'strip_nozzle_layout_requires_exact_pattern_engine' ? <>
                  <p className="mt-3 text-sm leading-6 text-amber-900">{copy.narrow}</p>
                  <div className="mt-3 rounded-xl bg-white p-3">
                    <p className="text-sm font-semibold text-slate-800">{copy.stripSpecsTitle}</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {layoutResult.stripSpecifications?.map((spec: { model: string; dimensionsM: number[]; flowLpm: number }) => <li key={spec.model}>{spec.model}: {spec.dimensionsM[0]} × {spec.dimensionsM[1]} m · {numberFormat(spec.flowLpm)} L/min</li>)}
                    </ul>
                  </div>
                </> : <p className="mt-3 text-sm leading-6 text-amber-900">{copy.unsupported}</p>}
              </section>}

              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">{copy.hydraulicNotCalculated} {copy.disclaimer}</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => { setShowSummary(false); setStep(1) }} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">{copy.edit}</button>
                <button type="button" onClick={onNavigateHome} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">{copy.home}</button>
              </div>
              <p className="text-xs text-slate-500">{copy.notSent} <span className="sr-only">Snapshot version {snapshot.schemaVersion}</span></p>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">{copy.projectPanel}</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs font-semibold text-slate-500">{copy.area}</dt><dd className="mt-1 font-semibold text-slate-900">{geometryAccepted ? numberFormat(calculatedArea) + ' ' + copy.unit : copy.noValue}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">{copy.shapeLabel}</dt><dd className="mt-1 font-semibold text-slate-900">{shapeLabel}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">{copy.waterTitle}</dt><dd className="mt-1 leading-6 text-slate-700">{copy.waterAssumptions}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">{copy.pipeAssumptions}</dt><dd className="mt-1 leading-6 text-slate-700">{copy.lineAssumptions}</dd></div>
          </dl>
          <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">{copy.hydraulicNotCalculated}</p>
          <p className="mt-4 text-xs leading-5 text-slate-500">{copy.notSent}</p>
        </aside>
      </div>
    </main>
  )
}
