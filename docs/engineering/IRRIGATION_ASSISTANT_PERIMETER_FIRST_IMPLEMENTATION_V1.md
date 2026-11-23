# Florial — инженер-проектировщик автоматического полива газона
## Owner decisions — irrigation assistant (23.11.2026)

- The assistant performs geometric layout and equipment selection only. Hydraulic calculations are explicitly out of scope and will not be implemented: do not add flow, dynamic pressure, friction-loss, velocity or hydraulic zone-capacity calculations.
- The fixed Florial pipe diameter is Ø25 mm for both main and zone lines. The earlier Ø25/Ø32 discrepancy is closed; Ø32 mm is not an alternative.
- The generated project PDF must place the site-specific scheme and equipment specification first, followed by the complete three-page Bulgarian installation guide with its illustrations in the original page order. The guide is generic installation reference material, not a site-specific calculation.


## Реализация perimeter-first / Rain Bird R-VAN / зоны / комплект в корзину

**Статус:** реализовано, PR #473 объединён в `main`; Preview принят владельцем; Production deployment проверен.  
**Дата фиксации:** 2026-11-22  
**Merge commit:** `1926d632cc0861341a46ec932a2130ca94dfa103`  
**PR:** https://github.com/omaraandrey-dev/florial/pull/473  
**Production deployment:** `0da20669-6b24-4697-8ac4-b281eebec9a2`, source SHA совпадает с merge commit.  
**Preview, проверенный владельцем:** https://89a09c61.florial.pages.dev/irrigation-assistant

Документ описывает фактическую реализацию на указанном commit. Он дополняет, но не отменяет базовые инженерные спецификации и ранее выполненные стадии геометрии/контекста. При расхождении приоритет: действующий код и тесты для описания поведения; опубликованные данные Sanity для каталога; решение владельца для бизнес-стандарта. Неизвестные/противоречивые параметры явно перечислены в разделе 13.

---

## 1. Назначение и текущая граница продукта

Модуль — предварительный проектировщик дождевального полива газона для небольших частных участков и небольших частных отелей. Он:
1. получает форму и приблизительные размеры газона;
2. валидирует метрическую геометрию;
3. выбирает поддерживаемую модель Rain Bird R-VAN по дискретным данным производителя;
4. генерирует позиции и дуги дождевателей;
5. проверяет выборочное геометрическое покрытие и head-to-head;
6. группирует дождеватели в последовательные зоны;
7. строит схематические трассы от принятой точки подключения;
8. рассчитывает BOM по утверждённой карте SKU;
9. читает опубликованные активные товары Sanity и передаёт полный комплект в существующую корзину.

Это **не полный гидравлический проект** и не подтверждение, что на конкретном участке система будет работать при фактическом давлении/расходе. UI называет результат предварительной геометрической раскладкой и показывает соответствующие предупреждения.

### Поддерживаемая геометрия сейчас
- Одна область газона.
- Прямоугольник или ортогональная Г-образная форма.
- Метрические координаты локальной декартовой системы.
- Геометрия должна быть валидирована и подтверждена пользователем.
- Размеры в текущем customer intake считаются приблизительными.
- Исключения/вырезы, препятствия, деревья, бассейны, дорожки и ограничения распыления пока не участвуют в placement solver. Геометрия с exclusions блокируется как неподдерживаемая.
- Несколько отдельных областей, криволинейные формы и узкие полосы не считаются обычным R-VAN layout.

Узкая полоса (короткая сторона менее 2.4 м) не получает подмену круглыми R-VAN: движок может показать точные варианты R-VAN-LCS/RCS/SST, но возвращает статус, требующий отдельного pattern engine и проверки ориентации.

## 2. Клиентский сценарий и входной snapshot

Основной UI: `src/pages/IrrigationAssistantPage.tsx`.

В текущем видимом сценарии клиент:
- выбирает прямоугольник или Г-образный участок;
- вводит общие размеры в метрах;
- для L-shape указывает размеры и угол отсутствующего прямоугольного выреза;
- просматривает и подтверждает контур;
- при необходимости оставляет заметку об ограничениях.

