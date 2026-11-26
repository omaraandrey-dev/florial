import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { applyPageSeo } from '../lib/seo'
import { localizedHref } from '../lib/navigation'
import { sanityLiveClient } from '../lib/sanity'
import type { Product } from '../types'
import type { IrrigationProjectSnapshot } from '../services/orderService'
import { buildLawnBoundary, type LawnCutoutCorner, type LawnInputShape } from '../lib/irrigation/lawnGeometryInput.mjs'
import { buildLawnDimensionAnnotations } from '../lib/irrigation/lawnDimensionAnnotations.mjs'
import { validateLawnGeometry } from '../lib/irrigation/lawnGeometry.mjs'
import { buildIrrigationIntakeSnapshot, evaluateIrrigationIntake } from '../lib/irrigation/irrigationIntake.mjs'
import { buildPreliminaryLawnLayout } from '../lib/irrigation/irrigationLayoutBridge.mjs'
import { buildIrrigationBillOfMaterials } from '../lib/irrigation/irrigationBillOfMaterials.mjs'
import { buildIrrigationAutomationBillOfMaterials, buildIrrigationAutomationPlan, IRRIGATION_AUTOMATION_PRODUCT_SKUS } from '../lib/irrigation/irrigationAutomation.mjs'

interface IrrigationAssistantPageProps {
  onNavigateHome: () => void
  onNavigateCart: () => void
  onAddToCart: (product: Product, quantity: number) => void
  onSetIrrigationProject: (project: IrrigationProjectSnapshot) => void
}

type NonIrrigatedAreaKind = 'pool' | 'building' | 'patio'

type NonIrrigatedAreaInput = {
  id: number
  kind: NonIrrigatedAreaKind
  x: string
  y: string
  width: string
  height: string
}

function exclusionColors(kind: string) {
  if (kind === 'pool') return { fill: '#7dd3fc', stroke: '#0369a1', detail: '#0284c7' }
  if (kind === 'building') return { fill: '#fecaca', stroke: '#b91c1c', detail: '#991b1b' }
  return { fill: '#d1d5db', stroke: '#6b7280', detail: '#9ca3af' }
}

function sprinklerNozzleColor(model: string | null | undefined) {
  const normalized = String(model ?? '').replace(/-360$/, '')
  if (normalized === '3504-PC') return '#173b79'
  if (normalized === 'R-VAN14') return '#3b82f6'
  if (normalized === 'R-VAN18') return '#c49a6c'
  if (normalized === 'R-VAN24') return '#800020'
  if (['R-VAN-LCS', 'R-VAN-RCS', 'R-VAN-SST'].includes(normalized)) return '#6b7280'
  return '#64748b'
}

function sprinklerSectorPath(position: { x: number; y: number }, radiusM: number, arcDeg: number, directionDeg: number | null) {
  if (!Number.isFinite(radiusM) || radiusM <= 0 || !Number.isFinite(arcDeg) || arcDeg <= 0 || arcDeg >= 360 || !Number.isFinite(directionDeg)) return ''
  const start = (directionDeg as number) - arcDeg / 2
  const steps = Math.max(12, Math.ceil(arcDeg / 3))
  const points = Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (start + arcDeg * index / steps) * Math.PI / 180
    return {
      x: position.x + Math.cos(angle) * radiusM,
      y: position.y + Math.sin(angle) * radiusM,
    }
  })
  return 'M ' + position.x + ' ' + position.y + ' L ' +
    points.map((point) => point.x + ' ' + point.y).join(' L ') + ' Z'
}

function DimensionAnnotations({ annotations, heightM, format }: {
  annotations: ReadonlyArray<{
    id: string
    lengthM: number
    lineStart: { x: number; y: number }
    lineEnd: { x: number; y: number }
    labelPosition: { x: number; y: number }
    angleDeg: number
  }>
  heightM: number
  format: (value: number) => string
}) {
  return (
    <g aria-hidden="true">
      {annotations.map((entry) => (
        <g key={entry.id}>
          <line
            x1={entry.lineStart.x} y1={heightM - entry.lineStart.y}
            x2={entry.lineEnd.x} y2={heightM - entry.lineEnd.y}
            stroke="#475569" strokeWidth="0.045" strokeLinecap="round"
          />
          <g transform={'translate(' + entry.labelPosition.x + ' ' + (heightM - entry.labelPosition.y) + ') rotate(' + entry.angleDeg + ')'}>
            <rect x="-0.78" y="-0.27" width="1.56" height="0.54" rx="0.12" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.035" />
            <text x="0" y="0.12" textAnchor="middle" fontSize="0.31" fontWeight="700" fill="#0f172a">
              {format(entry.lengthM)} m
            </text>
          </g>
        </g>
      ))}
    </g>
  )
}

