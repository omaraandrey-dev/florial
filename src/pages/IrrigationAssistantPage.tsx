import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'
import { buildLawnBoundary, type LawnCutoutCorner, type LawnInputShape } from '../lib/irrigation/lawnGeometryInput.mjs'
import { validateLawnGeometry } from '../lib/irrigation/lawnGeometry.mjs'
import { buildIrrigationIntakeSnapshot, evaluateIrrigationIntake } from '../lib/irrigation/irrigationIntake.mjs'
import { buildPreliminaryLawnLayout } from '../lib/irrigation/irrigationLayoutBridge.mjs'

type WaterSource = 'mains' | 'well' | 'tank' | 'unknown'
type PressureType = 'static' | 'dynamic' | 'unknown'
type PressureTestPoint = 'source' | 'tap' | 'lawn_entry' | 'unknown'
type FlowMeasurementMethod = 'bucket' | 'flow_meter' | 'other_verified' | 'unknown'

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
  const [waterSource, setWaterSource] = useState<WaterSource>('unknown')
  const [pressureType, setPressureType] = useState<PressureType>('unknown')
  const [pressureBar, setPressureBar] = useState('')
  const [pressureMeasuredWhileFlowing, setPressureMeasuredWhileFlowing] = useState(false)
  const [pressureTestPoint, setPressureTestPoint] = useState<PressureTestPoint>('unknown')
  const [flowRate, setFlowRate] = useState('')
  const [flowMeasurementMethod, setFlowMeasurementMethod] = useState<FlowMeasurementMethod>('unknown')
  const [notes, setNotes] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  const copy = useMemo(() => {
    if (language === 'ru') return {
      title: 'Помощник подбора полива Florial',
      intro: 'Расскажите о своём участке. Я последовательно соберу исходные данные и покажу, чего не хватает для инженерной проверки.',
      module: 'Проектирование автоматического полива · Газон',
      step: 'Этап', of: 'из 4', welcome: 'Здравствуйте! Помогу подготовить исходные данные для системы полива газона. Начнём с формы и размеров участка.',
      prompts: ['Какую форму имеет газон и каковы его фактические размеры?', 'Откуда поступает вода для полива?', 'Какие измерения давления и расхода воды у вас есть?', 'Есть ли препятствия или ограничения на участке?'],
      geometryTitle: 'Сначала определим контур газона', shape: 'Форма участка', rectangle: 'Прямоугольник', lShape: 'Г-образный участок',
      length: 'Общая длина, м', width: 'Общая ширина, м', cutoutWidth: 'Ширина выреза, м', cutoutDepth: 'Глубина выреза, м',
      cutoutCorner: 'В каком углу находится вырез?', cornerTopLeft: 'Сверху слева', cornerTopRight: 'Сверху справа', cornerBottomLeft: 'Снизу слева', cornerBottomRight: 'Снизу справа',
      geometryHint: 'Укажите размеры по фактическим измерениям. Для Г-образной формы задайте общие габариты и размеры отсутствующей прямоугольной части.',
      geometryPreview: 'Схема по вашим размерам', calculatedArea: 'Площадь по контуру', perimeter: 'Периметр контура',
      geometryInvalid: 'Проверьте размеры. Все значения должны быть больше нуля, а вырез — меньше общей длины и ширины.',
      geometryNotConfirmed: 'Контур автоматически построен по указанным вами примерным размерам.', geometryAccepted: 'Контур подтверждён вами. Это подтверждение исходных размеров, не инженерная проверка.',
      waterTitle: 'Выберите источник воды', mains: 'Водопровод', well: 'Скважина / колодец', tank: 'Резервуар / ёмкость', unknown: 'Пока не знаю',
      pressureTitle: 'Давление воды', pressureUnknown: 'Не измерял(а) / не знаю', static: 'Статическое — без открытого расхода', dynamic: 'Динамическое — при текущей воде',
      pressureValue: 'Измеренное давление, бар', pressureMeasured: 'Подтверждаю: давление измерено во время протока воды.',
      testPoint: 'Где измеряли давление?', source: 'На выходе источника / насоса', tap: 'На ближайшем кране', lawnEntry: 'В точке входа воды на участок',
      flowTitle: 'Расход воды', flowValue: 'Измеренный расход, л/мин', flowMethod: 'Как измеряли расход?', bucket: 'Ёмкость и секундомер', flowMeter: 'Расходомер', otherVerified: 'Другой измерительный прибор', methodUnknown: 'Не измерял(а) / не знаю',
      measurementHint: 'Статическое давление не показывает, какое давление останется при работе дождевателей. Для гидравлической проверки нужны динамическое давление, расход и сведения о трубопроводе.',
      notesTitle: 'Особенности участка', notesPlaceholder: 'Например: дорожки, терраса, деревья, клумбы, бассейн, уклон или зоны, которые нельзя поливать.',
      notesHint: 'Пока это текстовое описание. Препятствия ещё не нанесены на геометрическую схему и не вычитаются из площади.',
      next: 'Продолжить', back: 'Назад', finish: 'Проверить собранные данные', summaryTitle: 'Карточка исходных данных',
      area: 'Площадь', shapeLabel: 'Форма', sourceLabel: 'Источник воды', pressureLabel: 'Давление', flowLabel: 'Расход', notesLabel: 'Ограничения и примечания',
      ready: 'Исходные данные собраны', geometryReady: 'Геометрия подтверждена для предварительной раскладки', geometryMissing: 'Геометрию нужно уточнить или подтвердить',
      dynamicReady: 'Динамическое давление указано с условиями измерения', dynamicMissing: 'Динамическое давление и точка измерения не подтверждены',
      flowReady: 'Расход указан с методом измерения', flowMissing: 'Не хватает подтверждённого измерения расхода',
      hydraulicNotReady: 'Гидравлическая проверка пока не выполнена',
      missingTitle: 'Что ещё потребуется для инженерной проверки',
      missing: {
        confirmed_supported_geometry: 'Подтверждённая поддерживаемая геометрия',
        water_source: 'Определить источник воды',
        dynamic_pressure_and_test_point: 'Динамическое давление и точка его измерения',
        measured_flow_and_method: 'Измеренный расход и метод измерения',
        pipe_network: 'Данные о трубах, диаметрах, длинах и соединениях',
        elevation_profile_or_verified_zero: 'Перепад высот или подтверждение его отсутствия',
        network_restrictions: 'Фильтры, счётчики, клапаны и другие ограничения',
      },
      disclaimer: 'Это предварительный геометрический сценарий на основе подтверждённого контура и точной таблицы производителя. Он не является гидравлическим расчётом или готовым проектом. Потери в трубах, зоны, давление на соплах, совместимость корпуса и форсунки и отсутствие перелива за границы участка пока не проверены.',
      edit: 'Изменить ответы', home: 'Вернуться в магазин', unit: 'м²', noValue: 'Не указано',
      conversation: 'Диалог с помощником', projectPanel: 'Данные проекта', progress: 'Заполнение проекта',
      assistant: 'Помощник Florial', you: 'Вы', notSent: 'Ответ остаётся в этом окне браузера. На сервер он пока не отправляется.',
    }
    if (language === 'en') return {
      title: 'Florial Irrigation Assistant',
      intro: 'Tell us about your site. I will collect the project inputs step by step and show what is still needed for engineering review.',
      module: 'Automatic irrigation design · Lawn',
      step: 'Stage', of: 'of 4', welcome: 'Hello! I will help prepare the information for your lawn irrigation project. Let’s start with the lawn shape and measured dimensions.',
      prompts: ['What is the lawn shape and its measured size?', 'Where will the irrigation water come from?', 'What pressure and flow measurements do you have?', 'Are there obstacles or site restrictions?'],
      geometryTitle: 'First, define the lawn outline', shape: 'Lawn shape', rectangle: 'Rectangle', lShape: 'L-shaped lawn',
      length: 'Overall length, m', width: 'Overall width, m', cutoutWidth: 'Cut-out width, m', cutoutDepth: 'Cut-out depth, m',
      cutoutCorner: 'Which corner contains the cut-out?', cornerTopLeft: 'Top left', cornerTopRight: 'Top right', cornerBottomLeft: 'Bottom left', cornerBottomRight: 'Bottom right',
      geometryHint: 'Use actual site measurements. For an L-shape, enter the overall dimensions and the missing rectangular corner.',
      geometryPreview: 'Outline from your measurements', calculatedArea: 'Area from outline', perimeter: 'Outline perimeter',
      geometryInvalid: 'Check the dimensions. All values must be greater than zero and the cut-out must be smaller than the overall length and width.',
      geometryNotConfirmed: 'The outline is generated automatically from the approximate dimensions you entered.', geometryAccepted: 'You confirmed the outline. This confirms the input dimensions, not an engineering design.',
      waterTitle: 'Choose the water source', mains: 'Mains water', well: 'Borehole / well', tank: 'Storage tank', unknown: 'Not sure yet',
      pressureTitle: 'Water pressure', pressureUnknown: 'Not measured / not sure', static: 'Static — no water flowing', dynamic: 'Dynamic — measured while water flows',
      pressureValue: 'Measured pressure, bar', pressureMeasured: 'I confirm the pressure was measured while water was flowing.',
      testPoint: 'Where was pressure measured?', source: 'At source / pump outlet', tap: 'At a nearby tap', lawnEntry: 'At the water entry point to the lawn',
      flowTitle: 'Water flow', flowValue: 'Measured flow rate, L/min', flowMethod: 'How was the flow measured?', bucket: 'Container and stopwatch', flowMeter: 'Flow meter', otherVerified: 'Other measuring device', methodUnknown: 'Not measured / not sure',
      measurementHint: 'Static pressure does not show the pressure available while sprinklers operate. Hydraulic review needs dynamic pressure, measured flow and pipe-network information.',
      notesTitle: 'Site details and restrictions', notesPlaceholder: 'For example: paths, patio, trees, planting beds, pool, slope or areas that must not be watered.',
      notesHint: 'This is a text note only. Obstacles are not yet drawn on the geometry and are not deducted from the lawn area.',
      next: 'Continue', back: 'Back', finish: 'Review collected information', summaryTitle: 'Project intake record',
      area: 'Area', shapeLabel: 'Shape', sourceLabel: 'Water source', pressureLabel: 'Pressure', flowLabel: 'Flow', notesLabel: 'Restrictions and notes',
      ready: 'Project inputs collected', geometryReady: 'Geometry confirmed for preliminary layout', geometryMissing: 'Geometry needs clarification or confirmation',
      dynamicReady: 'Dynamic pressure and test conditions supplied', dynamicMissing: 'Dynamic pressure and test point are not confirmed',
      flowReady: 'Flow and measurement method supplied', flowMissing: 'A verified flow measurement is still missing',
      hydraulicNotReady: 'Hydraulic feasibility has not been evaluated',
      missingTitle: 'Still needed for engineering review',
      missing: {
        confirmed_supported_geometry: 'Confirmed supported geometry',
        water_source: 'Identify the water source',
        dynamic_pressure_and_test_point: 'Dynamic pressure and its test point',
        measured_flow_and_method: 'Measured flow and measurement method',
        pipe_network: 'Pipe material, internal diameters, lengths and fittings',
        elevation_profile_or_verified_zero: 'Elevation difference or verified zero difference',
        network_restrictions: 'Filters, meters, valves and other restrictions',
      },
      disclaimer: 'This is a preliminary geometric scenario based on the confirmed boundary and an exact manufacturer table point. It is not a hydraulic calculation or a completed design. Pipe losses, zones, nozzle pressure, body/nozzle compatibility and overspray beyond the lawn boundary have not been verified.',
      edit: 'Edit answers', home: 'Return to the shop', unit: 'm²', noValue: 'Not provided',
      conversation: 'Assistant conversation', projectPanel: 'Project details', progress: 'Project intake',
      assistant: 'Florial assistant', you: 'You', notSent: 'Your answers stay in this browser view and are not sent to a server yet.',
    }
    return {
      title: 'Помощник за напояване Florial',
      intro: 'Разкажете за терена. Ще събера последователно данните за проекта и ще покажа какво още е необходимо за инженерна проверка.',
      module: 'Проектиране на автоматично напояване · Тревна площ',
      step: 'Етап', of: 'от 4', welcome: 'Здравейте! Ще помогна да подготвим данните за напояване на тревната площ. Нека започнем с формата и измерените размери.',
      prompts: ['Каква е формата на тревната площ и какви са измерените размери?', 'Откъде ще идва водата за напояване?', 'Какви измервания на налягането и дебита имате?', 'Има ли препятствия или ограничения в терена?'],
      geometryTitle: 'Първо задайте контура на тревната площ', shape: 'Форма на терена', rectangle: 'Правоъгълна', lShape: 'Г-образна тревна площ',
      length: 'Обща дължина, м', width: 'Обща ширина, м', cutoutWidth: 'Ширина на изреза, м', cutoutDepth: 'Дълбочина на изреза, м',
      cutoutCorner: 'В кой ъгъл е изрезът?', cornerTopLeft: 'Горе вляво', cornerTopRight: 'Горе вдясно', cornerBottomLeft: 'Долу вляво', cornerBottomRight: 'Долу вдясно',
      geometryHint: 'Въведете реално измерените размери. За Г-образна форма задайте общите габарити и размерите на липсващата правоъгълна част.',
      geometryPreview: 'Контур според въведените размери', calculatedArea: 'Площ по контура', perimeter: 'Периметър на контура',
      geometryInvalid: 'Проверете размерите. Всички стойности трябва да са положителни, а изрезът — по-малък от общата дължина и ширина.',
      geometryNotConfirmed: 'Контурът се изгражда автоматично по зададените от вас приблизителни размери.', geometryAccepted: 'Вие потвърдихте контура. Това е потвърждение на входните размери, а не инженерно одобрение.',
      waterTitle: 'Изберете водоизточник', mains: 'Водопровод', well: 'Сондаж / кладенец', tank: 'Резервоар / съд', unknown: 'Все още не знам',
      pressureTitle: 'Налягане на водата', pressureUnknown: 'Не е измерено / не знам', static: 'Статично — без протичане на вода', dynamic: 'Динамично — измерено при протичане на вода',
      pressureValue: 'Измерено налягане, bar', pressureMeasured: 'Потвърждавам, че налягането е измерено при протичане на вода.',
      testPoint: 'Къде е измерено налягането?', source: 'На изхода на водоизточника / помпата', tap: 'На близък кран', lawnEntry: 'На входа на водата към терена',
      flowTitle: 'Дебит на водата', flowValue: 'Измерен дебит, л/мин', flowMethod: 'Как измерихте дебита?', bucket: 'Съд и хронометър', flowMeter: 'Дебитомер', otherVerified: 'Друг измервателен уред', methodUnknown: 'Не е измерен / не знам',
      measurementHint: 'Статичното налягане не показва какво налягане ще има при работещи разпръсквачи. За хидравлична проверка са нужни динамично налягане, измерен дебит и данни за тръбната мрежа.',
      notesTitle: 'Особености и ограничения на терена', notesPlaceholder: 'Например: алеи, тераса, дървета, цветни лехи, басейн, наклон или зони, които не трябва да се напояват.',
      notesHint: 'Това засега е текстова бележка. Препятствията още не са нанесени върху геометричната схема и не се изваждат от площта.',
      next: 'Напред', back: 'Назад', finish: 'Преглед на събраните данни', summaryTitle: 'Карта на входните данни',
      area: 'Площ', shapeLabel: 'Форма', sourceLabel: 'Водоизточник', pressureLabel: 'Налягане', flowLabel: 'Дебит', notesLabel: 'Ограничения и бележки',
      ready: 'Входните данни са събрани', geometryReady: 'Геометрията е потвърдена за предварителна схема', geometryMissing: 'Геометрията трябва да се уточни или потвърди',
      dynamicReady: 'Динамичното налягане и условията за измерване са посочени', dynamicMissing: 'Динамичното налягане и точката на измерване не са потвърдени',
      flowReady: 'Посочени са дебит и метод на измерване', flowMissing: 'Липсва потвърдено измерване на дебита',
      hydraulicNotReady: 'Хидравличната пригодност все още не е изчислена',
      missingTitle: 'Какво още е необходимо за инженерна проверка',
      missing: {
        confirmed_supported_geometry: 'Потвърдена геометрия в поддържан формат',
        water_source: 'Да се определи водоизточникът',
        dynamic_pressure_and_test_point: 'Динамично налягане и точка на измерване',
        measured_flow_and_method: 'Измерен дебит и метод на измерване',
        pipe_network: 'Материал, вътрешни диаметри, дължини и фитинги на тръбите',
        elevation_profile_or_verified_zero: 'Разлика във височината или потвърдена липса на такава',
        network_restrictions: 'Филтри, водомери, клапани и други ограничения',
      },
      disclaimer: 'Това е предварителен геометричен сценарий според потвърдения контур и точна точка от таблицата на производителя. Това не е хидравлично изчисление или завършен проект. Загубите в тръбите, зоните, налягането при дюзите, съвместимостта на корпуса и дюзата и разпръскването извън тревната площ все още не са проверени.',
      edit: 'Промени отговорите', home: 'Обратно към магазина', unit: 'м²', noValue: 'Не е посочено',
      conversation: 'Разговор с помощника', projectPanel: 'Данни за проекта', progress: 'Попълване на проекта',
      assistant: 'Помощник Florial', you: 'Вие', notSent: 'Отговорите остават в този прозорец на браузъра и засега не се изпращат към сървър.',
    }
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

  const intakeInput = {
    language,
    shape,
    length,
    width,
    cutoutWidth,
    cutoutDepth,
    cutoutCorner,
    geometryValidation,
    waterSource,
    pressureType,
    pressureBar,
    pressureMeasuredWhileFlowing,
    pressureTestPoint,
    flowRate,
    flowMeasurementMethod,
    notes,
  }
  const readiness = useMemo(() => evaluateIrrigationIntake(intakeInput), [
    language, shape, length, width, cutoutWidth, cutoutDepth, cutoutCorner, geometryValidation,
    waterSource, pressureType, pressureBar, pressureMeasuredWhileFlowing, pressureTestPoint,
    flowRate, flowMeasurementMethod, notes,
  ])
  const snapshot = useMemo(() => buildIrrigationIntakeSnapshot(intakeInput), [
    language, shape, length, width, cutoutWidth, cutoutDepth, cutoutCorner, geometryValidation,
    waterSource, pressureType, pressureBar, pressureMeasuredWhileFlowing, pressureTestPoint,
    flowRate, flowMeasurementMethod, notes,
  ])

  const layoutResult = useMemo(() => showSummary ? buildPreliminaryLawnLayout(snapshot) : null, [snapshot, showSummary])
  const calculatedArea = geometryValidation?.computedAreaM2 ?? 0
  const calculatedPerimeter = geometryValidation?.computedPerimeterM ?? 0
  const geometryAccepted = readiness.geometryReady
  const shapeLabel = shape === 'rectangle' ? copy.rectangle : copy.lShape
  const waterLabel = waterSource === 'mains' ? copy.mains : waterSource === 'well' ? copy.well : waterSource === 'tank' ? copy.tank : copy.unknown
  const pressureLabel = pressureType === 'dynamic' ? copy.dynamic : pressureType === 'static' ? copy.static : copy.pressureUnknown
  const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG'
  const numberFormat = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 })
  const layoutLabels = language === 'ru' ? {
    title: 'Предварительная геометрическая раскладка', candidate: 'Кандидат по таблице производителя',
    heads: 'Количество дождевателей', totalFlow: 'Суммарный расход по таблице, л/мин',
    coverage: 'Выборочное геометрическое покрытие', uncovered: 'Непокрытых контрольных точек',
    positions: 'Координаты дождевателей, м',
    rvanScenarioNote: '3,1 бар — рекомендованная рабочая точка R-VAN по таблице Rain Bird. Это сценарий производителя, а не измеренное давление на сопле.',
    hevanScenarioNote: 'Для HE-VAN использована точка таблицы 2,07 бар, ближайшая к указанному Rain Bird оптимуму 2,1 бар. Это сценарий производителя, а не измеренное давление на сопле.',
    limits: 'Выбор семейства и модели по короткой стороне — предварительное правило для кандидата и требует инженерной проверки. Используются отдельные таблицы R-VAN и HE-VAN. Гидравлика, потери в трубах, зонирование, совместимость корпуса и форсунки, препятствия и перелив за границы участка не проверены. Это не готовая спецификация оборудования.',
    generated: 'Движок построил предварительную раскладку с полным покрытием контрольной сетки.',
    incomplete: 'Движок построил вариант, но контрольная сетка содержит непокрытые точки. Нужна инженерная проверка.',
    unsupported: 'Геометрия выходит за текущую область R-VAN/HE-VAN. Не подменяем расчёт неподтверждённой моделью. Следующий этап — отдельный движок Rain Bird 3500; он пока не включён. До его проверки нужна инженерная оценка.',
    narrow: 'Для узких полос 1–2 м предусмотрены R-VAN-LCS, R-VAN-RCS и R-VAN-SST. Их прямоугольный рисунок полива требует отдельной проверки ориентации и перекрытия; круговой расчёт здесь не подменяем.',
    notReady: 'Для запуска раскладки требуется подтверждённый контур участка.', engineError: 'Текущий инженерный движок не поддерживает эту геометрию или конфигурацию.',
    headToHead: 'Проверка расстояний head-to-head', passed: 'Пройдена', failed: 'Есть замечания',
  } : language === 'en' ? {
    title: 'Preliminary geometric sprinkler layout', candidate: 'Manufacturer-table candidate',
    heads: 'Sprinkler count', totalFlow: 'Total tabulated flow, L/min',
    coverage: 'Sampled geometric coverage', uncovered: 'Uncovered sample points',
    positions: 'Sprinkler coordinates, m',
    rvanScenarioNote: '3.1 bar is the Rain Bird R-VAN recommended operating point. This is a manufacturer scenario, not measured pressure at the nozzle.',
    hevanScenarioNote: 'The HE-VAN table point 2.07 bar is used as the closest exact point to Rain Bird’s 2.1 bar optimum. This is a manufacturer scenario, not measured nozzle pressure.',
    limits: 'Family and model selection from the shorter side is a provisional candidate rule requiring engineering review. Separate R-VAN and HE-VAN manufacturer tables are used. Hydraulics, pipe losses, zoning, body/nozzle compatibility, obstacles and overspray beyond the lawn boundary have not been evaluated. This is not a purchasable equipment specification.',
    generated: 'The engine generated a preliminary layout with all sampled points covered.',
    incomplete: 'The engine generated a candidate, but some sampled points remain uncovered. Engineering review is required.',
    unsupported: 'The geometry is outside the current R-VAN/HE-VAN scope. No unverified model is substituted. The next planned step is a separate Rain Bird 3500 engine; it is not enabled yet. Engineer review is required until that work is validated.',
    narrow: 'For 1–2 m narrow strips, the candidate products are R-VAN-LCS, R-VAN-RCS and R-VAN-SST. Their rectangular spray footprints require a dedicated orientation and overlap check; the circular solver is not used as a substitute.',
    notReady: 'A customer-confirmed lawn boundary is required before layout generation.', engineError: 'The current engineering engine does not support this geometry or configuration.',
    headToHead: 'Head-to-head spacing check', passed: 'Passed', failed: 'Warnings',
  } : {
    title: 'Предварителна геометрична схема на разпръсквачите', candidate: 'Кандидат според таблицата на производителя',
    heads: 'Брой разпръсквачи', totalFlow: 'Общ дебит по таблица, л/мин',
    coverage: 'Геометрично покритие по контролна мрежа', uncovered: 'Непокрити контролни точки',
    positions: 'Координати на разпръсквачите, м',
    rvanScenarioNote: '3,1 bar е препоръчителната работна точка за R-VAN според Rain Bird. Това е сценарий по данните на производителя, а не измерено налягане при дюзата.',
    hevanScenarioNote: 'За HE-VAN е използвана точка 2,07 bar — най-близката точна таблична стойност до оптимума 2,1 bar на Rain Bird. Това е сценарий, а не измерено налягане при дюзата.',
    limits: 'Изборът на семейство и модел според по-късата страна е предварително правило за кандидат и изисква инженерна проверка. Използват се отделни таблици R-VAN и HE-VAN. Хидравликата, загубите в тръбите, зоните, съвместимостта на корпуса и дюзата, препятствията и разпръскването извън тревната площ не са проверени. Това не е готова спецификация за покупка.',
    generated: 'Двигателят създаде предварителна схема с покритие на всички контролни точки.',
    incomplete: 'Двигателят създаде вариант, но има непокрити контролни точки. Необходима е инженерна проверка.',
    unsupported: 'Геометрията е извън текущия обхват на R-VAN/HE-VAN. Не заместваме изчислението с непроверен модел. Следващият планиран етап е отделен двигател за Rain Bird 3500; той все още не е активиран. До валидирането му е необходима инженерна проверка.',
    notReady: 'За изчисление е необходим контур, потвърден от клиента.', engineError: 'Текущият инженерен двигател не поддържа тази геометрия или конфигурация.',
    headToHead: 'Проверка на разстоянието head-to-head', passed: 'Успешна', failed: 'Има забележки',
  }
  const svgPoints = boundaryVertices?.map((point) => String(Math.round(point.x * 1000) / 1000) + ',' + String(Math.round(point.y * 1000) / 1000)).join(' ')
  const progress = showSummary ? 100 : Math.round(step / 4 * 100)

  function updateGeometry(setter: (value: string) => void, value: string) {
    setter(value)
  }

  function answerSummary(stage: number) {
    if (stage === 1) return geometryAccepted
      ? shapeLabel + ' · ' + length + ' × ' + width + ' м · ' + numberFormat(calculatedArea) + ' ' + copy.unit
      : copy.geometryMissing
    if (stage === 2) return waterLabel
    if (stage === 3) {
      const pressure = pressureBar ? pressureBar + ' bar · ' + pressureLabel : copy.pressureUnknown
      const flow = flowRate ? flowRate + ' ' + copy.flowValue.split(',')[1]?.trim() : copy.noValue
      return pressure + ' · ' + flow
    }
    return notes.trim() || copy.noValue
  }

  useEffect(() => {
    applyPageSeo({ fallbackTitle: copy.title + ' | Florial', fallbackDescription: copy.intro, noIndex: true, language })
  }, [copy, language])

  const selectClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-left text-sm text-slate-800 transition hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200'
  const activeClass = 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700'
  const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const steps = [copy.prompts[0], copy.prompts[1], copy.prompts[2], copy.prompts[3]]

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
        <span>{copy.progress}</span><span>{copy.step} {showSummary ? 4 : step} {copy.of}</span>
      </div>
      <div className="mb-7 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: progress + '%' }} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-label={copy.conversation}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg" aria-hidden="true">F</div>
            <div><p className="font-bold text-slate-900">{copy.assistant}</p><p className="text-xs text-slate-500">{copy.conversation}</p></div>
          </div>

          <div className="space-y-4" aria-live="polite">
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{copy.welcome}</div>
            {Array.from({ length: showSummary ? 4 : step - 1 }, (_, index) => index + 1).map((stage) => (
              <div key={stage} className="space-y-2">
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{steps[stage - 1]}</div>
                <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-800">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{copy.you}</p>
                  {answerSummary(stage)}
                </div>
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
                    <button type="button" onClick={() => { setShape('rectangle'); }} aria-pressed={shape === 'rectangle'} className={selectClass + (shape === 'rectangle' ? ' ' + activeClass : '')}>{copy.rectangle}</button>
                    <button type="button" onClick={() => { setShape('l-shape'); }} aria-pressed={shape === 'l-shape'} className={selectClass + (shape === 'l-shape' ? ' ' + activeClass : '')}>{copy.lShape}</button>
                  </div>
                  <p className="mb-4 text-sm leading-6 text-slate-600">{copy.geometryHint}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">{copy.length}<input type="text" inputMode="decimal" value={length} onChange={(event) => updateGeometry(setLength, event.target.value)} className={inputClass} /></label>
                    <label className="block text-sm font-semibold text-slate-700">{copy.width}<input type="text" inputMode="decimal" value={width} onChange={(event) => updateGeometry(setWidth, event.target.value)} className={inputClass} /></label>
                  </div>
                  {shape === 'l-shape' && <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">{copy.cutoutWidth}<input type="text" inputMode="decimal" value={cutoutWidth} onChange={(event) => updateGeometry(setCutoutWidth, event.target.value)} className={inputClass} /></label>
                    <label className="block text-sm font-semibold text-slate-700">{copy.cutoutDepth}<input type="text" inputMode="decimal" value={cutoutDepth} onChange={(event) => updateGeometry(setCutoutDepth, event.target.value)} className={inputClass} /></label>
                    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">{copy.cutoutCorner}<select value={cutoutCorner} onChange={(event) => { setCutoutCorner(event.target.value as LawnCutoutCorner); }} className={inputClass}>
                      <option value="top-left">{copy.cornerTopLeft}</option><option value="top-right">{copy.cornerTopRight}</option><option value="bottom-left">{copy.cornerBottomLeft}</option><option value="bottom-right">{copy.cornerBottomRight}</option>
                    </select></label>
                  </div>}
                  {boundaryVertices && geometryValidation?.valid && <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <h3 className="mb-3 text-sm font-bold text-emerald-950">{copy.geometryPreview}</h3>
                    <div className="rounded-xl border border-emerald-100 bg-white p-3">
                      <svg viewBox={'-0.5 -0.5 ' + (Number(length.replace(',', '.')) + 1) + ' ' + (Number(width.replace(',', '.')) + 1)} role="img" aria-label={copy.geometryPreview} className="max-h-56 w-full" preserveAspectRatio="xMidYMid meet">
                        <polygon points={svgPoints} fill="#bbf7d0" stroke="#047857" strokeWidth="0.12" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">{copy.calculatedArea}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{numberFormat(calculatedArea)} {copy.unit}</p></div>
                      <div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">{copy.perimeter}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{numberFormat(calculatedPerimeter)} m</p></div>
                    </div>
                    <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 text-sm leading-6 text-emerald-900">{geometryAccepted ? copy.geometryAccepted : copy.geometryNotConfirmed}</p>
                  </div>}
                  {!boundaryVertices && (length !== '' || width !== '' || (shape === 'l-shape' && (cutoutWidth !== '' || cutoutDepth !== ''))) && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">{copy.geometryInvalid}</p>}
                  {boundaryVertices && geometryValidation && !geometryValidation.valid && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900">{copy.geometryInvalid}</p>}
                </div>
              ) : step === 2 ? (
                <div>
                  <h2 className="mb-4 text-lg font-bold text-slate-900">{copy.waterTitle}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([['mains', copy.mains], ['well', copy.well], ['tank', copy.tank], ['unknown', copy.unknown]] as Array<[WaterSource, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setWaterSource(value)} aria-pressed={waterSource === value} className={selectClass + (waterSource === value ? ' ' + activeClass : '')}>{label}</button>)}
                  </div>
                </div>
              ) : step === 3 ? (
                <div>
                  <h2 className="mb-4 text-lg font-bold text-slate-900">{copy.pressureTitle}</h2>
                  <div className="grid gap-3">
                    {([['dynamic', copy.dynamic], ['static', copy.static], ['unknown', copy.pressureUnknown]] as Array<[PressureType, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => { setPressureType(value); if (value !== 'dynamic') setPressureMeasuredWhileFlowing(false) }} aria-pressed={pressureType === value} className={selectClass + (pressureType === value ? ' ' + activeClass : '')}>{label}</button>)}
                  </div>
                  <label className="mt-4 block text-sm font-semibold text-slate-700">{copy.pressureValue}<input type="text" inputMode="decimal" value={pressureBar} onChange={(event) => setPressureBar(event.target.value)} className={inputClass} /></label>
                  {pressureType === 'dynamic' && <>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm leading-6 text-slate-700">
                      <input type="checkbox" checked={pressureMeasuredWhileFlowing} onChange={(event) => setPressureMeasuredWhileFlowing(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" /><span>{copy.pressureMeasured}</span>
                    </label>
                    <label className="mt-4 block text-sm font-semibold text-slate-700">{copy.testPoint}<select value={pressureTestPoint} onChange={(event) => setPressureTestPoint(event.target.value as PressureTestPoint)} className={inputClass}>
                      <option value="unknown">{copy.noValue}</option><option value="source">{copy.source}</option><option value="tap">{copy.tap}</option><option value="lawn_entry">{copy.lawnEntry}</option>
                    </select></label>
                  </>}
                  <h3 className="mb-3 mt-7 text-lg font-bold text-slate-900">{copy.flowTitle}</h3>
                  <label className="block text-sm font-semibold text-slate-700">{copy.flowValue}<input type="text" inputMode="decimal" value={flowRate} onChange={(event) => setFlowRate(event.target.value)} className={inputClass} /></label>
                  <label className="mt-4 block text-sm font-semibold text-slate-700">{copy.flowMethod}<select value={flowMeasurementMethod} onChange={(event) => setFlowMeasurementMethod(event.target.value as FlowMeasurementMethod)} className={inputClass}>
                    <option value="unknown">{copy.methodUnknown}</option><option value="bucket">{copy.bucket}</option><option value="flow_meter">{copy.flowMeter}</option><option value="other_verified">{copy.otherVerified}</option>
                  </select></label>
                  <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">{copy.measurementHint}</p>
                </div>
              ) : (
                <div>
                  <h2 className="mb-4 text-lg font-bold text-slate-900">{copy.notesTitle}</h2>
                  <textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={copy.notesPlaceholder} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6 text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                  <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">{copy.notesHint}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button type="button" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40">{copy.back}</button>
                {step < 4 ? <button type="button" disabled={step === 1 && !geometryAccepted} onClick={() => setStep((current) => Math.min(4, current + 1))} className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{copy.next}</button> : <button type="button" onClick={() => setShowSummary(true)} className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800">{copy.finish}</button>}
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
                  <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{copy.sourceLabel}</dt><dd className="mt-1 font-bold text-slate-900">{waterLabel}</dd></div>
                  <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{copy.pressureLabel}</dt><dd className="mt-1 font-bold text-slate-900">{pressureBar ? pressureBar + ' bar · ' + pressureLabel : copy.noValue}</dd></div>
                  <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{copy.flowLabel}</dt><dd className="mt-1 font-bold text-slate-900">{flowRate ? flowRate + ' L/min' : copy.noValue}</dd></div>
                  <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{copy.perimeter}</dt><dd className="mt-1 font-bold text-slate-900">{geometryAccepted ? numberFormat(calculatedPerimeter) + ' m' : copy.noValue}</dd></div>
                  {notes.trim() && <div className="rounded-xl bg-white p-3 sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">{copy.notesLabel}</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800">{notes.trim()}</dd></div>}
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900">{copy.missingTitle}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p className={readiness.geometryReady ? 'text-emerald-800' : 'text-amber-800'}>{readiness.geometryReady ? '✓ ' : '• '}{readiness.geometryReady ? copy.geometryReady : copy.geometryMissing}</p>
                  <p className={readiness.dynamicPressureReady ? 'text-emerald-800' : 'text-amber-800'}>{readiness.dynamicPressureReady ? '✓ ' : '• '}{readiness.dynamicPressureReady ? copy.dynamicReady : copy.dynamicMissing}</p>
                  <p className={readiness.flowReady ? 'text-emerald-800' : 'text-amber-800'}>{readiness.flowReady ? '✓ ' : '• '}{readiness.flowReady ? copy.flowReady : copy.flowMissing}</p>
                </div>
                <h4 className="mb-2 mt-4 text-sm font-semibold text-slate-700">{copy.missingTitle}</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {readiness.missing.map((item) => <li key={item}>{copy.missing[item as keyof typeof copy.missing]}</li>)}
                </ul>
              </div>

              {layoutResult && (
                <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">{layoutLabels.title}</h3>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-900">Preliminary</span>
                  </div>
                  {layoutResult.status === 'layout_generated' || layoutResult.status === 'layout_incomplete' ? (
                    <>
                      <p className="mt-3 text-sm font-semibold text-slate-900">{layoutLabels.candidate}: {layoutResult.operatingScenario?.manufacturer} {layoutResult.operatingScenario?.family} {layoutResult.operatingScenario?.model} · {numberFormat(layoutResult.operatingScenario?.pressureBar ?? 0)} bar</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{layoutResult.status === 'layout_generated' ? layoutLabels.generated : layoutLabels.incomplete}</p>
                      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{layoutLabels.heads}</dt><dd className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{layoutResult.layout?.sprinklers?.length ?? 0}</dd></div>
                        <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{layoutLabels.totalFlow}</dt><dd className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{numberFormat(layoutResult.layout?.totalFlowLpm ?? 0)}</dd></div>
                        <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{layoutLabels.coverage}</dt><dd className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{numberFormat(layoutResult.layout?.coverage?.coveragePercent ?? 0)}%</dd></div>
                        <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{layoutLabels.uncovered}</dt><dd className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{layoutResult.layout?.coverage?.uncoveredPoints ?? 0}</dd></div>
                      </dl>
                      {boundaryVertices && (layoutResult.layout?.sprinklers?.length ?? 0) > 0 && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                          <svg viewBox={'-0.5 -0.5 ' + (Number(length.replace(',', '.')) + 1) + ' ' + (Number(width.replace(',', '.')) + 1)} role="img" aria-label={layoutLabels.title} className="max-h-64 w-full" preserveAspectRatio="xMidYMid meet">
                            <g transform={'translate(0 ' + Number(width.replace(',', '.')) + ') scale(1 -1)'}>
                              <polygon points={svgPoints} fill="#dcfce7" stroke="#047857" strokeWidth="0.12" strokeLinejoin="round" />
                              {layoutResult.layout.sprinklers.map((sprinkler: { id: string; position: { x: number; y: number } }) => (
                                <circle key={sprinkler.id} cx={sprinkler.position.x} cy={sprinkler.position.y} r="0.18" fill="#0369a1" stroke="#ffffff" strokeWidth="0.08" />
                              ))}
                            </g>
                          </svg>
                        </div>
                      )}
                      <div className="mt-3 rounded-xl bg-white p-3 text-sm">
                        <p className="font-semibold text-slate-800">{layoutLabels.headToHead}: <span className={layoutResult.layout?.headToHead?.passed ? 'text-emerald-700' : 'text-amber-700'}>{layoutResult.layout?.headToHead?.passed ? layoutLabels.passed : layoutLabels.failed}</span></p>
                        <p className="mt-2 text-xs leading-5 text-slate-600">{(layoutResult.operatingScenario?.family === 'HE-VAN' ? layoutLabels.hevanScenarioNote : layoutLabels.rvanScenarioNote)}</p>
                      </div>
                      <details className="mt-3 rounded-xl bg-white p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-800">{layoutLabels.positions}</summary>
                        <ol className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                          {layoutResult.layout?.sprinklers?.map((sprinkler: { id: string; position: { x: number; y: number }; arcDeg: number }) => (
                            <li key={sprinkler.id}>{sprinkler.id}: X {numberFormat(sprinkler.position.x)}, Y {numberFormat(sprinkler.position.y)} · {sprinkler.arcDeg}°</li>
                          ))}
                        </ol>
                      </details>
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-amber-900">{layoutResult.status === 'requires_rotor_engine' ? layoutLabels.unsupported : ['strip_nozzle_layout_required', 'short_side_below_supported_rvan_scope'].includes(layoutResult.status) ? layoutLabels.narrow : layoutResult.status === 'needs_confirmed_geometry' ? layoutLabels.notReady : layoutLabels.engineError}</p>
                    {layoutResult.status === 'strip_nozzle_layout_required' && (
                      <ul className="mt-2 grid gap-1 text-xs text-slate-600">
                        {layoutResult.stripSpecifications?.map((specification: { model: string; widthM: number; lengthM: number }) => (
                          <li key={specification.model}>{specification.model} · {numberFormat(specification.widthM)} × {numberFormat(specification.lengthM)} m</li>
                        ))}
                      </ul>
                    )}
                  )}
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950">{layoutLabels.limits}</p>
                </section>
              )}
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">{copy.hydraulicNotReady}. {copy.disclaimer}</p>
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
            <div><dt className="text-xs font-semibold text-slate-500">{copy.sourceLabel}</dt><dd className="mt-1 font-semibold text-slate-900">{waterLabel}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">{copy.pressureLabel}</dt><dd className="mt-1 font-semibold text-slate-900">{pressureBar ? pressureBar + ' bar · ' + pressureLabel : copy.noValue}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">{copy.flowLabel}</dt><dd className="mt-1 font-semibold text-slate-900">{flowRate ? flowRate + ' L/min' : copy.noValue}</dd></div>
          </dl>
          <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">{copy.hydraulicNotReady}</div>
          <p className="mt-4 text-xs leading-5 text-slate-500">{copy.notSent}</p>
        </aside>
      </div>
    </main>
  )
}