Вода/давление/расход не запрашиваются как обязательные данные для этой предварительной раскладки и не используются как измеренное давление на форсунке. Никакое клиентское подтверждение размеров не является инженерной верификацией площадки.

`src/lib/irrigation/irrigationIntake.mjs` создаёт immutable in-memory snapshot:
- `schemaVersion: 2`;
- `projectType: automatic_lawn_irrigation`;
- `geometry.status`: preliminary geometry available либо not available;
- `geometry.normalized`: подтверждённая нормализованная геометрия;
- `areaM2` и `perimeterM` — вычисленные по контуру;
- `dimensionsAreApproximate: true`;
- `constraints.notes` — заметка пользователя;
- `readiness.geometryReady`;
- `readiness.hydraulicFeasibility: not_evaluated`.

Snapshot не сохраняется в D1/Sanity и не отправляется на сервер как долговременный проект: это локальный контракт для расчётного прохода.

## 3. Florial project standard — текущие значения в коде

Источник: `src/lib/irrigation/irrigationProjectStandards.mjs`.

```js
source: {
  tapSizeInches: 1,
  inletPressureBar: 4,
  supplyPipeDiameterMm: 25,
  connectionCorner: 'top-right'
},
pipes: {
  mainDiameterMm: 25,
  zoneDiameterMm: 25
},
zoneCapacity: {
  maxHeadsPerZone: 6
}
```

Интерпретация:
- исходная точка — кран/ввод с резьбой 1″;
- стандартное исходное давление в snapshot — 4 bar;
- подвод к точке принятия — номинально Ø25 mm;
- точка подключения к схеме — верхний правый угол;
- в текущем коде и отрисованной pipeNetwork и магистраль, и зональные ветви имеют номинал Ø25 mm;
- проектный предел — не более шести дождевателей в зоне.

Это **фиксированные допущения Florial для предварительного эскиза**, не измерения заказчика и не гидравлически подтверждённые параметры. Лимит 6 головок — внутреннее правило группировки проекта, а не универсальная производительность клапана или доказанный гидравлический предел.

**Решение владельца от 23.11.2026:** Ø25 mm является фиксированным стандартом Florial для основной магистрали и зональных линий. Ø32 mm не используется и не является открытым вопросом. Гидравлическое оразмеряване/расчёты не входят в продукт.

## 4. Производительность Rain Bird и выбор модели

Источник данных: `src/lib/irrigation/rainBirdRvanPerformanceData.mjs`.

В коде хранится дискретная таблица Rain Bird R-VAN, документ D41159B (2024):
- рекомендованное рабочее давление форсунки: 3.1 bar;
- опубликованный диапазон давления: 2.1–3.8 bar;
- база spacing: 50% диаметра полива;
- условия теста: zero wind;
- тестовый корпус: 10.2 cm pop-up;
- Rain Bird рекомендует корпуса 1800/RD1800 с регулированием давления 3.1 bar для оптимальной работы.

Движок использует только точное совпадение модели, давления и дуги через `findRainBirdRvanPerformancePoint`. Нет интерполяции, экстраполяции, выбора ближайшей строки или подстановки несуществующей рабочей точки.

### Правило выбора базовой модели
`irrigationLayoutBridge.mjs` вычисляет короткую сторону bounding box и перебирает в порядке:
1. R-VAN14;
2. R-VAN18;
3. R-VAN24.

Для каждой модели запрашивается точная точка 3.1 bar / 180°. Выбирается первая модель, радиус которой не меньше короткой стороны участка. Если короткая сторона шире доступного радиуса R-VAN24, выбирается R-VAN24 и прямоугольник обслуживается дополнительными внутренними рядами, если их поддерживает placement solver.

Из известных точек таблицы:
- R-VAN18 при 3.1 bar: радиус 5.2 m;
- R-VAN24 при 3.1 bar: радиус 7.0 m.

Это правило предварительного подбора модели по геометрии, а не доказательство того, что 3.1 bar реально будет на каждой форсунке. В output прямо установлено:
- `actualNozzlePressureVerified: false`;
- `customerSourceMeasurementsUsedAsNozzlePressure: false`;
- `hydraulicFeasibility: not_evaluated`.

