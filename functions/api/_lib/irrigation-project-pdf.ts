import { PDFDocument, degrees, rgb, type PDFPage,  } from 'pdf-lib'
import { buildLawnDimensionAnnotations } from '../../../src/lib/irrigation/lawnDimensionAnnotations.mjs'
import fontkit from '@pdf-lib/fontkit'

type ProjectPoint = { x: number; y: number }
type IrrigationProject = {
  geometry: { shape: string; dimensionsM: { length: number | null; width: number | null; cutoutWidth: number | null; cutoutDepth: number | null; cutoutCorner: string }; areaM2: number; perimeterM: number; normalized: { regions: Array<{ boundary: { vertices: ProjectPoint[] }; exclusions?: Array<{ id: string; kind?: string; polygon: { vertices: ProjectPoint[] } }> }> } }
  operatingScenario: { manufacturer: string; family: string; model: string; pressureBar: number | null; actualNozzlePressureVerified: false }
  layout: { model: string; engineVersion: string; algorithm: string; sprinklers: Array<{ id: string; position: ProjectPoint; radiusM: number | null; arcDeg: number | null; performanceModel: string; pattern?: string; stripWidthM?: number | null; stripLengthM?: number | null; stripDirection?: string | null; stripAxis?: string | null; source: string }> }
  zones: Array<{ id: string; zoneNumber: number; zoneType: string; sprinklerIds: string[] }>
  pipeNetwork: { mainDiameterMm: number | null; zoneDiameterMm: number | null; mainRoute: ProjectPoint[]; branches: Array<{ zoneId: string; branchDirection: string; sprinklerIds: string[]; points: ProjectPoint[]; lateralConnections: Array<{ sprinklerId: string; points: ProjectPoint[] }> }> } | null
  automation?: { type: 'manual' | 'tm2' | 'rc2' | 'bat'; controllers: Array<{ sku: string; name: string; capacity: number; quantity: number; zoneNumbers: number[]; priceEUR: number | null }>; valve: { sku: string; name: string; quantity: number; priceEUR: number | null } | null; requiresControlCable: boolean; wifiRequired: boolean; totalPriceEUR: number }
  billOfMaterials: { headCount: number; zoneCount: number; flexPipeRequiredM: number | null; flexPipeCoils30m: number | null; items: Array<{ sku: string; quantity: number; name: string; priceEUR?: number | null }> }
  warnings: Array<{ code: string; path: string }>
}

