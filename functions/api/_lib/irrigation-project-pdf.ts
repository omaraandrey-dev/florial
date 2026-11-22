import { PDFDocument, rgb, type PDFPage,  } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

type ProjectPoint = { x: number; y: number }
type IrrigationProject = {
  geometry: { shape: string; dimensionsM: { length: number | null; width: number | null; cutoutWidth: number | null; cutoutDepth: number | null; cutoutCorner: string }; areaM2: number; perimeterM: number; normalized: { regions: Array<{ boundary: { vertices: ProjectPoint[] } }> } }
  operatingScenario: { manufacturer: string; family: string; model: string; pressureBar: number | null; actualNozzlePressureVerified: false }
  layout: { model: string; engineVersion: string; algorithm: string; sprinklers: Array<{ id: string; position: ProjectPoint; radiusM: number; arcDeg: number; performanceModel: string; source: string }> }
  zones: Array<{ id: string; zoneNumber: number; zoneType: string; sprinklerIds: string[] }>
  pipeNetwork: { mainDiameterMm: number | null; zoneDiameterMm: number | null; mainRoute: ProjectPoint[]; branches: Array<{ zoneId: string; branchDirection: string; sprinklerIds: string[]; points: ProjectPoint[]; lateralConnections: Array<{ sprinklerId: string; points: ProjectPoint[] }> }> } | null
  billOfMaterials: { headCount: number; zoneCount: number; flexPipeRequiredM: number | null; flexPipeCoils30m: number | null; items: Array<{ sku: string; quantity: number; name: string }> }
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

  const vertices = project.geometry.normalized.regions[0].boundary.vertices
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
    page.drawCircle({ x: point.x, y: point.y, size: 3.1, color: blue, borderColor: rgb(1, 1, 1), borderWidth: 0.6 })
    page.drawText(String(zoneByHead.get(sprinkler.id) ?? ''), { x: point.x + 4, y: point.y + 3, size: 5.5, font, color: ink })
  }
  y = diagram.y - 15
  write('Схема: контур на база въведените размери; точките показват позиции на разпръсквачите, числото до тях — номер на зона.', { size: 6.5, color: muted })
  y -= 3

  heading('1. Геометрия и работен сценарий')
  const dimensions = project.geometry.dimensionsM
  write('Въведени от клиента: форма ' + project.geometry.shape + ' · дължина ' + (dimensions.length ?? '—') + ' m · ширина ' + (dimensions.width ?? '—') + ' m' + (dimensions.cutoutWidth && dimensions.cutoutDepth ? ' · изрез ' + dimensions.cutoutWidth + ' × ' + dimensions.cutoutDepth + ' m · ъгъл ' + dimensions.cutoutCorner : ''))
  write('Изчислено по контура: площ ' + project.geometry.areaM2.toFixed(2) + ' m² · периметър ' + project.geometry.perimeterM.toFixed(2) + ' m')
  write('Модел: ' + project.operatingScenario.manufacturer + ' ' + project.operatingScenario.family + ' ' + project.operatingScenario.model)
  write('Референтно налягане по таблицата на производителя: ' + (project.operatingScenario.pressureBar == null ? 'не е зададено' : project.operatingScenario.pressureBar.toFixed(2) + ' bar') + ' · Реалното налягане при дюзите не е измерено.')
  write('Размерите са приблизителни. Геометрията и разположението са предварителни.', { color: muted })

  heading('2. Разпръсквачи и зони')
  write('Общо разпръсквачи: ' + project.billOfMaterials.headCount + ' · Зони: ' + project.billOfMaterials.zoneCount + ' · Максимум 6 глави в зона.')
  for (const zone of project.zones) {
    const members = zone.sprinklerIds.map((id) => {
      const sprinkler = project.layout.sprinklers.find((item) => item.id === id)
      return sprinkler ? id + ' (' + sprinkler.arcDeg + '°, ' + sprinkler.performanceModel + ')' : id
    }).join(', ')
    write(zone.id + ' · ' + zone.sprinklerIds.length + ' бр. · ' + zone.zoneType + ': ' + members, { size: 7 })
  }
  for (const sprinkler of project.layout.sprinklers) {
    write(sprinkler.id + ': X=' + sprinkler.position.x.toFixed(2) + ' m, Y=' + sprinkler.position.y.toFixed(2) + ' m · ' + sprinkler.arcDeg + '° · R=' + sprinkler.radiusM.toFixed(2) + ' m · ' + sprinkler.performanceModel, { size: 6.8, color: muted })
  }

  heading('3. Схематични трасета на тръбите')
  write('Главна линия: Ø' + (project.pipeNetwork?.mainDiameterMm ?? '—') + ' mm · Зонални линии: Ø' + (project.pipeNetwork?.zoneDiameterMm ?? '—') + ' mm. Диаметрите са проектни допускания, не резултат от хидравлично оразмеряване.')
  for (const branch of project.pipeNetwork?.branches ?? []) {
    const coords = branch.points.map((point) => '(' + point.x.toFixed(2) + ', ' + point.y.toFixed(2) + ')').join(' → ')
    write(branch.zoneId + ' / ' + branch.branchDirection + ': ' + coords, { size: 6.5 })
  }

  heading('4. Ведомост на материалите')
  write('Необходима гъвкава връзка: ' + (project.billOfMaterials.flexPipeRequiredM ?? '—') + ' m · Закупуване: ' + (project.billOfMaterials.flexPipeCoils30m ?? '—') + ' бр. ролки по 30 m.')
  for (const item of project.billOfMaterials.items) write(item.name + ' · ' + item.sku + ' — ' + item.quantity + ' бр.', { size: 7 })

  heading('5. Допускания и ограничения')
  const limitations = [
    'Документът е предварителна геометрична схема, а не окончателен монтажен или хидравличен проект.',
    'Не са изчислявани дебит, динамично налягане, загуби по дължина и местни съпротивления, скорости и остатъчно налягане.',
    'Не е потвърдена хидравличната възможност шест разпръсквача да работят едновременно в една зона.',
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
  return pdf.save()
}