Для внутренних полнокруговых позиций используется отдельная модельная запись с суффиксом `-360` (например, R-VAN24-360); производительность ищется по соответствующей точной дуговой строке.

## 5. Генерация позиций дождевателей

Реализация: `src/lib/irrigation/lawnSprinklerLayout.mjs`, алгоритм `perimeter-first-multi-row-greedy-set-cover-v3`.

### 5.1 Контрольные точки покрытия
- Шаг выборочной сетки по умолчанию: 0.25 m.
- Внутренние точки создаются по bounding box и фильтруются проверкой point-in-polygon.
- Точки на границе дополнительно добавляются отдельно, чтобы сетка не пропускала промежутки между узлами.
- Повторяющиеся координаты устраняются.
- Предельное число sample grid points: 30,000.
- Предельное число candidate positions: 12,000.
- Предельное число выбранных головок: 150.

Покрытие определяется попаданием контрольной точки в радиус и сектор конкретной форсунки. Это sampled geometric reach, а не непрерывное математическое доказательство и не DU/CU расчёт.

### 5.2 Boundary candidates
- В каждой вершине создаётся угловой кандидат.
- Выпуклая вершина получает 90°; рефлексная вершина Г-образного контура — 270°.
- На прямых сегментах создаются 180° кандидаты.
- Количество делений ребра выбирается по наименьшему радиусу из радиуса прямой форсунки и двух соседних угловых форсунок. Это уменьшает риск пропуска зоны у угла с более коротким throw radius.
- Направление сектора определяется внутренней нормалью к ребру/биссектрисой угла.
- Каждому граничному кандидату присваивается perimeter offset для последующего последовательного обхода.

### 5.3 Interior candidates
Для прямоугольника создаётся детерминированная многорядная решётка:
- координаты рядов/колонок рассчитываются делением габаритов по радиусу;
- центральная линия включается при наличии места;
- для более широких участков добавляются дополнительные равноотстоящие ряды;
- внутренние кандидаты имеют дугу 360°;
- фактическая необходимость каждой позиции решается покрытием, а не простым фактом наличия в решётке.

Для L-shape применяется консервативная внутренняя треугольная решётка с шагом рядов `radius × sqrt(3) / 2` и шахматным смещением соседних рядов на половину радиуса. Каждая точка проверяется на нахождение строго внутри исходного полигона.

### 5.4 Двухпроходный greedy set-cover
1. Все кандидаты оцениваются по тому, какие контрольные точки они покрывают.
2. Первый greedy pass рассматривает только perimeter candidates и выбирает кандидаты, максимально уменьшающие множество непокрытых точек.
3. Только если после perimeter pass остались непокрытые точки, запускается второй pass по interior candidates.
4. Interior pass покрывает остаток, не перестраивая perimeter pass и не заменяя его внутренней решёткой.
5. После выбора выполняется отдельный head-to-head repair pass.

Таким образом, внутренние 360° дождеватели не добавляются просто «для симметрии»: они должны быть нужны для оставшихся непокрытых точек либо для ремонта head-to-head.

## 6. Head-to-head проверка

`evaluateHeadToHeadSpacing` и `enforceHeadToHeadSpacing` — отдельный этап после sampled coverage.

- Для пары секторов проверяется взаимная достижимость: каждый дождеватель должен попадать в рабочий сектор другого, с учётом радиуса и направления.
- Для периметральных головок проверяются соседние позиции по циклическому perimeter order, включая переход через начало/конец периметра.
- Допустимый интервал сравнивается с меньшим из двух радиусов; дополнительно проверяется mutual sector reach.
- Если промежуток не проходит, repair ищет детерминированного кандидата на периметре.
- Для внутренней головки без взаимного соседа подбирается ближайший допустимый кандидат.
- После repair проверка запускается повторно.

Результат `layout.headToHead.passed` — обязательный gate для cart handoff. Он не заменяет гидравлический или precipitation compatibility test.

