import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'
import { buildLawnBoundary, type LawnCutoutCorner, type LawnInputShape } from '../lib/irrigation/lawnGeometryInput.mjs'
import { validateLawnGeometry } from '../lib/irrigation/lawnGeometry.mjs'
import { buildIrrigationIntakeSnapshot } from '../lib/irrigation/irrigationIntake.mjs'

type WaterSource = 'mains' | 'well' | 'tank' | 'unknown'
type PressureType = 'static' | 'dynamic' | 'unknown'
type PressureMeasurementPoint = 'source' | 'irrigation_point' | 'unknown'
type FlowMeasurementMethod = 'flow_meter' | 'timed_volume' | 'unknown'

interface IrrigationAssistantPageProps {
  onNavigateHome: () => void
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
  const [geometryConfirmed, setGeometryConfirmed] = useState(false)
  const [waterSource, setWaterSource] = useState<WaterSource>('unknown')
  const [flowRate, setFlowRate] = useState('')
  const [pressure, setPressure] = useState('')
  const [pressureType, setPressureType] = useState<PressureType>('unknown')
  const [pressureMeasurementPoint, setPressureMeasurementPoint] = useState<PressureMeasurementPoint>('unknown')
  const [flowMeasurementMethod, setFlowMeasurementMethod] = useState<FlowMeasurementMethod>('unknown')
  const [pressureConditions, setPressureConditions] = useState('')
  const [notes, setNotes] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  const copy = useMemo(() => {
    if (language === 'ru') return {
      title: 'Помощник подбора полива Florial',
      intro: 'Начнём с автоматического полива газона. Сначала зададим фактическую геометрию участка, затем уточним источник воды.',
      back: 'На главную', breadcrumbCatalog: 'Всё оборудование для полива', breadcrumbService: 'Инженер по системам полива', module: 'Модуль 1 · Газон', step: 'Шаг', of: 'из 3',
      areaTitle: 'Задайте контур газона', shape: 'Форма участка',
      rectangle: 'Прямоугольник', lShape: 'Г-образный участок',
      length: 'Общая длина, м', width: 'Общая ширина, м',
      cutoutWidth: 'Ширина выреза, м', cutoutDepth: 'Глубина выреза, м',
      cutoutCorner: 'В каком углу находится вырез?',
      cornerTopLeft: 'Сверху слева', cornerTopRight: 'Сверху справа', cornerBottomLeft: 'Снизу слева', cornerBottomRight: 'Снизу справа',
      geometryHint: 'Укажите размеры по фактическим измерениям. Для Г-образной формы задайте габариты всего участка и размеры прямоугольной части, которой нет.',
      geometryDimensionsInvalid: 'Проверьте размеры: все значения должны быть больше нуля, а вырез должен быть меньше общей длины и ширины.',
      geometryPreview: 'Схема участка', calculatedArea: 'Рассчитанная площадь', perimeter: 'Периметр контура',
      confirmGeometry: 'Подтверждаю, что размеры сняты на месте и схема соответствует фактическому газону.',
      geometryNotConfirmed: 'Подтвердите геометрию, чтобы перейти дальше. Площадь рассчитана по введённым размерам.',
      geometryAccepted: 'Геометрия подтверждена. Расчёт площади выполнен проверяющим модулем Florial.',
      geometryInvalid: 'Не удалось проверить контур. Измените размеры или обратитесь к специалисту.',
      next: 'Далее', prev: 'Назад', waterTitle: 'Источник воды',
      mains: 'Водопровод', well: 'Скважина / колодец', tank: 'Резервуар / ёмкость', unknown: 'Пока не знаю',
      flow: 'Измеренный расход, л/мин', pressure: 'Сообщённое давление, бар',
      pressureTypeLabel: 'Как измеряли давление?', pressureStatic: 'Статическое (без расхода воды)', pressureDynamic: 'Динамическое (вода расходуется)', pressureUnknown: 'Не знаю', pressurePointLabel: 'Где измеряли давление?', pressureAtSource: 'На источнике воды', pressureAtIrrigationPoint: 'В точке подключения дождевателя / зоны', pressurePointUnknown: 'Не знаю', flowMethodLabel: 'Как измеряли расход?', flowMeter: 'Расходомером', flowTimedVolume: 'Объём за измеренное время', flowMethodUnknown: 'Не знаю', pressureConditionsLabel: 'Условия измерения (необязательно)', pressureConditionsPlaceholder: 'Например: открыт один кран, одновременно работают другие потребители…',
      optional: 'Если знаете значения — укажите. Если нет, оставьте поля пустыми. Важно различать статическое давление и давление при реальном расходе воды.',
      detailsTitle: 'Дополнительные сведения', notes: 'Например: дорожки, деревья, уклоны или места, которые нельзя поливать. На этом этапе они не вычитаются из площади автоматически.',
      finish: 'Сформировать исходные данные', guidedPrompts: ['Сначала уточним форму и реальные размеры газона. Вы сможете проверить схему перед продолжением.', 'Теперь уточним источник воды и измерения. Если давление измерено без расхода, отметьте его как статическое.', 'Добавьте препятствия и важные условия участка. После этого мы сформируем структурированную карточку исходных данных.'], summaryTitle: 'Исходные данные участка',
      summaryArea: 'Чистая площадь', summaryShape: 'Форма', summaryWater: 'Источник воды',
      summaryFlow: 'Расход', summaryPressure: 'Давление (со слов клиента)', summaryPressureType: 'Тип давления', summaryPressurePoint: 'Точка измерения давления', summaryFlowMethod: 'Метод измерения расхода', summaryNotes: 'Примечания',
      ready: 'Данные собраны', pressureStaticValue: 'Статическое', pressureDynamicValue: 'Динамическое', pressureUnknownValue: 'Не указано', pressureSourceValue: 'На источнике', pressurePointValue: 'В точке полива', pressurePointUnknownValue: 'Не указано', flowMeterValue: 'Расходомер', flowTimedValue: 'Объём / время', flowUnknownValue: 'Не указано', disclaimer: 'Это исходные данные для предварительного подбора, а не готовый гидравлический проект. Геометрия подтверждена только по введённым вами размерам. Препятствия и исключаемые зоны пока не нанесены. Точное количество дождевателей, зоны, диаметры труб и совместимое оборудование определяются после проверки измерений, покрытия и характеристик конкретных моделей. Приблизительные значения не подменяют инженерный расчёт.',
      restart: 'Изменить ответы', home: 'Вернуться в магазин', unit: 'м²', flowUnit: 'л/мин', shapeRectangle: 'Прямоугольник', shapeL: 'Г-образный контур',
    }
    if (language === 'en') return {
      title: 'Florial Irrigation Assistant',
      intro: 'Let’s start with automatic lawn irrigation. First, define the measured site geometry, then tell us about the water source.',
      back: 'Home', breadcrumbCatalog: 'All irrigation equipment', breadcrumbService: 'Irrigation systems specialist', module: 'Module 1 · Lawn', step: 'Step', of: 'of 3',
      areaTitle: 'Define the lawn outline', shape: 'Plot shape',
      rectangle: 'Rectangle', lShape: 'L-shaped lawn',
      length: 'Overall length, m', width: 'Overall width, m',
      cutoutWidth: 'Cut-out width, m', cutoutDepth: 'Cut-out depth, m',
      cutoutCorner: 'Which corner contains the cut-out?',
      cornerTopLeft: 'Top left', cornerTopRight: 'Top right', cornerBottomLeft: 'Bottom left', cornerBottomRight: 'Bottom right',
      geometryHint: 'Enter dimensions from actual measurements. For an L-shape, enter the overall dimensions and the dimensions of the missing rectangular corner.',
      geometryDimensionsInvalid: 'Check the dimensions: all values must be greater than zero, and the cut-out must be smaller than the overall length and width.',
      geometryPreview: 'Site outline', calculatedArea: 'Calculated area', perimeter: 'Outline perimeter',
      confirmGeometry: 'I confirm that these dimensions were measured on site and the outline matches the actual lawn.',
      geometryNotConfirmed: 'Confirm the geometry to continue. The area is calculated from the dimensions entered.',
      geometryAccepted: 'Geometry confirmed. Area was calculated by the Florial validation module.',
      geometryInvalid: 'The outline could not be validated. Adjust the dimensions or contact a specialist.',
      next: 'Continue', prev: 'Back', waterTitle: 'Water source',
      mains: 'Mains water', well: 'Borehole / well', tank: 'Storage tank', unknown: 'Not sure yet',
      flow: 'Measured flow rate, L/min', pressure: 'Reported pressure, bar',
      pressureTypeLabel: 'How was pressure measured?', pressureStatic: 'Static (no water flowing)', pressureDynamic: 'Dynamic (water flowing)', pressureUnknown: 'Not sure', pressurePointLabel: 'Where was pressure measured?', pressureAtSource: 'At the water source', pressureAtIrrigationPoint: 'At the sprinkler / zone connection point', pressurePointUnknown: 'Not sure', flowMethodLabel: 'How was flow measured?', flowMeter: 'With a flow meter', flowTimedVolume: 'Timed volume measurement', flowMethodUnknown: 'Not sure', pressureConditionsLabel: 'Measurement conditions (optional)', pressureConditionsPlaceholder: 'For example: one tap open, other consumers running at the same time…',
      optional: 'Enter these if known; otherwise leave blank. Static pressure must be distinguished from pressure measured while water is flowing.',
      detailsTitle: 'Additional details', notes: 'For example: paths, trees, slopes or areas that must not be watered. These are not automatically deducted from the area at this stage.',
      finish: 'Prepare site details', guidedPrompts: ['First, let’s define the lawn shape and measured dimensions. You can confirm the outline before continuing.', 'Next, we’ll record the water source and measurements. If pressure was measured with no water flowing, mark it as static.', 'Add obstacles and important site conditions. We’ll then prepare a structured site-intake record.'], summaryTitle: 'Site information',
      summaryArea: 'Net area', summaryShape: 'Shape', summaryWater: 'Water source',
      summaryFlow: 'Flow rate', summaryPressure: 'Pressure (customer-reported)', summaryPressureType: 'Pressure type', summaryPressurePoint: 'Measurement point', summaryFlowMethod: 'Flow measurement method', summaryNotes: 'Notes',
      ready: 'Information collected', pressureStaticValue: 'Static', pressureDynamicValue: 'Dynamic', pressureUnknownValue: 'Not specified', pressureSourceValue: 'At source', pressurePointValue: 'At irrigation point', pressurePointUnknownValue: 'Not specified', flowMeterValue: 'Flow meter', flowTimedValue: 'Volume / time', flowUnknownValue: 'Not specified', disclaimer: 'This is an intake snapshot, not a completed hydraulic design. Geometry is confirmed only against the dimensions you entered. Obstacles and exclusion zones have not yet been mapped. Exact sprinkler quantities, zones, pipe diameters and compatible equipment depend on verified measurements, coverage checks and the specifications of selected models. Guessed values will not replace engineering calculations.',
      restart: 'Edit answers', home: 'Return to the shop', unit: 'm²', flowUnit: 'L/min', shapeRectangle: 'Rectangle', shapeL: 'L-shaped outline',
    }
    return {
      title: 'Помощник за напояване Florial',
      intro: 'Нека започнем с автоматичното напояване на тревна площ. Първо задайте измерената геометрия на терена, след това ще уточним водоизточника.',
      back: 'Начало', breadcrumbCatalog: 'Всичко за поливане', breadcrumbService: 'Инженер по поливни системи', module: 'Модул 1 · Тревна площ', step: 'Стъпка', of: 'от 3',
      areaTitle: 'Задайте контура на тревната площ', shape: 'Форма на терена',
      rectangle: 'Правоъгълна', lShape: 'Г-образна тревна площ',
      length: 'Обща дължина, м', width: 'Обща ширина, м',
      cutoutWidth: 'Ширина на изреза, м', cutoutDepth: 'Дълбочина на изреза, м',
      cutoutCorner: 'В кой ъгъл е изрезът?',
      cornerTopLeft: 'Горе вляво', cornerTopRight: 'Горе вдясно', cornerBottomLeft: 'Долу вляво', cornerBottomRight: 'Долу вдясно',
      geometryHint: 'Въведете размери от реално измерване. За Г-образна форма задайте общите размери и размерите на липсващата правоъгълна част.',
      geometryDimensionsInvalid: 'Проверете размерите: всички стойности трябва да са по-големи от нула, а изрезът трябва да е по-малък от общата дължина и ширина.',
      geometryPreview: 'Схема на терена', calculatedArea: 'Изчислена площ', perimeter: 'Периметър на контура',
      confirmGeometry: 'Потвърждавам, че размерите са измерени на място и схемата съответства на реалната тревна площ.',
      geometryNotConfirmed: 'Потвърдете геометрията, за да продължите. Площта е изчислена по въведените размери.',
      geometryAccepted: 'Геометрията е потвърдена. Площта е изчислена от проверяващия модул на Florial.',
      geometryInvalid: 'Контурът не може да бъде проверен. Коригирайте размерите или се свържете със специалист.',
      next: 'Напред', prev: 'Назад', waterTitle: 'Водоизточник',
      mains: 'Водопровод', well: 'Сондаж / кладенец', tank: 'Резервоар / съд', unknown: 'Все още не знам',
      flow: 'Измерен дебит, л/мин', pressure: 'Посочено налягане, bar',
      pressureTypeLabel: 'Как е измерено налягането?', pressureStatic: 'Статично (без консумация на вода)', pressureDynamic: 'Динамично (при течаща вода)', pressureUnknown: 'Не знам', pressurePointLabel: 'Къде е измерено налягането?', pressureAtSource: 'При водоизточника', pressureAtIrrigationPoint: 'При връзката към разпръсквача / зоната', pressurePointUnknown: 'Не знам', flowMethodLabel: 'Как е измерен дебитът?', flowMeter: 'С дебитомер', flowTimedVolume: 'Измерен обем за определено време', flowMethodUnknown: 'Не знам', pressureConditionsLabel: 'Условия на измерването (по желание)', pressureConditionsPlaceholder: 'Например: отворен е един кран, едновременно работят други консуматори…',
      optional: 'Попълнете, ако знаете стойностите. Важно е да разграничим статичното налягане от налягането при реален дебит на водата.',
      detailsTitle: 'Допълнителна информация', notes: 'Например: алеи, дървета, наклони или места, които не трябва да се напояват. На този етап те не се изваждат автоматично от площта.',
      finish: 'Подготви данните за терена', guidedPrompts: ['Първо ще уточним формата и реалните размери на тревната площ. Ще можете да потвърдите схемата преди да продължим.', 'След това ще запишем водоизточника и измерванията. Ако налягането е измерено без консумация на вода, посочете „статично“.', 'Добавете препятствията и важните условия на терена. След това ще подготвим структурирани изходни данни.'], summaryTitle: 'Данни за терена',
      summaryArea: 'Чиста площ', summaryShape: 'Форма', summaryWater: 'Водоизточник',
      summaryFlow: 'Дебит', summaryPressure: 'Налягане (по данни на клиента)', summaryPressureType: 'Вид налягане', summaryPressurePoint: 'Място на измерване', summaryFlowMethod: 'Метод за измерване на дебита', summaryNotes: 'Бележки',
      ready: 'Данните са събрани', pressureStaticValue: 'Статично', pressureDynamicValue: 'Динамично', pressureUnknownValue: 'Не е посочено', pressureSourceValue: 'При източника', pressurePointValue: 'При поливната точка', pressurePointUnknownValue: 'Не е посочено', flowMeterValue: 'Дебитомер', flowTimedValue: 'Обем / време', flowUnknownValue: 'Не е посочено', disclaimer: 'Това са изходни данни за предварителен подбор, а не завършен хидравличен проект. Геометрията е потвърдена само според въведените от вас размери. Препятствията и зоните без поливане все още не са нанесени. Точният брой разпръсквачи, зони, диаметри на тръбите и съвместимо оборудване се определят след проверка на измерванията, покритието и характеристиките на конкретните модели. Предположенията не заместват инженерното изчисление.',
      restart: 'Промени отговорите', home: 'Обратно към магазина', unit: 'м²', flowUnit: 'л/мин', shapeRectangle: 'Правоъгълен контур', shapeL: 'Г-образен контур',
    }
  }, [language])