export function IrrigationAssistantPage({ onNavigateHome, onNavigateCart, onAddToCart, onSetIrrigationProject }: IrrigationAssistantPageProps) {
  const { language } = useI18n()
  const [shape, setShape] = useState<LawnInputShape>('rectangle')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [cutoutWidth, setCutoutWidth] = useState('')
  const [cutoutDepth, setCutoutDepth] = useState('')
  const [cutoutCorner, setCutoutCorner] = useState<LawnCutoutCorner>('top-right')
  const [nonIrrigatedAreas, setNonIrrigatedAreas] = useState<NonIrrigatedAreaInput[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [catalogProducts, setCatalogProducts] = useState<Record<string, Product>>({})
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [showAutomationChoice, setShowAutomationChoice] = useState(false)
  const [automationChoice, setAutomationChoice] = useState<'manual' | 'tm2' | 'rc2' | 'bat' | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const hasMountedRef = useRef(false)

  const copy = useMemo(() => {
    if (language === 'ru') return {
      title: 'Помощник подбора полива Florial',
      intro: 'Укажите приблизительные размеры газона. Я подготовлю предварительную схему дождевателей и трассу труб по стандартным условиям Florial.',
      module: 'Проектирование автоматического полива · Газон',
      step: 'Этап', of: 'из 1', welcome: 'Здравствуйте! Помогу подготовить исходные данные для системы полива газона. Начнём с формы и размеров участка.',
      prompts: ['Какую форму и примерные размеры имеет газон?', 'Есть ли препятствия или ограничения на участке?'],
      geometryTitle: 'Сначала определим контур газона', shape: 'Форма участка', rectangle: 'Прямоугольник', lShape: 'Г-образный участок',
      length: 'Общая длина, м', width: 'Общая ширина, м', cutoutWidth: 'Ширина выреза, м', cutoutDepth: 'Глубина выреза, м',
      cutoutCorner: 'В каком углу находится вырез?', cornerTopLeft: 'Сверху слева', cornerTopRight: 'Сверху справа', cornerBottomLeft: 'Снизу слева', cornerBottomRight: 'Снизу справа',
      geometryHint: 'Укажите примерные размеры. Для Г-образной формы задайте общие габариты и размеры отсутствующей прямоугольной части.',
      nonIrrigatedTitle: 'Дополнительные неполиваемые участки', nonIrrigatedHint: 'Добавьте прямоугольные зоны внутри газона, которые не нужно поливать. X и Y отсчитываются от левого нижнего угла участка. Координаты X и Y могут быть нулевыми, но не отрицательными; ширина и длина должны быть больше нуля.', excludedKind: 'Тип участка', pool: 'Бассейн', building: 'Дом / беседка', patio: 'Площадка', invalidExclusion: 'Проверьте вырез: X и Y должны быть неотрицательными, ширина и длина — больше нуля.', excludedX: 'X, м', excludedY: 'Y, м', excludedWidth: 'Ширина, м', excludedHeight: 'Длина, м', addExcluded: 'Добавить неполиваемый участок', removeExcluded: 'Удалить',
      geometryPreview: 'Предварительная схема по приблизительным размерам', calculatedArea: 'Площадь по контуру', perimeter: 'Периметр контура',
      geometryInvalid: 'Проверьте размеры. Все значения должны быть больше нуля, а вырез — меньше общей длины и ширины.',
      geometryNotConfirmed: 'Подтвердите контур, чтобы продолжить.', geometryAccepted: 'Контур подтверждён вами. Это подтверждение исходных размеров, не инженерная проверка.',
      waterTitle: 'Выберите источник воды', mains: 'Водопровод', well: 'Скважина / колодец', tank: 'Резервуар / ёмкость', unknown: 'Пока не знаю',
      pressureTitle: 'Давление воды', pressureUnknown: 'Не измерял(а) / не знаю', static: 'Статическое — без открытого расхода', dynamic: 'Динамическое — при текущей воде',
      pressureValue: 'Измеренное давление, бар', pressureMeasured: 'Подтверждаю: давление измерено во время протока воды.',
      testPoint: 'Где измеряли давление?', source: 'На выходе источника / насоса', tap: 'На ближайшем кране', lawnEntry: 'В точке входа воды на участок',
      flowTitle: 'Расход воды', flowValue: 'Измеренный расход, л/мин', flowMethod: 'Как измеряли расход?', bucket: 'Ёмкость и секундомер', flowMeter: 'Расходомер', otherVerified: 'Другой измерительный прибор', methodUnknown: 'Не измерял(а) / не знаю',
      measurementHint: 'Статическое давление не показывает, какое давление останется при работе дождевателей. Для гидравлической проверки нужны динамическое давление, расход и сведения о трубопроводе.',
      next: 'Продолжить', back: 'Назад', finish: 'Проверить собранные данные', summaryTitle: 'Карточка исходных данных',
      area: 'Площадь', shapeLabel: 'Форма', sourceLabel: 'Источник воды', pressureLabel: 'Давление', flowLabel: 'Расход',
      ready: 'Исходные данные собраны', geometryReady: 'Геометрия подтверждена для предварительной раскладки', geometryMissing: 'Геометрию нужно уточнить или подтвердить',
      dynamicReady: 'Динамическое давление указано с условиями измерения', dynamicMissing: 'Динамическое давление и точка измерения не подтверждены',
      flowReady: 'Расход указан с методом измерения', flowMissing: 'Не хватает подтверждённого измерения расхода',
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
      edit: 'Изменить ответы', home: 'Вернуться в магазин', unit: 'м²', noValue: 'Не указано',
      conversation: 'Диалог с помощником', projectPanel: 'Данные проекта', progress: 'Заполнение проекта',
      assistant: 'Помощник Florial', you: 'Вы', notSent: 'Проект будет приложен к заказу и отправлен Florial в отдельном PDF после успешного оформления.',
    }
    if (language === 'en') return {
      title: 'Florial Irrigation Assistant',
      intro: 'Enter the approximate lawn dimensions. I will prepare a preliminary sprinkler layout and pipe route using Florial standard assumptions.',
      module: 'Automatic irrigation design · Lawn',
      step: 'Stage', of: 'of 1', welcome: 'Hello! I will help prepare the information for your lawn irrigation project. Let’s start with the lawn shape and measured dimensions.',
      prompts: ['What is the lawn shape and approximate size?', 'Are there obstacles or site restrictions?'],
      geometryTitle: 'First, define the lawn outline', shape: 'Lawn shape', rectangle: 'Rectangle', lShape: 'L-shaped lawn',
      length: 'Overall length, m', width: 'Overall width, m', cutoutWidth: 'Cut-out width, m', cutoutDepth: 'Cut-out depth, m',
      cutoutCorner: 'Which corner contains the cut-out?', cornerTopLeft: 'Top left', cornerTopRight: 'Top right', cornerBottomLeft: 'Bottom left', cornerBottomRight: 'Bottom right',
      geometryHint: 'Enter approximate dimensions. For an L-shape, enter the overall dimensions and the dimensions of the missing rectangular corner.',
      nonIrrigatedTitle: 'Additional non-irrigated areas', nonIrrigatedHint: 'Add rectangular areas inside the lawn that must not be watered. X and Y are measured from the lower-left corner. X and Y may be zero but cannot be negative; width and length must be greater than zero.', excludedKind: 'Area type', pool: 'Swimming pool', building: 'House / gazebo', patio: 'Paved area', invalidExclusion: 'Check the cut-out: X and Y must be non-negative, and width and length must be greater than zero.', excludedX: 'X, m', excludedY: 'Y, m', excludedWidth: 'Width, m', excludedHeight: 'Length, m', addExcluded: 'Add non-irrigated area', removeExcluded: 'Remove',
      geometryPreview: 'Preliminary outline from approximate dimensions', calculatedArea: 'Area from outline', perimeter: 'Outline perimeter',
      confirmGeometry: 'I confirm these dimensions were measured on site and the outline matches the actual lawn.',
      geometryInvalid: 'Check the dimensions. All values must be greater than zero and the cut-out must be smaller than the overall length and width.',
      geometryNotConfirmed: 'Enter valid dimensions to continue.', geometryAccepted: 'A preliminary outline has been created from approximate dimensions.',
      waterTitle: 'Choose the water source', mains: 'Mains water', well: 'Borehole / well', tank: 'Storage tank', unknown: 'Not sure yet',
      pressureTitle: 'Water pressure', pressureUnknown: 'Not measured / not sure', static: 'Static — no water flowing', dynamic: 'Dynamic — measured while water flows',
      pressureValue: 'Measured pressure, bar', pressureMeasured: 'I confirm the pressure was measured while water was flowing.',
      testPoint: 'Where was pressure measured?', source: 'At source / pump outlet', tap: 'At a nearby tap', lawnEntry: 'At the water entry point to the lawn',
      flowTitle: 'Water flow', flowValue: 'Measured flow rate, L/min', flowMethod: 'How was the flow measured?', bucket: 'Container and stopwatch', flowMeter: 'Flow meter', otherVerified: 'Other measuring device', methodUnknown: 'Not measured / not sure',
      measurementHint: 'Static pressure does not show the pressure available while sprinklers operate. Hydraulic review needs dynamic pressure, measured flow and pipe-network information.',
      next: 'Continue', back: 'Back', finish: 'Review collected information', summaryTitle: 'Project intake record',
      area: 'Area', shapeLabel: 'Shape', sourceLabel: 'Water source', pressureLabel: 'Pressure', flowLabel: 'Flow',
      ready: 'Project inputs collected', geometryReady: 'Geometry confirmed for preliminary layout', geometryMissing: 'Geometry needs clarification or confirmation',
      dynamicReady: 'Dynamic pressure and test conditions supplied', dynamicMissing: 'Dynamic pressure and test point are not confirmed',
      flowReady: 'Flow and measurement method supplied', flowMissing: 'A verified flow measurement is still missing',
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
      edit: 'Edit answers', home: 'Return to the shop', unit: 'm²', noValue: 'Not provided',
      conversation: 'Assistant conversation', projectPanel: 'Project details', progress: 'Project intake',
      assistant: 'Florial assistant', you: 'You', notSent: 'The irrigation project will be attached to your order and emailed to Florial as a separate PDF after successful checkout.',
    }
    return {
      title: 'Помощник за напояване Florial',
      intro: 'Въведете приблизителните размери на тревната площ. Ще подготвя предварителна схема на разпръсквачите и трасето на тръбите според стандартните условия на Florial.',
      module: 'Проектиране на автоматично напояване · Тревна площ',
      step: 'Етап', of: 'от 1', welcome: 'Здравейте! Ще помогна да подготвим данните за напояване на тревната площ. Нека започнем с формата и измерените размери.',
      prompts: ['Каква е формата и приблизителният размер на тревната площ?', 'Има ли препятствия или ограничения в терена?'],
      geometryTitle: 'Първо задайте контура на тревната площ', shape: 'Форма на терена', rectangle: 'Правоъгълна', lShape: 'Г-образна тревна площ',
      length: 'Обща дължина, м', width: 'Обща ширина, м', cutoutWidth: 'Ширина на изреза, м', cutoutDepth: 'Дълбочина на изреза, м',
      cutoutCorner: 'В кой ъгъл е изрезът?', cornerTopLeft: 'Горе вляво', cornerTopRight: 'Горе вдясно', cornerBottomLeft: 'Долу вляво', cornerBottomRight: 'Долу вдясно',
      geometryHint: 'Въведете приблизителните размери. За Г-образна форма задайте общите габарити и размерите на липсващата правоъгълна част.',
      nonIrrigatedTitle: 'Допълнителни неполивани зони', nonIrrigatedHint: 'Добавете правоъгълни зони в тревната площ, които не трябва да се напояват. X и Y се измерват от долния ляв ъгъл. X и Y могат да бъдат нула, но не и отрицателни; ширината и дължината трябва да са по-големи от нула.', excludedKind: 'Вид на зоната', pool: 'Басейн', building: 'Къща / беседка', patio: 'Площадка', invalidExclusion: 'Проверете изреза: X и Y трябва да са неотрицателни, а ширината и дължината — по-големи от нула.', excludedX: 'X, м', excludedY: 'Y, м', excludedWidth: 'Ширина, м', excludedHeight: 'Дължина, м', addExcluded: 'Добави неполивана зона', removeExcluded: 'Премахни',
      geometryPreview: 'Предварителен контур според приблизителните размери', calculatedArea: 'Площ по контура', perimeter: 'Периметър на контура',
      confirmGeometry: 'Потвърждавам, че размерите са измерени на място и контурът съответства на реалната тревна площ.',
      geometryInvalid: 'Проверете размерите. Всички стойности трябва да са положителни, а изрезът — по-малък от общата дължина и ширина.',
      geometryNotConfirmed: 'Въведете валидни размери, за да продължите.', geometryAccepted: 'Предварителният контур е построен по приблизителните размери.',
      waterTitle: 'Изберете водоизточник', mains: 'Водопровод', well: 'Сондаж / кладенец', tank: 'Резервоар / съд', unknown: 'Все още не знам',
      pressureTitle: 'Налягане на водата', pressureUnknown: 'Не е измерено / не знам', static: 'Статично — без протичане на вода', dynamic: 'Динамично — измерено при протичане на вода',
      pressureValue: 'Измерено налягане, bar', pressureMeasured: 'Потвърждавам, че налягането е измерено при протичане на вода.',
      testPoint: 'Къде е измерено налягането?', source: 'На изхода на водоизточника / помпата', tap: 'На близък кран', lawnEntry: 'На входа на водата към терена',
      flowTitle: 'Дебит на водата', flowValue: 'Измерен дебит, л/мин', flowMethod: 'Как измерихте дебита?', bucket: 'Съд и хронометър', flowMeter: 'Дебитомер', otherVerified: 'Друг измервателен уред', methodUnknown: 'Не е измерен / не знам',
      measurementHint: 'Статичното налягане не показва какво налягане ще има при работещи разпръсквачи. За хидравлична проверка са нужни динамично налягане, измерен дебит и данни за тръбната мрежа.',
      next: 'Напред', back: 'Назад', finish: 'Преглед на събраните данни', summaryTitle: 'Карта на входните данни',
      area: 'Площ', shapeLabel: 'Форма', sourceLabel: 'Водоизточник', pressureLabel: 'Налягане', flowLabel: 'Дебит',
      ready: 'Входните данни са събрани', geometryReady: 'Геометрията е потвърдена за предварителна схема', geometryMissing: 'Геометрията трябва да се уточни или потвърди',
      dynamicReady: 'Динамичното налягане и условията за измерване са посочени', dynamicMissing: 'Динамичното налягане и точката на измерване не са потвърдени',
      flowReady: 'Посочени са дебит и метод на измерване', flowMissing: 'Липсва потвърдено измерване на дебита',
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

  const invalidExclusionInput = nonIrrigatedAreas.some((area) => {
    const values = [area.x, area.y, area.width, area.height]
    if (values.every((value) => value.trim() === '')) return false
    const [x, y, areaWidth, areaHeight] = values.map((value) =>
      value.trim() === '' ? Number.NaN : Number(value.replace(',', '.')))
    return !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 ||
      !Number.isFinite(areaWidth) || !Number.isFinite(areaHeight) ||
      areaWidth <= 0 || areaHeight <= 0
  })

  const geometryValidation = useMemo(() => {
    if (!boundaryVertices || invalidExclusionInput) return null
    const parseDimension = (value: string) => value.trim() === '' ? Number.NaN : Number(value.replace(',', '.'))
    const exclusions = nonIrrigatedAreas
      .filter((area) => [area.x, area.y, area.width, area.height].some((value) => value.trim() !== ''))
      .map((area) => {
        const x = parseDimension(area.x)
        const y = parseDimension(area.y)
        const areaWidth = parseDimension(area.width)
        const areaHeight = parseDimension(area.height)
        return {
          id: 'non-irrigated-' + area.id,
          kind: area.kind,
          polygon: { vertices: [
            { x, y },
            { x: x + areaWidth, y },
            { x: x + areaWidth, y: y + areaHeight },
            { x, y: y + areaHeight },
          ] },
        }
      })
    return validateLawnGeometry({
      schemaVersion: 1,
      coordinateSystem: 'local_cartesian_m',
      status: 'confirmed',
      regions: [{ id: 'lawn-1', boundary: { vertices: boundaryVertices }, exclusions }],
    })
  }, [boundaryVertices, nonIrrigatedAreas, invalidExclusionInput])

  const intakeInput = {
    language,
    shape,
    length,
    width,
    cutoutWidth,
    cutoutDepth,
    cutoutCorner,
    geometryValidation,
    notes: '',
  }
  const readiness = useMemo(() => evaluateIrrigationIntake(intakeInput), [
    language, shape, length, width, cutoutWidth, cutoutDepth, cutoutCorner, nonIrrigatedAreas, geometryValidation
  ])
  const snapshot = useMemo(() => buildIrrigationIntakeSnapshot(intakeInput), [
    language, shape, length, width, cutoutWidth, cutoutDepth, cutoutCorner, nonIrrigatedAreas, geometryValidation
  ])

  const layoutResult = useMemo(() => showSummary ? buildPreliminaryLawnLayout(snapshot) : null, [snapshot, showSummary])
  const billOfMaterials = useMemo(() =>
    layoutResult?.status === 'layout_generated' && (layoutResult.layout?.headToHead?.passed === true || layoutResult.layout?.headToHead?.applicable === false)
      ? buildIrrigationBillOfMaterials(layoutResult.layout, layoutResult.zones)
      : null,
  [layoutResult])
  const automationOptions = useMemo(() => {
    if (!billOfMaterials?.valid) return []
    return (['manual', 'tm2', 'rc2', 'bat'] as const).map((type) => {
      const plan = buildIrrigationAutomationPlan(type, billOfMaterials.zoneCount)
      const lines = [...plan.controllers, ...(plan.valve ? [plan.valve] : [])]
      const products = lines.map((line) => ({ ...line, product: catalogProducts[line.sku] }))
      const missing = products.some(({ product }) => !product || typeof product.priceEUR !== 'number' || !Number.isFinite(product.priceEUR) || product.priceEUR < 0)
      const totalPriceEUR = products.reduce((sum, line) => sum + (line.product?.priceEUR ?? 0) * line.quantity, 0)
      return { type, plan, products, missing, totalPriceEUR }
    })
  }, [billOfMaterials, catalogProducts])
  const selectedAutomationOption = automationOptions.find((option) => option.type === automationChoice) ?? null
  const formatEuro = (value: number) => value.toLocaleString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  const localizedProductName = (product: Product) => language === 'ru'
    ? product.translations?.ru?.name || product.name
    : language === 'en' ? product.translations?.en?.name || product.name : product.translations?.bg?.name || product.name

  useEffect(() => {
    if (!billOfMaterials?.valid) return
    let cancelled = false
    setCatalogLoading(true)
    setCatalogError('')
    const baseSkus = billOfMaterials.items.map((item: { sku: string }) => item.sku)
    const skus = [...new Set([...baseSkus, ...IRRIGATION_AUTOMATION_PRODUCT_SKUS])]
    sanityLiveClient.fetch(
      `*[_type == "product" && sku in $skus && isActive != false]{
        _id, name, sku, priceEUR, stockStatus, vatIncluded, weightKg, translations { bg { name }, ru { name }, en { name } },
        "productType": "equipment",
        "slug": { "current": coalesce(slug.current, slug) },
        "brand": brand->name,
        "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
        "imageAlt": mainImage.alt,
        "imageAltEn": mainImage.altEn,
        "imageAltRu": mainImage.altRu
      }`,
      { skus },
    ).then((records: Product[]) => {
      if (cancelled) return
      const bySku: Record<string, Product> = {}
      for (const product of records ?? []) if (product.sku) bySku[product.sku] = product
      setCatalogProducts(bySku)
      const missing = baseSkus.filter((sku: string) => !bySku[sku])
      if (missing.length) setCatalogError('missing_catalogue_products')
    }).catch(() => {
      if (!cancelled) setCatalogError('catalog_lookup_failed')
    }).finally(() => {
      if (!cancelled) setCatalogLoading(false)
    })
    return () => { cancelled = true }
  }, [billOfMaterials])

  const addKitToCart = (type: 'manual' | 'tm2' | 'rc2' | 'bat') => {
    if (!billOfMaterials?.valid || catalogLoading || catalogError) return
    const plan = buildIrrigationAutomationPlan(type, billOfMaterials.zoneCount)
    const finalBom = buildIrrigationAutomationBillOfMaterials(billOfMaterials, plan)
    const resolved = finalBom.items.map((item: { sku: string; quantity: number }) => ({
      sku: item.sku,
      product: catalogProducts[item.sku],
      quantity: item.quantity,
    }))
    if (resolved.some((item: { product?: Product; quantity: number }) => !item.product || typeof item.product.priceEUR !== 'number' || !Number.isFinite(item.product.priceEUR) || item.product.priceEUR < 0)) {
      setCatalogError('missing_catalogue_products')
      return
    }
    resolved.forEach((item: { product: Product; quantity: number }) => onAddToCart(item.product, item.quantity))
    const project = {
      schemaVersion: 1 as const,
      projectType: 'automatic_lawn_irrigation' as const,
      createdAt: new Date().toISOString(),
      language,
      geometry: {
        shape: snapshot.geometry.shape,
        dimensionsM: snapshot.geometry.dimensionsM,
        normalized: snapshot.geometry.normalized,
        areaM2: snapshot.geometry.areaM2,
        perimeterM: snapshot.geometry.perimeterM,
        dimensionsAreApproximate: true,
      },
      operatingScenario: layoutResult?.operatingScenario ?? null,
      layout: {
        model: layoutResult?.layout?.model ?? layoutResult?.operatingScenario?.model ?? null,
        engineVersion: layoutResult?.engine?.version ?? null,
        algorithm: layoutResult?.engine?.algorithm ?? null,
        headToHeadPassed: layoutResult?.layout?.headToHead?.applicable === false ? null : layoutResult?.layout?.headToHead?.passed === true,
        headToHeadApplicable: layoutResult?.layout?.headToHead?.applicable !== false,
        sprinklers: (layoutResult?.layout?.sprinklers ?? []).map((sprinkler: any) => ({
          id: sprinkler.id,
          position: sprinkler.position,
          radiusM: sprinkler.radiusM,
          arcDeg: sprinkler.arcDeg,
          performanceModel: sprinkler.performanceModel,
          pattern: sprinkler.pattern ?? 'circular',
          stripWidthM: sprinkler.stripWidthM ?? null,
          stripLengthM: sprinkler.stripLengthM ?? null,
          stripDirection: sprinkler.stripDirection ?? null,
          stripAxis: sprinkler.stripAxis ?? null,
          source: sprinkler.source === 'interior' ? 'interior' : 'perimeter',
        })),
      },
      zones: (layoutResult?.zones ?? []).map((zone: any) => ({
        id: zone.id,
        zoneNumber: zone.zoneNumber,
        zoneType: zone.zoneType,
        branchDirection: zone.branchDirection,
        branchDirections: zone.branchDirections,
        sprinklerIds: zone.sprinklerIds,
        sprinklerCount: zone.sprinklerCount,
      })),
      pipeNetwork: layoutResult?.pipeNetwork ? {
        mainDiameterMm: layoutResult.pipeNetwork.mainDiameterMm,
        zoneDiameterMm: layoutResult.pipeNetwork.zoneDiameterMm,
        mainRoute: layoutResult.pipeNetwork.mainRoute,
        branches: layoutResult.pipeNetwork.branches.map((branch: any) => ({
          zoneId: branch.zoneId,
          branchDirection: branch.branchDirection,
          sprinklerIds: branch.sprinklerIds,
          points: branch.points,
          lateralConnections: branch.lateralConnections,
        })),
      } : null,
      automation: {
        type,
        controllers: plan.controllers.map((controller) => ({ ...controller, name: catalogProducts[controller.sku]?.name || controller.sku, priceEUR: catalogProducts[controller.sku]?.priceEUR ?? null })),
        valve: plan.valve ? { ...plan.valve, name: catalogProducts[plan.valve.sku]?.name || plan.valve.sku, priceEUR: catalogProducts[plan.valve.sku]?.priceEUR ?? null } : null,
        requiresControlCable: plan.requiresControlCable,
        wifiRequired: plan.wifiRequired,
      },
      billOfMaterials: {
        headCount: billOfMaterials.headCount,
        zoneCount: billOfMaterials.zoneCount,
        flexPipeRequiredM: billOfMaterials.flexPipeRequiredM,
        flexPipeCoils30m: billOfMaterials.flexPipeCoils30m,
        items: finalBom.items.map((item: { sku: string; quantity: number }) => ({ ...item, name: catalogProducts[item.sku]?.name || item.sku, priceEUR: catalogProducts[item.sku]?.priceEUR ?? null })),
      },
      warnings: layoutResult?.warnings ?? [],
    } satisfies IrrigationProjectSnapshot
    onSetIrrigationProject(project)
    onNavigateCart()
  }
  const calculatedArea = geometryValidation?.computedAreaM2 ?? 0
  const calculatedPerimeter = geometryValidation?.computedPerimeterM ?? 0
  const geometryAccepted = readiness.geometryReady
  const shapeLabel = shape === 'rectangle' ? copy.rectangle : copy.lShape
  const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'bg-BG'
  const numberFormat = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 })
  const layoutModelNames: string[] = Array.from(new Set<string>((layoutResult?.layout?.sprinklers ?? []).map((sprinkler: any): string => String(sprinkler.performanceModel ?? ''))))
  const layoutModelLabel: string = layoutModelNames.join(', ') || layoutResult?.operatingScenario?.model || '—'
  const layoutNozzleLegend: Array<{ model: string; color: string; shape: 'circle' | 'triangle' }> = layoutModelNames.map((model) => ({ model, color: sprinklerNozzleColor(model), shape: model.replace(/-360$/, '') === '3504-PC' ? 'triangle' : 'circle' }))
  const layoutLabels = language === 'ru' ? {
    title: 'Предварительная геометрическая раскладка', candidate: 'Форсунки',
    heads: 'Количество дождевателей',
    coverage: 'Выборочное геометрическое покрытие', uncovered: 'Непокрытых контрольных точек', compositeCoverage: 'Проверка круглой зоны', compositeUncovered: 'Непокрытых точек круглой зоны', compositeHeadToHead: 'Head-to-head для круглой зоны',
    positions: 'Координаты дождевателей, м',
    hevanScenarioNote: 'Для HE-VAN использована точка таблицы 2,07 бар, ближайшая к указанному Rain Bird оптимуму 2,1 бар. Это сценарий производителя, а не измеренное давление на сопле.',
    generated: 'Движок построил предварительную раскладку с полным покрытием контрольной сетки.',
    incomplete: 'Движок построил вариант, но контрольная сетка содержит непокрытые точки. Нужна инженерная проверка.',
    unsupported: 'Геометрия выходит за текущий проверенный диапазон автоматической раскладки R-VAN. Не подставляем HE-VAN или другую неподтверждённую модель. Для этого участка требуется отдельная инженерная проверка.',
    narrow: 'Для узкой полосы используются специальные полосовые форсунки Rain Bird LCS, RCS и SST. Круглые форсунки не подставляются.',
    notReady: 'Для предварительной раскладки нужны корректные размеры участка.', engineError: 'Текущий инженерный движок не поддерживает эту геометрию или конфигурацию.',
    headToHead: 'Проверка расстояний head-to-head', passed: 'Пройдена', failed: 'Есть замечания', notApplicable: 'Не применяется к полосовой форсунке',
  } : language === 'en' ? {
    title: 'Preliminary geometric sprinkler layout', candidate: 'Nozzles',
    heads: 'Sprinkler count',
    coverage: 'Sampled geometric coverage', uncovered: 'Uncovered sample points', compositeCoverage: 'Circular-zone sample check', compositeUncovered: 'Uncovered points in circular zone', compositeHeadToHead: 'Circular-zone head-to-head check',
    positions: 'Sprinkler coordinates, m',
    hevanScenarioNote: 'The HE-VAN table point 2.07 bar is used as the closest exact point to Rain Bird’s 2.1 bar optimum. This is a manufacturer scenario, not measured nozzle pressure.',
    generated: 'The engine generated a preliminary layout with all sampled points covered.',
    incomplete: 'The engine generated a candidate, but some sampled points remain uncovered. Engineering review is required.',
    unsupported: 'The geometry is outside the current verified R-VAN layout range. No HE-VAN or other unverified model is substituted. This site requires a separate engineering review.',
    narrow: 'Narrow strips use dedicated Rain Bird LCS, RCS and SST strip nozzles. Circular nozzles are not substituted.',
    notReady: 'Valid lawn dimensions are required before generating a preliminary layout.', engineError: 'The current engineering engine does not support this geometry or configuration.',
    headToHead: 'Head-to-head spacing check', passed: 'Passed', failed: 'Warnings', notApplicable: 'Not applicable to strip nozzles',
  } : {
    title: 'Предварителна геометрична схема на разпръсквачите', candidate: 'Дюзи',
    heads: 'Брой разпръсквачи',
    coverage: 'Геометрично покритие по контролна мрежа', uncovered: 'Непокрити контролни точки', compositeCoverage: 'Проверка на кръговата зона', compositeUncovered: 'Непокрити точки в кръговата зона', compositeHeadToHead: 'Head-to-head проверка на кръговата зона',
    positions: 'Координати на разпръсквачите, м',
    hevanScenarioNote: 'За HE-VAN е използвана точка 2,07 bar — най-близката точна таблична стойност до оптимума 2,1 bar на Rain Bird. Това е сценарий, а не измерено налягане при дюзата.',
    generated: 'Двигателят създаде предварителна схема с покритие на всички контролни точки.',
    incomplete: 'Двигателят създаде вариант, но има непокрити контролни точки. Необходима е инженерна проверка.',
    unsupported: 'Геометрията е извън текущия проверен диапазон за автоматично разполагане на R-VAN. Не се използва HE-VAN или друга непроверена дюза като заместител. Необходима е отделна инженерна проверка.',
    notReady: 'За предварителната схема са необходими валидни размери на терена.', engineError: 'Текущият инженерен двигател не поддържа тази геометрия или конфигурация.',
    headToHead: 'Проверка на разстоянието head-to-head', passed: 'Успешна', failed: 'Има забележки', notApplicable: 'Не се прилага за лентови дюзи',
  }
  const svgPoints = boundaryVertices?.map((point) => String(Math.round(point.x * 1000) / 1000) + ',' + String(Math.round(point.y * 1000) / 1000)).join(' ')
  const exclusionPolygons = geometryValidation?.normalizedGeometry?.regions?.[0]?.exclusions ?? []
  const dimensionAnnotations = geometryValidation?.valid
    ? buildLawnDimensionAnnotations(boundaryVertices ?? [], exclusionPolygons)
    : []
  const diagramHeightM = Number(width.replace(',', '.'))
  const diagramViewBox = '-1.5 -1.5 ' + (Number(length.replace(',', '.')) + 3) + ' ' + (diagramHeightM + 3)
  const svgTransform = 'translate(0 ' + Number(width.replace(',', '.')) + ') scale(1 -1)'
  const progress = 100

  function updateGeometry(setter: (value: string) => void, value: string) {
    setter(value)
  }

  function updateNonIrrigatedArea<K extends keyof Omit<NonIrrigatedAreaInput, 'id'>>(
    id: number,
    field: K,
    value: NonIrrigatedAreaInput[K],
  ) {
    setNonIrrigatedAreas((current) => current.map((area) =>
      area.id === id ? { ...area, [field]: value } : area))
  }

  function addNonIrrigatedArea() {
    setNonIrrigatedAreas((current) => [
      ...current,
      { id: current.reduce((max, area) => Math.max(max, area.id), 0) + 1, kind: 'pool', x: '', y: '', width: '', height: '' },
    ])
  }

  function answerSummary() {
    return shapeLabel + ' · ' + length + ' × ' + width + ' м · ' + numberFormat(calculatedArea) + ' ' + copy.unit
  }

  useEffect(() => {
    applyPageSeo({ fallbackTitle: copy.title + ' | Florial', fallbackDescription: copy.intro, noIndex: true, language })
  }, [copy, language])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    const target = showSummary ? summaryRef.current : formRef.current
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showSummary])

  const selectClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-left text-sm text-slate-800 transition hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200'
  const activeClass = 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700'
  const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const steps = [copy.prompts[0]]

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
        <span>{copy.progress}</span><span>{copy.step} 1 {copy.of}</span>
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
            {showSummary && (
              <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-800">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{copy.you}</p>
                {answerSummary()}
              </div>
            )}
            {!showSummary && <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">{steps[0]}</div>}
          </div>

          {!showSummary ? (
            <div ref={formRef} className="mt-5 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
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
                  <div className="mt-5 rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-800">{copy.nonIrrigatedTitle}</h3>
                      <button type="button" onClick={addNonIrrigatedArea} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">{copy.addExcluded}</button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{copy.nonIrrigatedHint}</p>
                    {nonIrrigatedAreas.map((area, index) => <div key={area.id} className="mt-3 rounded-lg bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">#{index + 1}</span>
                        <button type="button" onClick={() => setNonIrrigatedAreas((current) => current.filter((entry) => entry.id !== area.id))} className="text-xs font-semibold text-rose-700 hover:underline">{copy.removeExcluded}</button>
                      </div>
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-semibold text-slate-700">{copy.excludedKind}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(['pool', 'building', 'patio'] as const).map((kind) => (
                            <button key={kind} type="button" aria-pressed={area.kind === kind}
                              onClick={() => updateNonIrrigatedArea(area.id, 'kind', kind)}
                              className={'rounded-lg border px-2 py-2 text-xs font-semibold transition ' + (area.kind === kind ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-600')}>
                              {copy[kind]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <label className="block text-xs font-semibold text-slate-700">{copy.excludedX}<input type="text" inputMode="decimal" value={area.x} onChange={(event) => updateNonIrrigatedArea(area.id, 'x', event.target.value)} className={inputClass} /></label>
                        <label className="block text-xs font-semibold text-slate-700">{copy.excludedY}<input type="text" inputMode="decimal" value={area.y} onChange={(event) => updateNonIrrigatedArea(area.id, 'y', event.target.value)} className={inputClass} /></label>
                        <label className="block text-xs font-semibold text-slate-700">{copy.excludedWidth}<input type="text" inputMode="decimal" value={area.width} onChange={(event) => updateNonIrrigatedArea(area.id, 'width', event.target.value)} className={inputClass} /></label>
                        <label className="block text-xs font-semibold text-slate-700">{copy.excludedHeight}<input type="text" inputMode="decimal" value={area.height} onChange={(event) => updateNonIrrigatedArea(area.id, 'height', event.target.value)} className={inputClass} /></label>
                      </div>
                    </div>)}
                  </div>
                  {boundaryVertices && geometryValidation?.valid && <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <h3 className="mb-3 text-sm font-bold text-emerald-950">{copy.geometryPreview}</h3>
                    <div className="rounded-xl border border-emerald-100 bg-white p-3">
                      <svg viewBox={diagramViewBox} role="img" aria-label={copy.geometryPreview} className="max-h-56 w-full" preserveAspectRatio="xMidYMid meet">
                        <g transform={svgTransform}>
                          <polygon points={svgPoints} fill="#bbf7d0" stroke="#047857" strokeWidth="0.12" strokeLinejoin="round" />
                          {exclusionPolygons.map((exclusion: { id: string; kind: string; polygon: { vertices: Array<{ x: number; y: number }> } }) => {
                            const vertices = exclusion.polygon.vertices
                            const xs = vertices.map((point) => point.x)
                            const ys = vertices.map((point) => point.y)
                            const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
                            const colors = exclusionColors(exclusion.kind)
                            return <g key={exclusion.id}>
                              <polygon points={vertices.map((point) => point.x + ',' + point.y).join(' ')} fill={colors.fill} stroke={colors.stroke} strokeWidth="0.12" />
                              {exclusion.kind === 'building' && <path d={'M ' + minX + ' ' + minY + ' L ' + maxX + ' ' + maxY + ' M ' + minX + ' ' + maxY + ' L ' + maxX + ' ' + minY} fill="none" stroke={colors.detail} strokeWidth="0.08" />}
                              {exclusion.kind === 'pool' && <path d={'M ' + (minX + (maxX - minX) * 0.15) + ' ' + (minY + (maxY - minY) * 0.35) + ' Q ' + (minX + (maxX - minX) * 0.5) + ' ' + (minY + (maxY - minY) * 0.55) + ' ' + (maxX - (maxX - minX) * 0.15) + ' ' + (minY + (maxY - minY) * 0.35) + ' M ' + (minX + (maxX - minX) * 0.15) + ' ' + (minY + (maxY - minY) * 0.7) + ' Q ' + (minX + (maxX - minX) * 0.5) + ' ' + (minY + (maxY - minY) * 0.9) + ' ' + (maxX - (maxX - minX) * 0.15) + ' ' + (minY + (maxY - minY) * 0.7)} fill="none" stroke={colors.detail} strokeWidth="0.08" />}
                            </g>
                          })}
                        </g>
                        <DimensionAnnotations annotations={dimensionAnnotations} heightM={diagramHeightM} format={numberFormat} />
                      </svg>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">{copy.calculatedArea}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{numberFormat(calculatedArea)} {copy.unit}</p></div>
                      <div className="rounded-xl bg-white p-3"><p className="text-xs font-semibold text-slate-500">{copy.perimeter}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{numberFormat(calculatedPerimeter)} m</p></div>
                    </div>
                    <p role="status" className="mt-3 text-sm leading-6 text-emerald-900">{copy.geometryAccepted}</p>
                  </div>}
                  {!boundaryVertices && (length !== '' || width !== '' || (shape === 'l-shape' && (cutoutWidth !== '' || cutoutDepth !== ''))) && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">{copy.geometryInvalid}</p>}
                  {invalidExclusionInput && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900">{copy.invalidExclusion}</p>}
                  {boundaryVertices && geometryValidation && !geometryValidation.valid && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900">{copy.geometryInvalid}</p>}
                </div>


              <div className="mt-6 flex justify-end">
                <button type="button" disabled={!geometryAccepted} onClick={() => setShowSummary(true)} className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{copy.finish}</button>
              </div>
            </div>
          ) : (
            <div ref={summaryRef} className="mt-5 scroll-mt-24 space-y-5">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">{copy.ready}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">{copy.summaryTitle}</h2>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{copy.area}</dt><dd className="mt-1 font-bold text-slate-900">{geometryAccepted ? numberFormat(calculatedArea) + ' ' + copy.unit : copy.noValue}</dd></div>
                  <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{copy.shapeLabel}</dt><dd className="mt-1 font-bold text-slate-900">{shapeLabel}</dd></div>
                  <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{copy.perimeter}</dt><dd className="mt-1 font-bold text-slate-900">{geometryAccepted ? numberFormat(calculatedPerimeter) + ' m' : copy.noValue}</dd></div>
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900">{language === 'ru' ? 'Стандартные условия проекта Florial' : language === 'en' ? 'Florial project standard assumptions' : 'Стандартни условия на проекта Florial'}</h3>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                  <li>{language === 'ru' ? 'Точка подключения — верхний правый угол участка.' : language === 'en' ? 'Water connection point — top-right corner of the lawn.' : 'Точка на свързване — горният десен ъгъл на тревната площ.'}</li>
                  <li>{language === 'ru' ? 'Труба — Ø25 мм.' : language === 'en' ? 'Pipe — Ø25 mm.' : 'Тръба — Ø25 mm.'}</li>
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
                      <p className="mt-3 text-sm font-semibold text-slate-900">{layoutLabels.candidate}: {layoutResult.operatingScenario?.manufacturer} {layoutResult.operatingScenario?.family} · {layoutModelLabel}{layoutResult.operatingScenario?.pressureBar != null ? ' · ' + numberFormat(layoutResult.operatingScenario.pressureBar) + ' bar' : language === 'ru' ? ' · давление не рассчитывается' : language === 'en' ? ' · pressure not calculated' : ' · налягането не се изчислява'}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{layoutResult.status === 'layout_generated' ? (layoutResult.layout?.coverageScope === 'decomposed_rectangular_zones' ? (language === 'ru' ? 'Г-образный участок разделён на прямоугольные расчётные зоны. Широкая зона проверена по контрольным точкам, узкая полоса размещена по правилу LCS/RCS/SST. Это предварительная геометрическая проверка, а не непрерывное математическое доказательство покрытия.' : language === 'en' ? 'The L-shaped lawn is split into rectangular calculation zones. The wider zone is checked at sampled points and the narrow strip uses the LCS/RCS/SST rule. This is a preliminary geometric check, not a continuous mathematical proof of coverage.' : 'Г-образният терен е разделен на правоъгълни изчислителни зони. Широката зона е проверена по контролни точки, а тясната лента е разположена по правилото LCS/RCS/SST. Това е предварителна геометрична проверка, а не непрекъснато математическо доказателство за покритие.') : layoutResult.layout?.coverageScope === 'owner_defined_strip_pattern' ? (language === 'ru' ? 'Полосовые форсунки LCS, RCS и SST размещены по согласованному правилу Florial. Выборочное круговое покрытие для этой схемы не рассчитывается.' : language === 'en' ? 'LCS, RCS and SST strip nozzles are placed using the approved Florial rule. Circular sampled coverage is not calculated for this pattern.' : 'Лентовите дюзи LCS, RCS и SST са разположени по одобреното правило на Florial. Кръгово семплирано покритие не се изчислява за този модел.') : layoutLabels.generated) : layoutLabels.incomplete}</p>
                      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{layoutLabels.heads}</dt><dd className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{layoutResult.layout?.sprinklers?.length ?? 0}</dd></div>
                        
                        <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{layoutResult.layout?.coverageScope === 'decomposed_rectangular_zones' ? layoutLabels.compositeCoverage : layoutResult.layout?.coverageScope === 'owner_defined_strip_pattern' ? (language === 'ru' ? 'Полосовая схема LCS/RCS/SST' : language === 'en' ? 'LCS/RCS/SST strip layout' : 'Разположение с лентови дюзи LCS/RCS/SST') : layoutLabels.coverage}</dt><dd className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{layoutResult.layout?.coverageScope === 'owner_defined_strip_pattern' ? '—' : numberFormat(layoutResult.layout?.coverage?.coveragePercent ?? 0) + '%'}</dd></div>
                        <div className="rounded-xl bg-white p-3"><dt className="text-xs font-semibold text-slate-500">{layoutResult.layout?.coverageScope === 'decomposed_rectangular_zones' ? layoutLabels.compositeUncovered : layoutLabels.uncovered}</dt><dd className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{layoutResult.layout?.coverageScope === 'owner_defined_strip_pattern' ? '—' : layoutResult.layout?.coverage?.uncoveredPoints ?? 0}</dd></div>
                      </dl>
                      {boundaryVertices && (layoutResult.layout?.sprinklers?.length ?? 0) > 0 && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                          <svg viewBox={diagramViewBox} role="img" aria-label={layoutLabels.title} className="max-h-64 w-full" preserveAspectRatio="xMidYMid meet">
                            <defs><marker id="strip-direction-arrow" markerWidth="0.32" markerHeight="0.32" refX="0.26" refY="0.16" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L0.32 0.16 L0 0.32 z" fill="#475569" /></marker></defs>
                            <g transform={svgTransform}>
                              <polygon points={svgPoints} fill="#dcfce7" stroke="#047857" strokeWidth="0.12" strokeLinejoin="round" />
                              {exclusionPolygons.map((exclusion: { id: string; kind: string; polygon: { vertices: Array<{ x: number; y: number }> } }) => {
                                const vertices = exclusion.polygon.vertices
                                const xs = vertices.map((point) => point.x)
                                const ys = vertices.map((point) => point.y)
                                const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
                                const colors = exclusionColors(exclusion.kind)
                                return <g key={exclusion.id}>
                                  <polygon points={vertices.map((point) => point.x + ',' + point.y).join(' ')} fill={colors.fill} stroke={colors.stroke} strokeWidth="0.12" />
                                  {exclusion.kind === 'building' && <path d={'M ' + minX + ' ' + minY + ' L ' + maxX + ' ' + maxY + ' M ' + minX + ' ' + maxY + ' L ' + maxX + ' ' + minY} fill="none" stroke={colors.detail} strokeWidth="0.08" />}
                                  {exclusion.kind === 'pool' && <path d={'M ' + (minX + (maxX - minX) * 0.15) + ' ' + (minY + (maxY - minY) * 0.35) + ' Q ' + (minX + (maxX - minX) * 0.5) + ' ' + (minY + (maxY - minY) * 0.55) + ' ' + (maxX - (maxX - minX) * 0.15) + ' ' + (minY + (maxY - minY) * 0.35) + ' M ' + (minX + (maxX - minX) * 0.15) + ' ' + (minY + (maxY - minY) * 0.7) + ' Q ' + (minX + (maxX - minX) * 0.5) + ' ' + (minY + (maxY - minY) * 0.9) + ' ' + (maxX - (maxX - minX) * 0.15) + ' ' + (minY + (maxY - minY) * 0.7)} fill="none" stroke={colors.detail} strokeWidth="0.08" />}
                                </g>
                              })}
                              {layoutResult.pipeNetwork?.mainRoute && <polyline points={layoutResult.pipeNetwork.mainRoute.map((point: { x: number; y: number }) => point.x + ',' + point.y).join(' ')} fill="none" stroke="#ea580c" strokeWidth="0.12" strokeLinejoin="round" />}
                              {layoutResult.pipeNetwork?.branches?.map((branch) => (
                                <g key={branch.id}>
                                  <polyline points={branch.points.map((point) => point.x + ',' + point.y).join(' ')} fill="none" stroke={branch.branchDirection === 'forward' ? '#f59e0b' : '#d97706'} strokeWidth="0.1" strokeLinejoin="round" />
                                  {branch.lateralConnections.map((lateral) => (
                                    <polyline key={lateral.sprinklerId} points={lateral.points.map((point) => point.x + ',' + point.y).join(' ')} fill="none" stroke="#b45309" strokeWidth="0.07" strokeDasharray="0.18 0.12" />
                                  ))}
                                </g>
                              ))}
                              {layoutResult.layout.sprinklers.map((sprinkler: { id: string; position: { x: number; y: number }; radiusM: number | null; arcDeg: number | null; directionDeg: number | null; performanceModel?: string; pattern?: string; stripDirection?: string; stripAxis?: string; stripLengthM?: number }) => {
                                const zoneNumber = layoutResult.zones?.find((zone: { zoneNumber: number; sprinklerIds: ReadonlyArray<string> }) => zone.sprinklerIds.includes(sprinkler.id))?.zoneNumber
                                const nozzleColor = sprinklerNozzleColor(sprinkler.performanceModel)
                                return (
                                <g key={sprinkler.id}>
                                  {sprinkler.pattern === 'strip' && sprinkler.stripDirection && sprinkler.stripLengthM && <g stroke="#475569" strokeWidth="0.05" markerEnd="url(#strip-direction-arrow)">
                                    {sprinkler.stripDirection === 'left' && <line x1={sprinkler.position.x} y1={sprinkler.position.y} x2={sprinkler.position.x - sprinkler.stripLengthM} y2={sprinkler.position.y} />}
                                    {sprinkler.stripDirection === 'right' && <line x1={sprinkler.position.x} y1={sprinkler.position.y} x2={sprinkler.position.x + sprinkler.stripLengthM} y2={sprinkler.position.y} />}
                                    {sprinkler.stripDirection === 'up' && <line x1={sprinkler.position.x} y1={sprinkler.position.y} x2={sprinkler.position.x} y2={sprinkler.position.y + sprinkler.stripLengthM} />}
                                    {sprinkler.stripDirection === 'down' && <line x1={sprinkler.position.x} y1={sprinkler.position.y} x2={sprinkler.position.x} y2={sprinkler.position.y - sprinkler.stripLengthM} />}
                                    {sprinkler.stripDirection === 'both' && (sprinkler.stripAxis === 'vertical' ? <><line x1={sprinkler.position.x} y1={sprinkler.position.y} x2={sprinkler.position.x} y2={sprinkler.position.y - sprinkler.stripLengthM} /><line x1={sprinkler.position.x} y1={sprinkler.position.y} x2={sprinkler.position.x} y2={sprinkler.position.y + sprinkler.stripLengthM} /></> : <><line x1={sprinkler.position.x} y1={sprinkler.position.y} x2={sprinkler.position.x - sprinkler.stripLengthM} y2={sprinkler.position.y} /><line x1={sprinkler.position.x} y1={sprinkler.position.y} x2={sprinkler.position.x + sprinkler.stripLengthM} y2={sprinkler.position.y} /></>)}
                                  </g>}
                                  {sprinkler.radiusM !== null && sprinkler.arcDeg === 360 && <circle cx={sprinkler.position.x} cy={sprinkler.position.y} r={sprinkler.radiusM} fill="none" stroke={nozzleColor} strokeWidth="0.055" strokeDasharray="0.22 0.14" opacity="0.78" />}
                                   {sprinkler.radiusM !== null && sprinkler.arcDeg !== null && sprinkler.arcDeg !== 360 && <path d={sprinklerSectorPath(sprinkler.position, sprinkler.radiusM, sprinkler.arcDeg, sprinkler.directionDeg)} fill={nozzleColor} fillOpacity="0.08" stroke={nozzleColor} strokeWidth="0.055" strokeDasharray="0.22 0.14" opacity="0.9" />}
                                  {sprinkler.performanceModel?.replace(/-360$/, '') === '3504-PC'
                                    ? <polygon points={(sprinkler.position.x) + ',' + (sprinkler.position.y + 0.24) + ' ' + (sprinkler.position.x - 0.23) + ',' + (sprinkler.position.y - 0.19) + ' ' + (sprinkler.position.x + 0.23) + ',' + (sprinkler.position.y - 0.19)} fill={nozzleColor} stroke="#ffffff" strokeWidth="0.08" strokeLinejoin="round" />
                                    : <circle cx={sprinkler.position.x} cy={sprinkler.position.y} r="0.18" fill={nozzleColor} stroke="#ffffff" strokeWidth="0.08" />}
                                  {zoneNumber !== undefined && <g transform={'translate(' + (sprinkler.position.x + 0.22) + ' ' + sprinkler.position.y + ') scale(1 -1)'}><text x="0" y="-0.22" fontSize="0.72" fontWeight="700" fill="#0f172a" stroke="#ffffff" strokeWidth="0.12" paintOrder="stroke">{zoneNumber}</text></g>}
                                </g>
                                )
                              })}
                            </g>
                            <DimensionAnnotations annotations={dimensionAnnotations} heightM={diagramHeightM} format={numberFormat} />
                          </svg>
                          {layoutNozzleLegend.length > 0 && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-700">
                            {layoutNozzleLegend.map((item) => <span key={item.model} className="inline-flex items-center gap-2">{item.shape === 'triangle' ? <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true"><polygon points="8,1 15,14 1,14" fill={item.color} /></svg> : <span className="h-3 w-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: item.color }} />}{item.model}</span>)}
                          </div>}
                          {layoutResult.layout?.sprinklers?.some((head: { performanceModel?: string }) => head.performanceModel === '3504-PC') && <p className="mt-2 text-xs leading-5 text-slate-600">{language === 'ru'
                            ? 'Показанные сектора и радиусы 3504-PC — геометрические планировочные значения Florial, а не подтверждённые рабочие характеристики производителя. Фактическая дальность и расход зависят от выбранной форсунки и давления.'
                            : language === 'en'
                              ? 'The 3504-PC sectors and radii shown are Florial geometric planning values, not manufacturer-validated performance. Actual throw and flow depend on the selected nozzle and pressure.'
                              : 'Показаните сектори и радиуси на 3504-PC са геометрични проектни стойности на Florial, а не потвърдени работни характеристики на производителя. Реалният радиус и дебит зависят от избраната дюза и налягането.'}</p>}
                        </div>
                      )}
                      <div className="mt-3 rounded-xl bg-white p-3 text-sm">
                        <p className="font-semibold text-slate-800">{layoutResult.layout?.coverageScope === 'decomposed_rectangular_zones' ? layoutLabels.compositeHeadToHead : layoutLabels.headToHead}: <span className={layoutResult.layout?.headToHead?.applicable === false ? 'text-slate-600' : layoutResult.layout?.headToHead?.passed ? 'text-emerald-700' : 'text-amber-700'}>{layoutResult.layout?.headToHead?.applicable === false ? layoutLabels.notApplicable : layoutResult.layout?.headToHead?.passed ? layoutLabels.passed : layoutLabels.failed}</span></p>
{layoutResult.layout?.coverageScope === 'owner_defined_strip_pattern' ? <p className="mt-2 text-xs leading-5 text-slate-600">{language === 'ru' ? 'Полосовой рисунок и размещение заданы правилами Florial; круговая проверка покрытия и head-to-head не выполняется.' : language === 'en' ? 'The strip pattern and placement follow Florial rules; circular coverage and head-to-head checks are not run.' : 'Лентовият модел и разположението следват правилата на Florial; кръгово покритие и head-to-head не се проверяват.'}</p> : layoutResult.operatingScenario?.family === 'HE-VAN' ? <p className="mt-2 text-xs leading-5 text-slate-600">{layoutLabels.hevanScenarioNote}</p> : null}
                      </div>
                      {layoutResult.zones?.length > 0 && <div className="mt-3 rounded-xl bg-white p-3 text-sm">
                        <p className="font-semibold text-slate-800">{language === 'ru' ? 'Зоны полива' : language === 'en' ? 'Irrigation zones' : 'Зони за напояване'}</p>
                        <ul className="mt-2 space-y-1 text-slate-600">
                          {layoutResult.zones.map((zone: { id: string; zoneNumber: number; sprinklerCount: number; sprinklerIds: ReadonlyArray<string> }) => {
                            const zoneHeads = (layoutResult.layout?.sprinklers ?? []).filter((sprinkler: any) => zone.sprinklerIds.includes(sprinkler.id))
                            const modelCounts = new Map<string, number>()
                            for (const sprinkler of zoneHeads) {
                              const model = String(sprinkler.performanceModel ?? 'R-VAN')
                              modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1)
                            }
                            const nozzleSummary = [...modelCounts.entries()].map(([model, count]) => model + ' × ' + count).join(', ')
                            return <li key={zone.id}>{language === 'ru' ? 'Зона' : language === 'en' ? 'Zone' : 'Зона'} {zone.zoneNumber} ({nozzleSummary})</li>
                          })}
                        </ul>
                      </div>}
                      <details className="mt-3 rounded-xl bg-white p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-800">{layoutLabels.positions}</summary>
                        <ol className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                          {layoutResult.layout?.sprinklers?.map((sprinkler: { id: string; position: { x: number; y: number }; arcDeg: number | null; radiusM?: number | null; performanceModel?: string; pattern?: string; stripWidthM?: number; stripLengthM?: number; stripDirection?: string; stripAxis?: string }) => (
                            <li key={sprinkler.id}>{sprinkler.id}: X {numberFormat(sprinkler.position.x)}, Y {numberFormat(sprinkler.position.y)} · {sprinkler.pattern === 'strip' ? sprinkler.performanceModel + ' · ' + sprinkler.stripWidthM + ' m · ' + sprinkler.stripLengthM + ' m · ' + ((sprinkler.stripDirection ?? '—') + ' / ' + (sprinkler.stripAxis ?? '—')) : (sprinkler.performanceModel ?? 'R-VAN') + ' · ' + sprinkler.arcDeg + '°' + (sprinkler.pattern === 'rotor' ? ' · R ' + numberFormat(sprinkler.radiusM ?? 0) + ' m' : '')}</li>
                          ))}
                        </ol>
                      </details>
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-amber-900">{layoutResult.status === 'requires_rotor_engine' ? layoutLabels.unsupported : layoutResult.status.startsWith('strip_') ? layoutLabels.narrow : layoutResult.status === 'needs_valid_geometry' ? layoutLabels.notReady : layoutLabels.engineError}</p>
                  )}
                  {layoutResult.stripNozzleOptions?.length > 0 && <ul className="mt-3 space-y-2 rounded-xl bg-white p-3 text-sm text-slate-700">
                    {layoutResult.stripNozzleOptions.map((option: { model: string; dimensionsM: number[]; pressureBar: number }) => (
                      <li key={option.model}><strong>{option.model}</strong> · {option.dimensionsM[0]} × {option.dimensionsM[1]} m · {numberFormat(option.pressureBar)} bar</li>
                    ))}
                  </ul>}
                </section>
              )}
              {billOfMaterials?.valid && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="font-bold text-emerald-950">
                    {language === 'ru' ? 'Комплект оборудования для этой схемы' : language === 'en' ? 'Equipment kit for this layout' : 'Комплект оборудване за тази схема'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-900">
                    {billOfMaterials.headCount} {language === 'ru' ? 'дождевателей' : language === 'en' ? 'sprinklers' : 'разпръсквача'} · {billOfMaterials.zoneCount} {language === 'ru' ? 'зоны' : language === 'en' ? 'zones' : 'зони'}
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    {language === 'ru' ? 'В комплект входят подобранные дождеватели и форсунки, гибкие соединения и фитинги. Тип клапанов и автоматики выберете на следующем шаге.' : language === 'en' ? 'Includes selected sprinklers and nozzles, flexible connections and fittings. Choose the valve and controller arrangement in the next step.' : 'Включва избрани разпръсквачи и дюзи, гъвкави връзки и фитинги. Изберете вида клапани и управление на следващата стъпка.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAutomationChoice(true)}
                    disabled={catalogLoading || Boolean(catalogError)}
                    className="mt-3 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {catalogLoading
                      ? (language === 'ru' ? 'Проверяем товары…' : language === 'en' ? 'Checking products…' : 'Проверка на продуктите…')
                      : (language === 'ru' ? 'Выбрать автоматику и продолжить' : language === 'en' ? 'Choose automation and continue' : 'Изберете управление и продължете')}
                  </button>
                  {catalogError && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{language === 'ru' ? 'Не удалось загрузить полный комплект из каталога. Пожалуйста, свяжитесь с Florial.' : language === 'en' ? 'The complete kit could not be loaded from the catalogue. Please contact Florial.' : 'Пълният комплект не може да бъде зареден от каталога. Моля, свържете се с Florial.'}</p>}
                </div>
              )}
              {showAutomationChoice && billOfMaterials?.valid && (
                <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4" aria-labelledby="irrigation-automation-title">
                  <h3 id="irrigation-automation-title" className="text-lg font-bold text-slate-900">{language === 'ru' ? 'Как вы хотите управлять поливом?' : language === 'en' ? 'How would you like to control irrigation?' : 'Как желаете да управлявате напояването?'}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{language === 'ru' ? 'Подобрали автоматику по количеству зон. Перед добавлением покажем реальные товары из каталога и их стоимость.' : language === 'en' ? 'The controller configuration is based on the number of zones. Review the actual catalogue products and prices before adding the kit.' : 'Автоматиката е подбрана според броя зони. Преди добавяне ще видите реалните продукти от каталога и техните цени.'}</p>
                  <p className="mt-1 text-xs text-slate-500">{language === 'ru' ? 'Цены в EUR указаны с НДС. Наличие товаров — по запросу.' : language === 'en' ? 'Prices are in EUR including VAT. Availability is on request.' : 'Цените са в EUR с включен ДДС. Наличността се потвърждава при запитване.'}</p>
                  <div className="mt-4 grid gap-3">
                    {automationOptions.map((option) => {
                      const labels = {
                        manual: language === 'ru' ? 'Ручное управление кранами' : language === 'en' ? 'Manual valve operation' : 'Ръчно управление с кранове',
                        tm2: 'Rain Bird ESP-TM2', rc2: 'Rain Bird ESP-RC2 Wi-Fi', bat: 'Rain Bird ESP-BAT-BT',
                      }
                      const descriptions = {
                        manual: language === 'ru' ? 'Полив включается и выключается вручную. Клапаны в корзину не добавляются.' : language === 'en' ? 'Open and close irrigation manually. No solenoid valves are added to the cart.' : 'Напояването се включва и спира ръчно. В количката не се добавят електромагнитни клапани.',
                        tm2: language === 'ru' ? 'Проводной контроллер для внутреннего монтажа. Требуется управляющий кабель от контроллера до электромагнитных клапанов.' : language === 'en' ? 'Wired controller for indoor installation. A control cable is required from the controller to the solenoid valves.' : 'Кабелен контролер за вътрешен монтаж. Необходим е управляващ кабел от контролера до електромагнитните клапани.',
                        rc2: language === 'ru' ? 'Wi-Fi контроллер для внутреннего монтажа. Требуются стабильный Wi-Fi и управляющий кабель от контроллера до электромагнитных клапанов.' : language === 'en' ? 'Wi-Fi controller for indoor installation. Stable Wi-Fi and a control cable to the solenoid valves are required.' : 'Wi-Fi контролер за вътрешен монтаж. Необходими са стабилен Wi-Fi сигнал и управляващ кабел до електромагнитните клапани.',
                        bat: language === 'ru' ? 'Автономный Bluetooth-контроллер на батарейках. Для каждой зоны подбирается клапан с совместимым фиксирующим соленоидом 9 V DC.' : language === 'en' ? 'Battery-powered Bluetooth controller. Each zone is paired with a valve fitted with a compatible 9 V DC latching solenoid.' : 'Автономен Bluetooth контролер на батерии. За всяка зона се избира клапан със съвместим фиксиращ соленоид 9 V DC.',
                      }
                      return (
                        <div key={option.type} className={'rounded-xl border bg-white p-3 ' + (automationChoice === option.type ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200')}>
                          <button type="button" aria-pressed={automationChoice === option.type} onClick={() => setAutomationChoice(option.type)} className="flex w-full items-start justify-between gap-3 text-left">
                            <span className="min-w-0"><span className="block font-bold text-slate-900">{labels[option.type]}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{descriptions[option.type]}</span></span>
                            <span className={'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ' + (automationChoice === option.type ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 text-transparent')}>✓</span>
                          </button>
                          {option.products.length > 0 && <div className="mt-3 space-y-2">
                            {option.products.map((line, index) => (
                              <div key={line.sku + '-' + index} className="flex items-center gap-3 rounded-lg bg-slate-50 p-2">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                                  {line.product?.imageUrl ? <img src={line.product.imageUrl} alt={localizedProductName(line.product)} className="h-full w-full object-contain p-1" /> : <span className="text-[10px] text-slate-400">{language === 'ru' ? 'Нет фото' : language === 'en' ? 'No image' : 'Няма снимка'}</span>}
                                </div>
                                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{line.product ? localizedProductName(line.product) : line.sku}</p><p className="text-xs text-slate-500">{line.quantity} × {line.product?.priceEUR != null ? formatEuro(line.product.priceEUR) : '—'}{line.capacity ? ' · ' + (language === 'ru' ? 'ёмкость ' : language === 'en' ? 'capacity ' : 'капацитет ') + line.capacity + (language === 'ru' ? ' зон' : language === 'en' ? ' zones' : ' зони') + ' · ' + (language === 'ru' ? 'зоны ' : language === 'en' ? 'zones ' : 'зони ') + line.zoneNumbers.join(', ') : ''}</p><p className="text-sm font-bold text-slate-900">{line.product?.priceEUR != null ? formatEuro(line.product.priceEUR * line.quantity) : '—'}</p></div>
                              </div>
                            ))}
                          </div>}
                          {option.type === 'tm2' && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{language === 'ru' ? 'Важно: требуется управляющий кабель от контроллера до электромагнитных клапанов.' : language === 'en' ? 'Important: a control cable is required from the controller to the solenoid valves.' : 'Важно: необходим е управляващ кабел от контролера до електромагнитните клапани.'}</p>}
                          {option.type === 'rc2' && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{language === 'ru' ? 'Важно: в месте установки нужен стабильный Wi-Fi, а также управляющий кабель от контроллера до электромагнитных клапанов.' : language === 'en' ? 'Important: stable Wi-Fi is required at the installation point, together with a control cable from the controller to the solenoid valves.' : 'Важно: на мястото на монтаж е необходим стабилен Wi-Fi сигнал и управляващ кабел до електромагнитните клапани.'}</p>}
                          {option.type === 'bat' && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{language === 'ru' ? 'Важно: совместимость ESP-BAT-BT подтверждена для обновлённого корпуса HV, выпускаемого с 30.06.2025, и совместимого фиксирующего соленоида TBOSPSOL 9 V DC; старая ревизия корпуса не подходит.' : language === 'en' ? 'Important: ESP-BAT-BT compatibility is confirmed for the updated HV bonnet manufactured from 30 June 2025 and a compatible TBOSPSOL 9 V DC latching solenoid; the older bonnet revision is not compatible.' : 'Важно: съвместимостта с ESP-BAT-BT е потвърдена за обновения корпус HV, произвеждан от 30.06.2025 г., и съвместим фиксиращ соленоид TBOSPSOL 9 V DC; старата ревизия на корпуса не е съвместима.'}</p>}
                          <p className="mt-3 text-sm font-bold text-slate-900">{language === 'ru' ? 'Стоимость автоматики:' : language === 'en' ? 'Automation total:' : 'Обща стойност на автоматиката:'} {option.missing ? (language === 'ru' ? 'Нет полного товара в каталоге' : language === 'en' ? 'Catalogue item unavailable' : 'Липсва продукт в каталога') : formatEuro(option.totalPriceEUR)}</p>
                        </div>
                      )
                    })}
                  </div>
                  {selectedAutomationOption && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">{language === 'ru' ? 'Выбрано:' : language === 'en' ? 'Selected:' : 'Избрано:'} <strong>{selectedAutomationOption.type.toUpperCase()}</strong></p>
                    <button type="button" onClick={() => addKitToCart(selectedAutomationOption.type)} disabled={catalogLoading || Boolean(catalogError) || selectedAutomationOption.missing} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{language === 'ru' ? 'Добавить выбранный комплект в корзину' : language === 'en' ? 'Add selected kit to cart' : 'Добави избрания комплект в количката'}</button>
                  </div>}
                  <button type="button" onClick={() => { setShowAutomationChoice(false); setAutomationChoice(null) }} className="mt-3 text-sm font-semibold text-slate-600 underline">{language === 'ru' ? 'Назад к комплекту' : language === 'en' ? 'Back to the kit' : 'Назад към комплекта'}</button>
                </section>
              )}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setShowSummary(false)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">{copy.edit}</button>
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
          </dl>
          <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">
            <p className="font-semibold">{language === 'ru' ? 'Стандартные условия проекта' : language === 'en' ? 'Project standard' : 'Стандартни условия на проекта'}</p>
            <p className="mt-1">{language === 'ru' ? 'Подключение — верхний правый угол.' : language === 'en' ? 'Connection — top-right corner.' : 'Свързване — горен десен ъгъл.'}</p>
            <p>{language === 'ru' ? 'Труба — Ø25 мм.' : language === 'en' ? 'Pipe — Ø25 mm.' : 'Тръба — Ø25 mm.'}</p>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">{copy.notSent}</p>
        </aside>
      </div>
    </main>
  )
}