## 7. Последовательное зонирование — утверждённое правило Florial

Реализация: `buildIrrigationZones()` в `irrigationProjectStandards.mjs`.

### 7.1 Начало и направление
Источник расположен в верхнем правом углу bounding box: `(maxX, maxY)`. Для принятой ориентации кольца периметр обходится непрерывно:
1. от верхнего правого угла влево по верхней стороне;
2. вниз по левой стороне;
3. вправо по нижней стороне;
4. вверх по правой стороне к точке подключения.

Порядок реализован через `buildPerimeterContext`: выбирается ближайшая к `(maxX,maxY)` вершина, после чего сохраняется направление обхода вершин нормализованного кольца. Для прямоугольников, которые создаёт текущий geometry input, тесты подтверждают указанное направление. Если в будущем другой источник геометрии будет отдавать кольцо с противоположным winding, направление необходимо нормализовать явно до использования алгоритма.

### 7.2 Назначение зон
- Каждая perimeter head проецируется на ближайший сегмент границы.
- Вычисляется `forwardOffsetM` — длина пути от верхнего правого угла по принятому направлению.
- Периметральные головки сортируются по `forwardOffsetM`, затем по ID для детерминизма.
- Внутренние головки добавляются после периметральных в порядке рядов: сверху вниз (y descending), внутри ряда слева направо (x ascending), затем по ID.
- Периметриальные и внутренние головки объединяются в одну последовательность. Arc 90°/180°/270°/360° и признак perimeter/interior не создают самостоятельную границу зоны.
- Минимальное число зон равно `ceil(headCount / 6)`. Головки распределяются максимально равномерно при сохранении общей последовательности; остаток по одному добавляется в первые зоны.
- Примеры: 14 → 5+5+4; 13 → 5+4+4; 12 → 6+6; 8 → 4+4.
- Каждая зона содержит не более 6 головок; `zoneType` равен `mixed`, если в группе есть perimeter и interior. ID имеют вид `zone-01`, `zone-02` и т. д.
- Направление pipe branch рассчитывается для каждой головки по её source. Поэтому одна смешанная зона может иметь forward и reverse schematic branches, но остаётся одной рабочей зоной.

### 7.3 Схематические трубы
`buildPerimeterPipeNetwork()` строит маршруты от общей точки подключения:
- для perimeter heads используется направление `forward` по принятому обходу границы;
- для interior heads направление `forward/reverse` выбирается индивидуально по ближайшей половине периметра; смешанная зона может иметь оба направления;
- маршруты строятся как набор точек вдоль границы с боковыми ответвлениями к головкам, если позиция не лежит прямо на boundary;
- диаметр ветви в текущей модели берётся из стандарта Ø25 mm;
- в ответе есть connectionPoint, mainRoute, mainDiameterMm, zoneDiameterMm и branches.

Это геометрическая трассировка, не измеренная длина траншеи/трубы и не гидравлический network solver. Она не рассчитывает потери, скорости, остаточное давление или реальные длины обхода препятствий.

## 8. Ведомость материалов (BOM) и SKU

Реализация: `src/lib/irrigation/irrigationBillOfMaterials.mjs`.

BOM строится только после layout и zone assignment. Он отклоняет неполный layout, пустые зоны, дублированное назначение головок, головки без зоны, зоны более 6 головок и неизвестную модель форсунки.

### 8.1 На каждую дождевальную головку
- Форсунка R-VAN по `performanceModel` и дуге:
  - R-VAN14 → A84659;
  - R-VAN18 → A84660;
  - R-VAN24 → A84661;
  - R-VAN14-360 → A84664;
  - R-VAN18-360 → A84665;
  - R-VAN24-360 → A84666.
- Корпус Rain Bird 1804 — A44120, 1 шт.
- SBE-050 — A46010, 2 шт. на головку (по одному на каждом конце flex).
- SPX-FLEX 30 m coil — A82060: расчётный расход flex = 1 m на головку; закупочное количество = `ceil(headCount / 30)` целых бухт. UI показывает требуемые метры отдельно от числа бухт.