  const boundaryVertices = useMemo(() => buildLawnBoundary({
    shape,
    length: Number(length),
    width: Number(width),
    cutoutWidth: Number(cutoutWidth),
    cutoutDepth: Number(cutoutDepth),
    cutoutCorner,
  }), [shape, length, width, cutoutWidth, cutoutDepth, cutoutCorner])

  const geometryValidation = useMemo(() => {
    if (!boundaryVertices) return null
    return validateLawnGeometry({
      schemaVersion: 1,
      coordinateSystem: 'local_cartesian_m',
      status: geometryConfirmed ? 'confirmed' : 'needs_confirmation',
      regions: [{ id: 'lawn-1', boundary: { vertices: boundaryVertices }, exclusions: [] }],
    })
  }, [boundaryVertices, geometryConfirmed])

  const calculatedArea = geometryValidation?.computedAreaM2 ?? 0
  const calculatedPerimeter = geometryValidation?.computedPerimeterM ?? 0
  const geometryAccepted = geometryValidation?.status === 'accepted'
  const shapeLabel = shape === 'rectangle' ? copy.rectangle : copy.lShape
  const waterLabel = waterSource === 'mains' ? copy.mains : waterSource === 'well' ? copy.well : waterSource === 'tank' ? copy.tank : copy.unknown
  const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG'
  const numberFormat = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 })
  const svgPoints = boundaryVertices?.map((point) => numberFormatForSvg(point.x) + ',' + numberFormatForSvg(point.y)).join(' ')

  function numberFormatForSvg(value: number) {
    return String(Math.round(value * 1000) / 1000)
  }

  function updateGeometry(setter: (value: string) => void, value: string) {
    setter(value)
    setGeometryConfirmed(false)
  }

  useEffect(() => {
    applyPageSeo({ fallbackTitle: copy.title + ' | Florial', fallbackDescription: copy.intro, noIndex: true, language })
  }, [copy, language])

  const selectClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-left text-sm text-slate-800 transition hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200'
  const activeClass = 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700'
  const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100'

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-4xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li><a href={localizedHref('/', language)} className="font-medium text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline">{language === 'ru' ? 'Главная' : language === 'en' ? 'Home' : 'Начало'}</a></li>
          <li aria-hidden="true">/</li>
          <li><a href={localizedHref('/category/vsichko-za-polivane', language)} className="font-medium text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline">{copy.breadcrumbCatalog}</a></li>
          <li aria-hidden="true">/</li>
          <li><a href={localizedHref('/services/category/polivni-sistemi', language)} className="font-medium text-emerald-800 underline-offset-4 hover:text-emerald-950 hover:underline">{copy.breadcrumbService}</a></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-slate-700">{copy.title}</li>
        </ol>
      </nav>

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
            <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950" role="status" aria-live="polite">{copy.guidedPrompts[step - 1]}</div>
            <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: (step / 3 * 100) + '%' }} />
            </div>

            {step === 1 ? (
              <div>
                <h2 className="mb-5 text-xl font-bold text-slate-900">{copy.areaTitle}</h2>
                <p className="mb-3 text-sm font-semibold text-slate-700">{copy.shape}</p>
                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => { setShape('rectangle'); setGeometryConfirmed(false) }} aria-pressed={shape === 'rectangle'} className={selectClass + (shape === 'rectangle' ? ' ' + activeClass : '')}>{copy.rectangle}</button>
                  <button type="button" onClick={() => { setShape('l-shape'); setGeometryConfirmed(false) }} aria-pressed={shape === 'l-shape'} className={selectClass + (shape === 'l-shape' ? ' ' + activeClass : '')}>{copy.lShape}</button>
                </div>

                <p className="mb-5 text-sm leading-6 text-slate-600">{copy.geometryHint}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">{copy.length}<input type="number" min="0" step="0.1" inputMode="decimal" value={length} onChange={(event) => updateGeometry(setLength, event.target.value)} className={inputClass} /></label>
                  <label className="block text-sm font-semibold text-slate-700">{copy.width}<input type="number" min="0" step="0.1" inputMode="decimal" value={width} onChange={(event) => updateGeometry(setWidth, event.target.value)} className={inputClass} /></label>
                </div>

                {shape === 'l-shape' && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">{copy.cutoutWidth}<input type="number" min="0" step="0.1" inputMode="decimal" value={cutoutWidth} onChange={(event) => updateGeometry(setCutoutWidth, event.target.value)} className={inputClass} /></label>
                    <label className="block text-sm font-semibold text-slate-700">{copy.cutoutDepth}<input type="number" min="0" step="0.1" inputMode="decimal" value={cutoutDepth} onChange={(event) => updateGeometry(setCutoutDepth, event.target.value)} className={inputClass} /></label>
                    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">{copy.cutoutCorner}
                      <select value={cutoutCorner} onChange={(event) => { setCutoutCorner(event.target.value as LawnCutoutCorner); setGeometryConfirmed(false) }} className={inputClass}>
                        <option value="top-left">{copy.cornerTopLeft}</option>
                        <option value="top-right">{copy.cornerTopRight}</option>
                        <option value="bottom-left">{copy.cornerBottomLeft}</option>
                        <option value="bottom-right">{copy.cornerBottomRight}</option>
                      </select>
                    </label>
                  </div>
                )}

                {boundaryVertices && geometryValidation?.valid && (
                  <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
                    <h3 className="mb-3 text-sm font-bold text-emerald-950">{copy.geometryPreview}</h3>
                    <div className="rounded-xl border border-emerald-100 bg-white p-3">
                      <svg viewBox={'-0.5 -0.5 ' + (Number(length) + 1) + ' ' + (Number(width) + 1)} role="img" aria-label={copy.geometryPreview} className="max-h-64 w-full" preserveAspectRatio="xMidYMid meet">
                        <polygon points={svgPoints} fill="#bbf7d0" stroke="#047857" strokeWidth="0.12" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-semibold text-slate-500">{copy.calculatedArea}</p>
                        <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{numberFormat(calculatedArea)} {copy.unit}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-semibold text-slate-500">{copy.perimeter}</p>
                        <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{numberFormat(calculatedPerimeter)} m</p>
                      </div>
                    </div>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm leading-6 text-slate-800">
                      <input type="checkbox" checked={geometryConfirmed} onChange={(event) => setGeometryConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-emerald-700" />
                      <span>{copy.confirmGeometry}</span>
                    </label>
                    <p role="status" className="mt-3 text-sm leading-6 text-emerald-900">{geometryAccepted ? copy.geometryAccepted : copy.geometryNotConfirmed}</p>
                  </div>
                )}

                {!boundaryVertices && (length !== '' || width !== '' || (shape === 'l-shape' && (cutoutWidth !== '' || cutoutDepth !== ''))) && (
                  <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">{copy.geometryDimensionsInvalid}</p>
                )}
                {boundaryVertices && geometryValidation && !geometryValidation.valid && (
                  <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900">{copy.geometryInvalid}</p>
                )}
              </div>
            ) : step === 2 ? (
              <div>
                <h2 className="mb-5 text-xl font-bold text-slate-900">{copy.waterTitle}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([['mains', copy.mains], ['well', copy.well], ['tank', copy.tank], ['unknown', copy.unknown]] as Array<[WaterSource, string]>).map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setWaterSource(value)} aria-pressed={waterSource === value} className={selectClass + (waterSource === value ? ' ' + activeClass : '')}>{label}</button>
                  ))}
                </div>
                <p className="mb-5 mt-6 text-sm text-slate-500">{copy.optional}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">{copy.flow}<input type="number" min="0" step="0.1" value={flowRate} onChange={(event) => setFlowRate(event.target.value)} className={inputClass} /></label>
                  <label className="block text-sm font-semibold text-slate-700">{copy.pressure}<input type="number" min="0" step="0.1" value={pressure} onChange={(event) => setPressure(event.target.value)} className={inputClass} /></label>
                  <label className="block text-sm font-semibold text-slate-700">{copy.flowMethodLabel}<select value={flowMeasurementMethod} onChange={(event) => setFlowMeasurementMethod(event.target.value as FlowMeasurementMethod)} className={inputClass}><option value="unknown">{copy.flowMethodUnknown}</option><option value="flow_meter">{copy.flowMeter}</option><option value="timed_volume">{copy.flowTimedVolume}</option></select></label>
                  <label className="block text-sm font-semibold text-slate-700">{copy.pressureTypeLabel}<select value={pressureType} onChange={(event) => setPressureType(event.target.value as PressureType)} className={inputClass}><option value="unknown">{copy.pressureUnknown}</option><option value="static">{copy.pressureStatic}</option><option value="dynamic">{copy.pressureDynamic}</option></select></label>
                  <label className="block text-sm font-semibold text-slate-700">{copy.pressurePointLabel}<select value={pressureMeasurementPoint} onChange={(event) => setPressureMeasurementPoint(event.target.value as PressureMeasurementPoint)} className={inputClass}><option value="unknown">{copy.pressurePointUnknown}</option><option value="source">{copy.pressureAtSource}</option><option value="irrigation_point">{copy.pressureAtIrrigationPoint}</option></select></label>
                  <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">{copy.pressureConditionsLabel}<input type="text" maxLength={500} value={pressureConditions} onChange={(event) => setPressureConditions(event.target.value)} placeholder={copy.pressureConditionsPlaceholder} className={inputClass} /></label>
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
                <button type="button" disabled={step === 1 && !geometryAccepted} onClick={() => setStep((current) => Math.min(3, current + 1))} className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{copy.next}</button>
              ) : (
                <button type="button" onClick={() => setShowSummary(true)} className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800">{copy.finish}</button>
              )}
            </div>
          </>
        ) : (
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-700">{copy.ready}</p>
            <h2 className="mb-6 text-2xl font-bold text-slate-900">{copy.summaryTitle}</h2>
            {(() => { const intake = buildIrrigationIntakeSnapshot({ geometryValidation, shape, lengthM: Number(length), widthM: Number(width), cutoutWidthM: Number(cutoutWidth), cutoutDepthM: Number(cutoutDepth), cutoutCorner, waterSource, flowLpm: flowRate === '' ? null : Number(flowRate), flowMeasurementMethod, pressureBar: pressure === '' ? null : Number(pressure), pressureType, pressureMeasurementPoint, pressureConditions, notes }); return <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-bold text-slate-900">{language === 'ru' ? 'Статус исходных данных' : language === 'en' ? 'Intake status' : 'Статус на входните данни'}</p><p className="mt-1 text-sm text-slate-700">{language === 'ru' ? 'Только сбор данных — инженерный и гидравлический расчёт ещё не выполнялся.' : language === 'en' ? 'Intake only — no engineering or hydraulic calculation has been performed.' : 'Само събиране на данни — все още не е извършено инженерно или хидравлично изчисление.'}</p>{intake.warnings.length > 0 && <p className="mt-2 text-xs leading-5 text-amber-800">{language === 'ru' ? 'Требуют уточнения: ' : language === 'en' ? 'Needs clarification: ' : 'Изискват уточнение: '}{language === 'ru' ? 'Некоторые измерения не подтверждены или требуют уточнения перед инженерным расчётом.' : language === 'en' ? 'Some measurements are unverified or need clarification before engineering calculations.' : 'Някои измервания не са потвърдени или изискват уточнение преди инженерното изчисление.'}</p>}</div> })()}
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryArea}</dt><dd className="mt-1 text-lg font-bold text-slate-900">{numberFormat(calculatedArea)} {copy.unit}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryShape}</dt><dd className="mt-1 font-bold text-slate-900">{shapeLabel}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryWater}</dt><dd className="mt-1 font-bold text-slate-900">{waterLabel}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryFlow}</dt><dd className="mt-1 font-bold text-slate-900">{flowRate ? flowRate + ' ' + copy.flowUnit : '—'}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryPressure}</dt><dd className="mt-1 font-bold text-slate-900">{pressure ? pressure + ' bar' : '—'}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryPressureType}</dt><dd className="mt-1 font-bold text-slate-900">{pressureType === 'static' ? copy.pressureStaticValue : pressureType === 'dynamic' ? copy.pressureDynamicValue : copy.pressureUnknownValue}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryPressurePoint}</dt><dd className="mt-1 font-bold text-slate-900">{pressureMeasurementPoint === 'source' ? copy.pressureSourceValue : pressureMeasurementPoint === 'irrigation_point' ? copy.pressurePointValue : copy.pressurePointUnknownValue}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.summaryFlowMethod}</dt><dd className="mt-1 font-bold text-slate-900">{flowMeasurementMethod === 'flow_meter' ? copy.flowMeterValue : flowMeasurementMethod === 'timed_volume' ? copy.flowTimedValue : copy.flowUnknownValue}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{copy.perimeter}</dt><dd className="mt-1 font-bold text-slate-900">{numberFormat(calculatedPerimeter)} m</dd></div>
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