const wrap = (value: string, maxChars: number) => {
  const lines: string[] = []
  let line = ''
  for (const word of value.split(/\s+/)) {
    const next = line ? line + ' ' + word : word
    if (next.length > maxChars && line) { lines.push(line); line = word } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export const createIrrigationProjectPdf = async (
  project: IrrigationProject,
  orderNumber: string,
  createdAt: string,
  fontUrl?: string,
): Promise<Uint8Array> => {
  const response = await fetch(fontUrl || 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf')
  if (!response.ok) throw new Error('Unable to load Unicode font for irrigation project PDF')
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(await response.arrayBuffer(), { subset: false })
  const size: [number, number] = [595.28, 841.89]
  const margin = 42
  const right = size[0] - margin
  const ink = rgb(0.12, 0.18, 0.16)
  const green = rgb(0.02, 0.31, 0.22)
  const muted = rgb(0.38, 0.43, 0.40)
  const line = rgb(0.82, 0.87, 0.83)
  const pale = rgb(0.93, 0.97, 0.94)
  const blue = rgb(0.08, 0.42, 0.68)
  const pages: PDFPage[] = []
  let page = pdf.addPage(size)
  pages.push(page)
  let y = 800

  const newPage = () => {
    page = pdf.addPage(size)
    pages.push(page)
    y = 800
    page.drawText('FLORIAL · ПРЕДВАРИТЕЛЕН ПРОЕКТ ЗА ПОЛИВАНЕ · ' + orderNumber, { x: margin, y: 814, size: 7, font, color: muted })
    page.drawLine({ start: { x: margin, y: 806 }, end: { x: right, y: 806 }, color: line, thickness: 0.6 })
  }
  const ensure = (height: number) => { if (y - height < 54) newPage() }
  const write = (value: string, options: { size?: number; color?: typeof ink; bold?: boolean; x?: number } = {}) => {
    const fontSize = options.size ?? 8
    const x = options.x ?? margin
    const maxChars = Math.max(16, Math.floor((right - x) / (fontSize * 0.52)))
    const lines = wrap(value, maxChars)
    ensure(lines.length * (fontSize + 3) + 2)
    for (const row of lines) {
      page.drawText(row, { x, y: y - fontSize, size: fontSize, font, color: options.color ?? ink, maxWidth: right - x })
      y -= fontSize + 3
    }
    return lines.length
  }
  const heading = (value: string) => {
    ensure(28)
    y -= 4
    page.drawRectangle({ x: margin, y: y - 17, width: right - margin, height: 17, color: pale })
    page.drawText(value, { x: margin + 7, y: y - 12, size: 8.5, font, color: green })
    y -= 24
  }
  const rule = () => {
    ensure(8)
    page.drawLine({ start: { x: margin, y }, end: { x: right, y }, color: line, thickness: 0.5 })
    y -= 9
  }

  page.drawText('ПРЕДВАРИТЕЛЕН ПРОЕКТ ЗА АВТОМАТИЧНО ПОЛИВАНЕ', {
    x: margin, y, size: 13, font, color: green, maxWidth: right - margin,
  })
  y -= 25
  write('Поръчка: ' + orderNumber + ' · Дата: ' + new Date(createdAt).toLocaleString('bg-BG', { timeZone: 'Europe/Sofia' }), { size: 8, color: muted })
  write('Florial · Автоматично напояване на тревна площ', { size: 8, color: muted })
  rule()

  const region = project.geometry.normalized.regions[0]
  const vertices = region.boundary.vertices
  const exclusions = region.exclusions ?? []
  const minX = Math.min(...vertices.map((point) => point.x))
  const maxX = Math.max(...vertices.map((point) => point.x))
  const minY = Math.min(...vertices.map((point) => point.y))
  const maxY = Math.max(...vertices.map((point) => point.y))
  const diagram = { x: margin + 8, y: y - 172, width: right - margin - 16, height: 154 }
  const scale = Math.min(diagram.width / Math.max(0.01, maxX - minX), diagram.height / Math.max(0.01, maxY - minY))
  const mapPoint = (point: ProjectPoint) => ({
    x: diagram.x + (point.x - minX) * scale + (diagram.width - (maxX - minX) * scale) / 2,
    y: diagram.y + (point.y - minY) * scale + (diagram.height - (maxY - minY) * scale) / 2,
  })
  page.drawRectangle({ x: diagram.x, y: diagram.y, width: diagram.width, height: diagram.height, color: rgb(0.985, 0.99, 0.985), borderColor: line, borderWidth: 0.5 })
  const mapped = vertices.map(mapPoint)
  for (let index = 0; index < mapped.length; index += 1) {
    const a = mapped[index]
    const b = mapped[(index + 1) % mapped.length]
    page.drawLine({ start: a, end: b, color: green, thickness: 1.4 })
  }
  for (const exclusion of exclusions) {
    const exclusionVertices = exclusion.polygon.vertices
    const xs = exclusionVertices.map((point) => point.x)
    const ys = exclusionVertices.map((point) => point.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const bottomLeft = mapPoint({ x: minX, y: minY })
    const topRight = mapPoint({ x: maxX, y: maxY })
    const topLeft = mapPoint({ x: minX, y: maxY })
    const bottomRight = mapPoint({ x: maxX, y: minY })
    const colors = exclusion.kind === 'pool'
      ? { fill: rgb(0.55, 0.83, 0.97), border: rgb(0.02, 0.41, 0.65), detail: rgb(0.02, 0.48, 0.72) }
      : exclusion.kind === 'building'
        ? { fill: rgb(0.98, 0.76, 0.76), border: rgb(0.72, 0.11, 0.11), detail: rgb(0.62, 0.08, 0.08) }
        : exclusion.kind === 'drip'
          ? { fill: rgb(0.65, 0.93, 0.82), border: rgb(0.02, 0.47, 0.36), detail: rgb(0.02, 0.55, 0.42) }
          : { fill: rgb(0.82, 0.84, 0.87), border: rgb(0.42, 0.48, 0.56), detail: rgb(0.52, 0.56, 0.61) }
    page.drawRectangle({
      x: bottomLeft.x,
      y: bottomLeft.y,
      width: topRight.x - bottomLeft.x,
      height: topRight.y - bottomLeft.y,
      color: colors.fill,
      borderColor: colors.border,
      borderWidth: 0.65,
    })
    if (exclusion.kind === 'building') {
      page.drawLine({ start: bottomLeft, end: topRight, color: colors.detail, thickness: 0.9 })
      page.drawLine({ start: topLeft, end: bottomRight, color: colors.detail, thickness: 0.9 })
    } else if (exclusion.kind === 'pool') {
      for (const level of [0.35, 0.65]) {
        const wave = [0.15, 0.38, 0.62, 0.85].map((fraction, index) =>
          mapPoint({
            x: minX + (maxX - minX) * fraction,
            y: minY + (maxY - minY) * (level + (index % 2 ? 0.045 : -0.045)),
          }))
        for (let index = 0; index < wave.length - 1; index += 1) {
          page.drawLine({ start: wave[index], end: wave[index + 1], color: colors.detail, thickness: 0.9 })
        }
      }
    } else if (exclusion.kind === 'drip') {
      for (const level of [0.3, 0.5, 0.7]) {
        const start = mapPoint({ x: minX + (maxX - minX) * 0.12, y: minY + (maxY - minY) * level })
        const end = mapPoint({ x: maxX - (maxX - minX) * 0.12, y: minY + (maxY - minY) * level })
        page.drawLine({ start, end, color: colors.detail, thickness: 1 })
      }
      for (const fraction of [0.25, 0.5, 0.75]) {
        const emitter = mapPoint({ x: minX + (maxX - minX) * fraction, y: minY + (maxY - minY) * 0.5 })
        page.drawCircle({ x: emitter.x, y: emitter.y, size: 1.5, color: colors.detail, borderColor: rgb(1, 1, 1), borderWidth: 0.35 })
      }
    }
    const points = exclusionVertices.map(mapPoint)
    for (let index = 0; index < points.length; index += 1) {
      page.drawLine({
        start: points[index],
        end: points[(index + 1) % points.length],
        color: rgb(0.42, 0.48, 0.56),
        thickness: 1,
      })
    }
  }
  const dimensionAnnotations = buildLawnDimensionAnnotations(vertices, exclusions)
  for (const annotation of dimensionAnnotations) {
    const start = mapPoint(annotation.lineStart)
    const end = mapPoint(annotation.lineEnd)
    const labelPoint = mapPoint(annotation.labelPosition)
    const dx = end.x - start.x
    const dy = end.y - start.y
    const lineLength = Math.hypot(dx, dy)
    if (lineLength <= 0.1) continue
    page.drawLine({ start, end, color: rgb(0.48, 0.53, 0.60), thickness: 0.45 })
    const nx = -dy / lineLength * 1.6
    const ny = dx / lineLength * 1.6
    page.drawLine({ start: { x: start.x - nx, y: start.y - ny }, end: { x: start.x + nx, y: start.y + ny }, color: rgb(0.48, 0.53, 0.60), thickness: 0.45 })
    page.drawLine({ start: { x: end.x - nx, y: end.y - ny }, end: { x: end.x + nx, y: end.y + ny }, color: rgb(0.48, 0.53, 0.60), thickness: 0.45 })
    const label = annotation.lengthM.toFixed(1) + ' m'
    const maxLabelWidth = Math.max(4, lineLength - 1)
    const initialSize = 5.5
    const initialWidth = font.widthOfTextAtSize(label, initialSize)
    const fontSize = initialWidth > maxLabelWidth
      ? Math.max(3.5, initialSize * maxLabelWidth / initialWidth)
      : initialSize
    const labelWidth = font.widthOfTextAtSize(label, fontSize)
    let angle = Math.atan2(dy, dx) * 180 / Math.PI
    while (angle > 90) angle -= 180
    while (angle < -90) angle += 180
    page.drawText(label, {
      x: labelPoint.x - labelWidth / 2,
      y: labelPoint.y - fontSize / 2,
      size: fontSize,
      font,
      color: rgb(0.36, 0.41, 0.48),
      rotate: degrees(angle),
    })
  }
  const drawRoute = (points: ProjectPoint[], color: typeof blue, thickness: number) => {
    const route = points.map(mapPoint)
    for (let index = 1; index < route.length; index += 1) {
      page.drawLine({ start: route[index - 1], end: route[index], color, thickness })
    }
  }
  if (project.pipeNetwork?.mainRoute) drawRoute(project.pipeNetwork.mainRoute, rgb(0.88, 0.34, 0.12), 1.4)
  for (const branch of project.pipeNetwork?.branches ?? []) {
    drawRoute(branch.points, rgb(0.92, 0.62, 0.08), 0.9)
    for (const lateral of branch.lateralConnections) drawRoute(lateral.points, rgb(0.72, 0.46, 0.12), 0.65)
  }
  const zoneByHead = new Map<string, number>()
  for (const zone of project.zones) for (const id of zone.sprinklerIds) zoneByHead.set(id, zone.zoneNumber)
  for (const sprinkler of project.layout.sprinklers) {
    const point = mapPoint(sprinkler.position)
    if (sprinkler.performanceModel === '3504-PC') {
      page.drawSvgPath('M 0 0 L 6.2 0 L 3.1 5.4 Z', { x: point.x - 3.1, y: point.y - 2.7, color: rgb(0.09, 0.23, 0.47), borderColor: rgb(1, 1, 1), borderWidth: 0.6 })
    } else {
      page.drawCircle({ x: point.x, y: point.y, size: 3.1, color: blue, borderColor: rgb(1, 1, 1), borderWidth: 0.6 })
    }
    page.drawText(String(zoneByHead.get(sprinkler.id) ?? ''), { x: point.x + 4, y: point.y + 3, size: 5.5, font, color: ink })
  }
  y = diagram.y - 15
  write('Схема: контур на база въведените размери; точките показват позиции на разпръсквачите, числото до тях — номер на зона.', { size: 6.5, color: muted })
  y -= 3

  heading('1. Геометрия и работен сценарий')
  const dimensions = project.geometry.dimensionsM
  write('Въведени от клиента: форма ' + project.geometry.shape + ' · дължина ' + (dimensions.length ?? '—') + ' m · ширина ' + (dimensions.width ?? '—') + ' m' + (dimensions.cutoutWidth && dimensions.cutoutDepth ? ' · изрез ' + dimensions.cutoutWidth + ' × ' + dimensions.cutoutDepth + ' m · ъгъл ' + dimensions.cutoutCorner : ''))
  if (exclusions.length) {
    const exclusionLabels = exclusions.map((exclusion) => {
      const points = exclusion.polygon.vertices
      const xs = points.map((point) => point.x)
      const ys = points.map((point) => point.y)
      const kindLabel = exclusion.kind === 'pool' ? 'Басейн' :
        exclusion.kind === 'building' ? 'Къща / беседка' :
          exclusion.kind === 'patio' ? 'Зона с настилка' :
            exclusion.kind === 'drip' ? 'Зона с капково напояване' : 'Зона без дъждуване'
      return kindLabel + ' (' + (exclusion.id || 'exclusion') + '): ' +
        (Math.max(...xs) - Math.min(...xs)).toFixed(1) + ' × ' +
        (Math.max(...ys) - Math.min(...ys)).toFixed(1) + ' m'
    })
    write('Зони без дъждуване: ' + exclusionLabels.join('; '), { size: 7 })
  }
  write('Изчислено по контура: площ ' + project.geometry.areaM2.toFixed(2) + ' m² · периметър ' + project.geometry.perimeterM.toFixed(2) + ' m')
  write('Модел: ' + project.operatingScenario.manufacturer + ' ' + project.operatingScenario.family + ' ' + project.operatingScenario.model)
  write('Референтна точка от таблицата на производителя за избраната дюза: ' + (project.operatingScenario.pressureBar == null ? 'не е зададена' : project.operatingScenario.pressureBar.toFixed(2) + ' bar') + '. Това не е измерване на обекта и не представлява хидравлично изчисление.')
  if (project.layout.sprinklers.some((sprinkler) => sprinkler.performanceModel === '3504-PC')) {
    write('3504-PC: показаният радиус е геометрична планировъчна стойност на Florial, а не потвърден работен радиус. Реалният радиус и дебит зависят от избраната дюза и налягането; хидравлично изчисление не е извършено.', { color: muted, size: 7 })
  }
  write('Размерите са приблизителни. Геометрията и разположението са предварителни.', { color: muted })

  heading('2. Разпръсквачи и зони')
  write('Общо разпръсквачи: ' + project.billOfMaterials.headCount + ' · Зони: ' + project.billOfMaterials.zoneCount + ' · Максимум 6 глави в зона.')
  for (const zone of project.zones) {
    const members = zone.sprinklerIds.map((id) => {
      const sprinkler = project.layout.sprinklers.find((item) => item.id === id)
      return sprinkler ? id + ' (' + (sprinkler.pattern === 'strip' ? sprinkler.performanceModel + ' strip ' + sprinkler.stripWidthM + ' m / ' + sprinkler.stripLengthM + ' m / ' + ((sprinkler.stripDirection || 'direction not recorded') + (sprinkler.stripAxis ? ' / ' + sprinkler.stripAxis : '')) : sprinkler.arcDeg + '°') + ', ' + sprinkler.performanceModel + ')' : id
    }).join(', ')
    write(zone.id + ' · ' + zone.sprinklerIds.length + ' бр. · ' + zone.zoneType + ': ' + members, { size: 7 })
  }
  for (const sprinkler of project.layout.sprinklers) {
    write(sprinkler.id + ': X=' + sprinkler.position.x.toFixed(2) + ' m, Y=' + sprinkler.position.y.toFixed(2) + ' m · ' + (sprinkler.pattern === 'strip' ? sprinkler.performanceModel + ' strip ' + sprinkler.stripWidthM + ' m / ' + sprinkler.stripLengthM + ' m / ' + ((sprinkler.stripDirection || 'direction not recorded') + (sprinkler.stripAxis ? ' / ' + sprinkler.stripAxis : '')) : sprinkler.arcDeg + '° · ' + (sprinkler.performanceModel === '3504-PC' ? 'планировъчен R=' : 'R=') + sprinkler.radiusM.toFixed(2) + ' m') + ' · ' + sprinkler.performanceModel, { size: 6.8, color: muted })
  }

  heading('3. Схематични трасета на тръбите')
  write('Всички проектни тръбни линии — главна и зонални: PE Ø25 mm. Това е фиксиран стандарт на Florial, без избор на Ø32 mm и без хидравлично оразмеряване.')
  for (const branch of project.pipeNetwork?.branches ?? []) {
    const coords = branch.points.map((point) => '(' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ')').join(' → ')
    write(branch.zoneId + ' / ' + branch.branchDirection + ': ' + coords, { size: 6.5 })
  }

  heading('4. Автоматика и управление')
  write('Всички посочени цени са с включен ДДС.', { size: 6.5, color: muted })
  const automation = project.automation
  if (!automation) {
    write('Типът управление не е записан в тази версия на проекта.', { color: muted })
  } else if (automation.type === 'manual') {
    write('Ръчно управление с кранове. Автоматични контролери, електромагнитни клапани и кутии за клапани не са включени в комплекта.')
  } else {
    for (const controller of automation.controllers) {
      write(controller.name + ' · ' + controller.quantity + ' бр. · капацитет ' + controller.capacity + ' зони · зони ' + controller.zoneNumbers.join(', '), { size: 7 })
      if (controller.priceEUR != null) write('Цена: ' + controller.priceEUR.toFixed(2) + ' € / бр. · общо ' + (controller.priceEUR * controller.quantity).toFixed(2) + ' €', { size: 7, color: muted })
    }
    if (automation.valve) {
      write('Съвместим клапан: ' + automation.valve.name + ' · ' + automation.valve.quantity + ' бр. · SKU ' + automation.valve.sku, { size: 7 })
      if (automation.valve.priceEUR != null) write('Цена: ' + automation.valve.priceEUR.toFixed(2) + ' € / бр. · общо ' + (automation.valve.priceEUR * automation.valve.quantity).toFixed(2) + ' €', { size: 7, color: muted })
    }
    write('Обща стойност на избраната автоматика: ' + automation.totalPriceEUR.toFixed(2) + ' €', { size: 8, color: green })
    if (automation.requiresControlCable) {
      write('Монтаж: необходимо е полагане на управляващ кабел от контролера до електромагнитните клапани. Кабелът и трудът по полагането не са включени в тази автоматична калкулация.', { size: 7 })
    }
    if (automation.wifiRequired) {
      write('За Wi-Fi контролера е необходим стабилен Wi-Fi сигнал на мястото на монтаж.', { size: 7 })
    }
    if (automation.type === 'bat') {
      write('За всяка зона е предвиден Rain Bird 100-HV-9V (H01040). Съвместимостта с ESP-BAT-BT изисква обновен корпус HV (производство от 30.06.2025 г.) и съвместим фиксиращ соленоид TBOSPSOL 9 V DC; старата ревизия не е съвместима.', { size: 7 })
    }
  }

  heading('5. Ведомост на материалите')
  write('Гъвкава връзка: ориентировъчно 0,5–1,5 m на разпръсквач. Количеството е планирано по 0,5 m/бр. (' + (project.billOfMaterials.flexPipeRequiredM ?? '—') + ' m); закупуване: ' + (project.billOfMaterials.flexPipeCoils30m ?? '—') + ' бр. ролки по 30 m.')
  for (const item of project.billOfMaterials.items) {
    const price = item.priceEUR == null ? '' : ' · ' + item.priceEUR.toFixed(2) + ' € / бр.'
    write(item.name + ' · ' + item.sku + ' — ' + item.quantity + ' бр.' + price, { size: 7 })
  }

  heading('6. Допускания и ограничения')
  const limitations = [
    'Документът е предварителна геометрична схема, а не окончателен монтажен или хидравличен проект.',
    'Хидравлични изчисления не се извършват: дебит, налягане в мрежата, загуби, скорости и хидравлична производителност на зоните не се определят.',
    'Не са оценявани вятър, разпръскване извън тревната площ, равномерност DU/CU, препятствия и реални трасета на изкопите.',
    'Количествата в BOM са за изброените артикули; основната PE магистрала и монтажните консумативи може да не са включени.',
  ]
  for (const item of limitations) write('• ' + item, { size: 7 })
  if (project.warnings.length) {
    write('Системни предупреждения:', { size: 7, color: green })
    for (const warning of project.warnings) write('• ' + warning.code + (warning.path ? ' · ' + warning.path : ''), { size: 6.5, color: muted })
  }

  pages.forEach((current, index) => {
    current.drawLine({ start: { x: margin, y: 34 }, end: { x: right, y: 34 }, color: line, thickness: 0.5 })
    current.drawText('Florial · ' + orderNumber + ' · Предварителен проект — не е хидравлично оразмерен', { x: margin, y: 20, size: 6.2, font, color: muted })
    current.drawText((index + 1) + ' / ' + pages.length, { x: right - 28, y: 20, size: 6.2, font, color: muted })
  })
  // Append the owner's original three-page Bulgarian installation guide without redrawing or overlaying its artwork.
  const installationGuideUrl = 'https://www.dropbox.com/scl/fi/04llvkycqs5m1xb6qh0dm/.pdf?rlkey=j6x89e4pu2g3g5zsm2vr2xhf1&st=baud1le6&dl=1'
  const guideResponse = await fetch(installationGuideUrl)
  if (!guideResponse.ok) throw new Error('Unable to load the original Florial installation guide PDF')
  const guideBytes = await guideResponse.arrayBuffer()
  const installationGuide = await PDFDocument.load(guideBytes)
  if (installationGuide.getPageCount() !== 3) throw new Error('The original Florial installation guide must contain exactly 3 pages')
  const originalPages = await pdf.copyPages(installationGuide, installationGuide.getPageIndices())
  for (const originalPage of originalPages) pdf.addPage(originalPage)

  return pdf.save()
}