### 8.2 На каждую зону
- Rain Bird 100-HV — H01000, 1 шт.
- Компрессионная муфта Ø25 × 1″ наружная резьба — IQ21120M0N25D, 2 шт.
- Самый маленький клапанный колодец Rain Bird VBA02672, 1 шт.
- Для последней головки зоны — колено Ø25 × ½″ внутренняя резьба IQ21820F0N25B, 1 шт.
- Для остальных головок зоны — тройник Ø25 × ½″ внутренняя резьба IQ21520F0N25C, `zoneHeadCount - 1` шт.

### 8.3 Между клапанами зон
- Тройник равнопроходной Ø25 × Ø25 × Ø25 IQ2142000N250.
- Количество = `max(0, zoneCount - 1)`.

Пример: 8 головок в двух зонах (6 perimeter + 2 interior) дают 6×180° R-VAN24 и 2×360° R-VAN24-F; 8 корпусов 1804; 16 SBE-050; 8 m flex → 1 бухта 30 m; 6 резьбовых тройников и 2 конечных колена; 2 клапана; 4 переходника 25×1″; 2 колодца; 1 межзонный тройник.

### 8.4 Что BOM намеренно не добавляет
- PE mainline и её длину/диаметр как закупочную позицию;
- контроллер, кабель, насос, бак, фильтры, обратный клапан, регуляторы;
- земляные работы, фитинги, крепёж и расходники, не подтверждённые каталогом;
- неизвестные SKU, которых не удалось однозначно сопоставить.

По read-only проверке каталога не был подтверждён подходящий SKU 25 mm PE mainline, поэтому количество/цена не выдумываются. Схематическая труба на плане не означает, что эта труба уже включена в корзину.

## 9. Исправление карточки Sanity: IQ21520F0N25C

Владелец выявил неверный размер в опубликованном товаре: SKU `IQ21520F0N25C` был описан как 25 × ¾″ female thread. Правильная спецификация, подтверждённая владельцем: **Ø25 × ½″ внутренняя резьба × Ø25 mm**.

Исправлены и опубликованы BG/RU/EN:
- название;
- полное и короткое описание;
- спецификации размера;
- SEO H1/meta title/meta description;
- image alt.

Сохранены SKU, slug, цена, stock status, image asset, brand и references. Read-after-write подтвердил опубликованную версию. Sanity project `bxvcy0qs`, dataset `production`, document ID `19c359d0-0db5-43da-87ab-0e495c8df85a`. Полный pre-change snapshot: `docs/backups/sanity-product-IQ21520F0N25C-before-2026-11-22.json.md`.

## 10. Каталог Sanity и передача в корзину

`IrrigationAssistantPage.tsx` импортирует:
- `sanityLiveClient`;
- `buildIrrigationBillOfMaterials`;
- существующий тип `Product`.

После генерации layout BOM превращается в список SKU. Sanity GROQ query:
- ищет документы `_type == "product"`;
- фильтрует `sku in $skus`;
- исключает явно неактивные документы через `isActive != false`;
- получает _id, name, sku, priceEUR, stockStatus, vatIncluded, weightKg, локализованные названия BG/RU/EN, productType equipment, slug, brand, image URL и alt.

Важное техническое ограничение: полный перевод Portable Text для всех 15 потенциальных SKU превысил лимит ответа Sanity 64 KiB. Поэтому cart lookup ограничен полями переведённого названия (bg/ru/en name) и необходимыми для Product/cart полями. В актуальной версии сокращённый запрос был проверен на 15 активных товарных записях.

Кнопка добавления доступна только когда:
1. layout имеет `status === layout_generated`;
2. `layout.headToHead.passed === true`;
3. BOM валиден и все головки назначены ровно в одну зону;
4. каталог загружен без ошибки;
5. каждый SKU из BOM разрешился в Sanity product.

При нажатии все BOM позиции передаются через существующий `onAddToCart(product, quantity)`, затем вызывается `onNavigateCart()`. Это переиспользует штатную корзину Florial; новый checkout, отдельная корзина или параллельный backend не создаются. Цена и метаданные товара не захардкожены в BOM — они приходят из текущего опубликованного документа Sanity.

