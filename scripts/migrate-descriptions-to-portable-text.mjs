import {createClient} from '@sanity/client'
import {convertStringToPortableText} from '../src/lib/richTextUtils.mjs'

const projectId = 'bxvcy0qs'
const datasets = ['production', 'plants']
const apply = process.argv.includes('--apply')
const confirmLiveWrite = process.argv.includes('--confirm-live-write')
const backupConfirmed = process.env.SANITY_BACKUP_CONFIRMED === '1'
const batchSize = 25
const pageSize = 100
const headingStyle = 'h2'

if (apply && !confirmLiveWrite) {
  throw new Error('Запись запрещена: для live-изменений дополнительно укажите --confirm-live-write после отдельного подтверждения владельца.')
}
if (apply && !backupConfirmed) {
  throw new Error('Запись запрещена: сначала экспортируйте production и plants, затем установите SANITY_BACKUP_CONFIRMED=1.')
}
if (apply && !process.env.SANITY_AUTH_TOKEN) {
  throw new Error('Для --apply требуется SANITY_AUTH_TOKEN в переменных окружения.')
}

function createDatasetClient(dataset) {
  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: false,
    perspective: 'published',
    ...(apply ? {token: process.env.SANITY_AUTH_TOKEN} : {}),
  })
}

async function fetchAllProducts(client) {
  const documents = []
  let after = ''
  while (true) {
    const batch = await client.fetch(
      '*[_type == "product" && _id > $after] | order(_id asc)[0...100]{_id,name,description,translations{bg{description},ru{description},en{description}}}',
      {after},
    )
    if (!Array.isArray(batch) || batch.length === 0) break
    documents.push(...batch)
    after = batch[batch.length - 1]._id
    if (batch.length < pageSize) break
  }
  return documents
}

function buildDocumentChanges(document) {
  const set = {}
  const examples = []

  const add = (path, value) => {
    if (typeof value !== 'string' || !value.trim()) return
    const blocks = convertStringToPortableText(value, headingStyle)
    if (!blocks.length) return
    set[path] = blocks
    examples.push({path, before: value, after: blocks})
  }

  add('description', document.description)
  for (const language of ['bg', 'ru', 'en']) {
    add('translations.' + language + '.description', document.translations?.[language]?.description)
  }

  return {set, examples}
}

for (const dataset of datasets) {
  const client = createDatasetClient(dataset)
  const documents = await fetchAllProducts(client)
  const changes = []

  for (const document of documents) {
    const result = buildDocumentChanges(document)
    if (Object.keys(result.set).length) {
      changes.push({id: document._id, name: document.name, set: result.set, examples: result.examples})
    }
  }

  const fieldCount = changes.reduce((total, item) => total + Object.keys(item.set).length, 0)
  console.log('\n=== Dataset: ' + dataset + ' ===')
  console.log('Найдено товаров: ' + documents.length)
  console.log('Документов с изменениями: ' + changes.length)
  console.log('Полей description к преобразованию: ' + fieldCount)
  console.log('Режим: ' + (apply ? 'APPLY' : 'DRY-RUN'))

  const previewLimit = process.argv.includes('--verbose') ? changes.length : Math.min(changes.length, 8)
  for (const document of changes.slice(0, previewLimit)) {
    for (const example of document.examples) {
      console.log('\nДокумент: ' + document.name + ' (' + document.id + ')')
      console.log('Поле: ' + example.path)
      console.log('ДО:\n' + example.before)
      console.log('ПОСЛЕ:\n' + JSON.stringify(example.after, null, 2))
    }
  }
  if (changes.length > previewLimit) {
    console.log('\nПоказаны первые ' + previewLimit + ' из ' + changes.length + ' документов. Для полного вывода используйте --verbose.')
  }

  if (!apply || changes.length === 0) continue

  for (let offset = 0; offset < changes.length; offset += batchSize) {
    const batch = changes.slice(offset, offset + batchSize)
    let transaction = client.transaction()
    for (const document of batch) {
      transaction = transaction.patch(document.id, patch => patch.set(document.set))
    }
    await transaction.commit()
    console.log('Записано документов: ' + Math.min(offset + batch.length, changes.length) + '/' + changes.length)
  }
}

if (!apply) {
  console.log('\nDRY-RUN завершён. Sanity не изменялся.')
} else {
  console.log('\nМиграция завершена. Проверьте опубликованные карточки и зафиксируйте результат в журнале.')
}