Текущая реализация проверяет активность документа и наличие SKU. Отдельная политика запрета добавления товара со `stockStatus = outOfStock` не реализована как самостоятельный gate в этом модуле; статус передаётся корзине вместе с товаром. Это следует отдельно проверить/согласовать до изменения правил доступности.

## 11. Регрессионные тесты и контрольные сценарии

Тестовые файлы:
- `tests/irrigation-intake.test.mjs`;
- `tests/irrigation-project-standards.test.mjs`;
- `tests/irrigation-layout-bridge.test.mjs`;
- `tests/irrigation-bom.test.mjs`;
- `tests/irrigation-assistant-cart.test.mjs`;
- плюс существующие geometry/performance-data tests.

Проверяемые свойства:
- geometry-only intake и отсутствие требования измерений воды для preliminary layout;
- top-right perimeter start, последовательное зонирование и capacity ≤ 6;
- 30 × 5 m: 14 heads, zones [5, 5, 4];
- 25 × 5 и 26 × 5 m: 12 heads, zones [6, 6];
- 32 × 6 m: R-VAN24, perimeter-only layout, [6, 6];
- 20 × 15 m: внутренний ряд 360° только при необходимости, zero uncovered samples и head-to-head pass;
- 30 × 30 m: R-VAN24, несколько внутренних рядов 360°, perimeter zones precede interior zones, zero uncovered samples, head-to-head pass;
- неизвестная форсунка, неполное или дублированное zone assignment блокируют BOM;
- cart integration использует Sanity SKU lookup, передаёт все строки и открывает штатную корзину.

### Проверки CI и Preview
На точном PR head `c9ca9e96a7ab170cb6c71955c058de955071f81f`:
- Blog and Studio validation run `45008858032` — success;
- Florial D1 migration validation run `45008807048` — success;
- Blog and Studio validation run `45008807081` — success.
Все три workflow jobs завершились success. D1 schema/data не изменялись; D1 validation является общим workflow-gate.

Cloudflare Pages Preview `https://89a09c61.florial.pages.dev` — build/deploy success, source commit `c9ca9e96a7ab170cb6c71955c058de955071f81f`. Владелец вручную проверил интерфейс и сообщил, что результат получился очень хорошо; подробные замечания оставлены на последующий этап.

### Merge и Production
- PR #473 squash-merged.
- main merge SHA: `1926d632cc0861341a46ec932a2130ca94dfa103`.
- Cloudflare Pages Production deployment: `0da20669-6b24-4697-8ac4-b281eebec9a2`.
- Production source branch: `main`; source SHA точно совпадает с merge SHA; build/deploy stage success.

Production deployment проверен по Cloudflare deployment metadata. Отдельная авторизованная browser QA после Production deployment не выполнялась и не заявляется.

## 12. Основные файлы реализации

- `src/pages/IrrigationAssistantPage.tsx` — customer flow, layout summary, BOM lookup, cart action.
- `src/lib/irrigation/lawnGeometryInput.mjs` — построение исходного контура из размеров.
- `src/lib/irrigation/lawnGeometry.mjs` — валидация геометрии.
- `src/lib/irrigation/irrigationIntake.mjs` — immutable snapshot schema v2 и readiness.
- `src/lib/irrigation/rainBirdRvanPerformanceData.mjs` — дискретные таблицы Rain Bird R-VAN.
- `src/lib/irrigation/irrigationLayoutBridge.mjs` — выбор модели, вызов layout engine, сборка итогового preliminary result.
- `src/lib/irrigation/lawnSprinklerLayout.mjs` — кандидаты, coverage sampling, greedy selection, head-to-head repair.
- `src/lib/irrigation/irrigationProjectStandards.mjs` — Florial constants, perimeter walk, zone grouping и schematic pipe network.
- `src/lib/irrigation/irrigationBillOfMaterials.mjs` — SKU map, BOM quantities and validity checks.
- `src/App.tsx` — передача штатных cart/navigation handlers.
- `tests/irrigation-*.test.mjs` — регрессионные проверки intake/layout/zones/BOM/cart.

## 13. Ограничения, открытые вопросы и правила дальнейшей работы

Граница продукта и текущие ограничения:
1. Гидравлические расчёты не выполняются и не входят в план развития: расход, динамическое давление, потери, скорости, остаточное давление и гидравлическая производительность зон не рассчитываются.
2. Диаметр основной магистрали и зональных линий фиксирован владельцем: Ø25 mm.
3. Максимум 6 головок в зоне — стандарт геометрической группировки Florial, не гидравлический вывод.
4. Precipitation matching/uniformity (DU/CU), ветровое влияние, overspray и запретные зоны не являются расчётными функциями текущего продукта.
5. Геометрия исключений/препятствий, сложные L-shape и несколько регионов ограничены поддерживаемыми сценариями и тестами.
6. Фактическая длина траншей/труб на участке зависит от монтажа; схематическая трасса не является исполнительной съёмкой.
7. Проверка cart поведения для out-of-stock/on-request остаётся отдельным продуктовым вопросом.
8. Практическая проверка монтажа и соответствия реального участка схеме выполняется монтажником на объекте, а не автоматическим гидравлическим модулем.

### Жёсткие правила дальнейшего развития
- Не превращать `layout_generated` в `design_ready` без самостоятельных инженерных gates.
- Не считать 4 bar на вводе измеренным динамическим давлением и не подставлять его как давление на сопле.
- Не интерполировать manufacturer data и не подбирать несуществующие SKU.
- Не балансировать периметральные зоны через противоположные стороны источника.
- Не включать внутренние головки в последовательность периметра.
- Не менять BOM counts/SKU без проверки каталога и подтверждения инженерной схемы подключения.
- Не изменять опубликованные Sanity товары/контент за пределами отдельного подтверждённого задания.
- Перед новым этапом читать этот документ, исходники, тесты и актуальный `main`; старое решение о паузе от 16.11 superseded только в части конкретной работы, явно возобновлённой владельцем 22.11.

## 14. Связанные документы
- `docs/engineering/IRRIGATION_ASSISTANT_LAWN_ENGINEERING_SPEC.md` — governing product/engineering direction.
- `docs/engineering/IRRIGATION_LAWN_ENGINE_CORE_DESIGN_V1.md` — domain contracts and engineering concepts.
- `docs/engineering/IRRIGATION_LAWN_LAYOUT_AND_HYDRAULIC_ALGORITHMS_V1.md` — proposed algorithm and future hydraulic gates.
- `docs/audits/2026-11-22-irrigation-perimeter-first-standard-basis.md` — implementation audit and history.
- `docs/AI/OPEN_QUESTIONS.md` — live unresolved decisions.
- `docs/AI/PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md` — historical pause handoff, amended with the 22.11 scoped resumption.


## 15. Owner PDF handoff after irrigation-assisted checkout

Current implementation details, validation rules, D1 persistence, email delivery, PDF contents and release boundaries are documented in [IRRIGATION_ASSISTANT_BALANCED_ZONES_AND_ORDER_PDF_V1.md](IRRIGATION_ASSISTANT_BALANCED_ZONES_AND_ORDER_PDF_V1.md).

The project snapshot is attached to the normal checkout request only after the complete generated kit is added. The order endpoint validates the submitted snapshot against the server-resolved cart SKU quantities and persists it in the existing `order_events.metadata` field with event type `irrigation_project_attached`; no D1 migration is introduced. A separate preliminary PDF is emailed to the owner after order persistence. Customer confirmation/proforma email is unchanged. If PDF generation or delivery fails, the saved order remains valid and the event records the delivery status where possible.

The cart detaches the snapshot when any generated kit SKU quantity is changed or removed. The PDF includes overall/cut-out dimensions, the drawn schematic Ø25 mm main/zone/lateral routes, and catalogue names plus BOM SKUs/quantities. The document clearly states that hydraulic calculations are outside the Florial assistant's scope. The approved next PDF change is to append the complete three-page Bulgarian installation guide after the site-specific project section.
