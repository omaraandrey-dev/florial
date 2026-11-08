import {defineField, defineType} from 'sanity'
import {KitComponentPreview} from '../components/KitComponentPreview'

const KIT_CATEGORY_ID = '6709cd41-18c6-4c5f-bc27-90d55d685dec'

const slugField = (title = 'URL адрес') => defineField({
  name: 'slug',
  title: `${title} (slug)`,
  type: 'slug',
  options: {source: 'name', maxLength: 96},
})

const localizedAltFields = () => [
  defineField({name: 'alt', title: 'Alt текст (BG)', type: 'string'}),
  defineField({name: 'altEn', title: 'Alt text (EN)', type: 'string'}),
  defineField({name: 'altRu', title: 'Alt текст (RU)', type: 'string'}),
]

const localizedImageTitleFields = () => [
  defineField({name: 'title', title: 'Title на изображението (BG)', type: 'string'}),
  defineField({name: 'titleEn', title: 'Image title (EN)', type: 'string'}),
  defineField({name: 'titleRu', title: 'Title изображения (RU)', type: 'string'}),
]

const seoFields = defineType({
  name: 'seoFields', title: 'SEO', type: 'object',
  fields: [
    defineField({name: 'metaTitle', title: 'Meta title', type: 'string'}),
    defineField({name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3}),
    defineField({name: 'noIndex', title: 'Не индексирай страницата', type: 'boolean', initialValue: false}),
    defineField({name: 'keywords', title: 'Ключови думи', type: 'array', of: [{type: 'string'}]}),
  ],
})

const productSeoFields = defineType({
  name: 'productSeoFields', title: 'SEO на продукта', type: 'object',
  fields: [
    defineField({name: 'h1', title: 'H1 на продукта', type: 'string'}),
    defineField({
      name: 'metaTitle',
      title: 'Meta Title (до 70 символа)',
      type: 'string',
      validation: Rule => Rule.max(70).warning('Препоръчителната максимална дължина е 70 символа.'),
    }),
    defineField({name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3}),
    defineField({name: 'noIndex', title: 'Не индексирай страницата', type: 'boolean', initialValue: false}),
    defineField({name: 'keywords', title: 'Ключови думи', type: 'array', of: [{type: 'string'}]}),
    defineField({
      name: 'title',
      title: 'Старо SEO заглавие (legacy)',
      type: 'string',
      deprecated: {reason: 'Използвайте Meta Title. Старите стойности се запазват за обратна съвместимост.'},
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'description',
      title: 'Старо SEO описание (legacy)',
      type: 'text',
      rows: 3,
      deprecated: {reason: 'Използвайте Meta Description. Старите стойности се запазват за обратна съвместимост.'},
      readOnly: true,
      hidden: true,
    }),
  ],
})

// Category-only SEO model. Existing live fields stay in place; proposals are stored separately.
const categorySeoFields = defineType({
  name: 'categorySeoFields', title: 'SEO на категория', type: 'object',
  fields: [
    defineField({name: 'h1', title: 'H1 на страницата', type: 'string'}),
    defineField({name: 'metaTitle', title: 'Meta title', type: 'string'}),
    defineField({name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3}),
    defineField({name: 'noIndex', title: 'Не индексирай страницата', type: 'boolean', initialValue: false}),
    defineField({name: 'keywords', title: 'Ключови думи', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'suggested', title: 'Предложение за SEO (не е публикувано)', type: 'object', fields: [
      defineField({name: 'h1', title: 'Предложен H1', type: 'string'}),
      defineField({name: 'metaTitle', title: 'Предложен Meta title', type: 'string'}),
      defineField({name: 'metaDescription', title: 'Предложен Meta description', type: 'text', rows: 3}),
      defineField({name: 'generatedAt', title: 'Дата на генериране', type: 'datetime'}),
      defineField({name: 'generatorVersion', title: 'Версия на генератора', type: 'string'}),
      defineField({name: 'status', title: 'Статус на предложението', type: 'string', options: {
        list: [
          {title: 'За преглед', value: 'needsReview'},
          {title: 'Одобрено', value: 'approved'},
        ],
        layout: 'radio',
      }}),
    ]}),
  ],
})

const richDescription = defineType({
  name: 'richDescription',
  title: 'Форматирано описание',
  type: 'array',
  of: [{
    type: 'block',
    styles: [
      {title: 'Параграф', value: 'normal'},
      {title: 'Заглавие 2', value: 'h2'},
      {title: 'Заглавие 3', value: 'h3'},
      {title: 'Цитат', value: 'blockquote'},
    ],
    lists: [
      {title: 'Неномериран списък', value: 'bullet'},
      {title: 'Номериран списък', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: 'Удебелен', value: 'strong'},
        {title: 'Курсив', value: 'em'},
        {title: 'Подчертан', value: 'underline'},
      ],
      annotations: [{
        name: 'link',
        title: 'Връзка',
        type: 'object',
        fields: [
          defineField({
            name: 'href',
            title: 'URL адрес',
            type: 'url',
            validation: Rule => Rule.uri({scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true}),
          }),
        ],
      }],
    },
  }],
})

const productSpec = defineType({
  name: 'productSpec', title: 'Техническа характеристика', type: 'object',
  fields: [
    defineField({name: 'name', title: 'Характеристика', type: 'string'}),
    defineField({name: 'value', title: 'Стойност', type: 'string'}),
  ],
  preview: {select: {title: 'name', subtitle: 'value'}},
})

const serviceContentBlock = defineType({
  name: 'serviceContentBlock', title: 'Блок съдържание на услугата', type: 'object',
  fields: [
    defineField({name: 'title', title: 'Заглавие', type: 'string'}),
    defineField({name: 'text', title: 'Текст', type: 'text', rows: 4}),
    defineField({name: 'translations', title: 'Преводи на блока', type: 'object', fields: ['en', 'ru'].map((language) => defineField({
      name: language, title: language === 'en' ? 'English' : 'Русский', type: 'object',
      fields: [
        defineField({name: 'title', title: language === 'en' ? 'Title' : 'Заглавие', type: 'string'}),
        defineField({name: 'text', title: language === 'en' ? 'Text' : 'Текст', type: 'text', rows: 4}),
        defineField({name: 'imageAlt', title: language === 'en' ? 'Image alt text' : 'Alt изображения', type: 'string'}),
      ],
    }))}),
    defineField({name: 'image', title: 'Снимка', type: 'image', options: {hotspot: true}, fields: localizedAltFields()}),
    defineField({name: 'imagePosition', title: 'Позиция на снимката', type: 'string', options: {list: [
      {title: 'Ляво', value: 'left'}, {title: 'Дясно', value: 'right'},
    ]}, initialValue: 'left'}),
  ],
  preview: {select: {title: 'title', media: 'image'}},
})

const translationText = (language: string, title: string) => defineField({
  name: language, title, type: 'object',
  fields: [
    defineField({name: 'name', title: 'Име', type: 'string'}),
    defineField({name: 'shortDescription', title: 'Кратко описание', type: 'text', rows: 3}),
    defineField({name: 'description', title: 'Описание', type: 'text', rows: 6}),
    defineField({name: 'hero', title: 'Hero', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'subtitle', title: 'Подзаглавие', type: 'text', rows: 3}),
    ]}),
    defineField({name: 'callToAction', title: 'Призив към действие', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'text', title: 'Текст', type: 'text', rows: 3}),
      defineField({name: 'buttonLabel', title: 'Текст на бутона', type: 'string'}),
    ]}),
    defineField({name: 'advantages', title: 'Предимства', type: 'array', of: [{type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'text', title: 'Текст', type: 'text', rows: 3}),
    ]}]}),
    defineField({name: 'steps', title: 'Етапи на услугата', type: 'array', of: [{type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'text', title: 'Текст', type: 'text', rows: 3}),
    ]}]}),
    defineField({name: 'leadForm', title: 'Форма за запитване', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'submitLabel', title: 'Текст на бутона', type: 'string'}),
      defineField({name: 'successMessage', title: 'Съобщение след изпращане', type: 'text', rows: 3}),
      defineField({name: 'fields', title: 'Полета на формата', type: 'array', of: [{type: 'object', fields: [
        defineField({name: 'name', title: 'Техническо име', type: 'string'}),
        defineField({name: 'label', title: 'Етикет', type: 'string'}),
        defineField({name: 'type', title: 'Тип на полето', type: 'string', options: {list: [
          {title: 'Текст', value: 'text'},
          {title: 'Телефон', value: 'tel'},
          {title: 'Имейл', value: 'email'},
          {title: 'Дълъг текст', value: 'textarea'},
        ]}, initialValue: 'text'}),
        defineField({name: 'placeholder', title: 'Подсказка', type: 'string'}),
        defineField({name: 'required', title: 'Задължително', type: 'boolean'}),
      ]}]}),
    ]}),
    defineField({name: 'seo', title: 'SEO за езика', type: 'object', fields: [
      defineField({name: 'metaTitle', title: 'Meta title', type: 'string'}),
      defineField({name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3}),
      defineField({name: 'noIndex', title: 'Не индексирай тази езикова версия', type: 'boolean', initialValue: false}),
      defineField({name: 'keywords', title: 'Ключови думи', type: 'array', of: [{type: 'string'}]}),
    ]}),
  ],
})

const categoryTranslations = defineField({
  name: 'translations', title: 'Преводи на категориите (име и описание)', type: 'object',
  fields: ['en', 'ru'].map((language) => defineField({
    name: language, title: language === 'en' ? 'English' : 'Русский', type: 'object',
    fields: [
      defineField({name: 'name', title: language === 'en' ? 'Name' : 'Название', type: 'string'}),
      defineField({name: 'description', title: language === 'en' ? 'Description' : 'Описание', type: 'text', rows: 4}),
      defineField({name: 'seo', title: 'SEO за езика', type: 'categorySeoFields'}),
    ],
  })),
})

const productTranslations = defineField({
  name: 'translations', title: 'Преводи', type: 'object',
  fields: ['en', 'ru'].map((language) => defineField({
    name: language, title: language === 'en' ? 'English' : 'Русский', type: 'object',
    fields: [
      defineField({name: 'name', title: language === 'en' ? 'Product name' : 'Название товара', type: 'string'}),
      defineField({name: 'shortDescription', title: language === 'en' ? 'Short description' : 'Краткое описание', type: 'text', rows: 3}),
      defineField({name: 'description', title: language === 'en' ? 'Description (legacy text)' : 'Описание (старый текст)', type: 'text', rows: 8}),
      defineField({name: 'formattedDescription', title: language === 'en' ? 'Formatted description' : 'Форматирано описание', type: 'richDescription'}),
      defineField({name: 'seo', title: 'SEO за езика', type: 'productSeoFields'}),
      defineField({name: 'specifications', title: 'Преведени характеристики', type: 'array', of: [{type: 'productSpec'}]}),
    ],
  })),
})

const irrigationCategory = defineType({
  name: 'category', title: 'Категории за поливане', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Име на категорията (BG)', type: 'string'}),
    slugField(),
    defineField({name: 'parent', title: 'Родителска категория', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'image', title: 'Снимка', type: 'image', options: {hotspot: true}, fields: [...localizedAltFields(), ...localizedImageTitleFields()]}),
    defineField({name: 'description', title: 'Описание', type: 'text', rows: 4}),
    defineField({name: 'sortOrder', title: 'Ред на показване', type: 'number'}),
    categoryTranslations,
    defineField({name: 'helpBlock', title: 'Блок за помощ при избор на поливна система', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие (BG)', type: 'string'}),
      defineField({name: 'text', title: 'Текст (BG)', type: 'text', rows: 8}),
      defineField({name: 'buttonLabel', title: 'Текст на бутона (BG)', type: 'string'}),
      defineField({name: 'buttonUrl', title: 'Вътрешен адрес на услугата или статията', type: 'string', description: 'Използвайте относителен адрес, започващ с /services/ или /blog/. Ако е празно, сайтът използва общата услуга за монтаж на автоматично напояване.'}),
      defineField({name: 'translations', title: 'Преводи', type: 'object', fields: ['en', 'ru'].map((language) => defineField({
        name: language, title: language === 'en' ? 'English' : 'Русский', type: 'object', fields: [
          defineField({name: 'title', title: language === 'en' ? 'Title' : 'Заголовок', type: 'string'}),
          defineField({name: 'text', title: language === 'en' ? 'Text' : 'Текст', type: 'text', rows: 8}),
          defineField({name: 'buttonLabel', title: language === 'en' ? 'Button label' : 'Подпись кнопки', type: 'string'}),
        ],
      }))}),
    ]}),
    defineField({name: 'seo', title: 'SEO (български)', type: 'categorySeoFields'}),
  ],
  preview: {select: {title: 'name', media: 'image'}},
})

const brand = defineType({
  name: 'brand', title: 'Марки', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Име на марката', type: 'string'}),
    slugField('URL адрес'),
    defineField({name: 'logo', title: 'Лого', type: 'image', options: {hotspot: true}, fields: localizedAltFields()}),
    defineField({name: 'description', title: 'Описание', type: 'text', rows: 4}),
    defineField({name: 'website', title: 'Официален сайт', type: 'url'}),
    defineField({name: 'isFeatured', title: 'Препоръчана марка', type: 'boolean'}),
  ],
  preview: {select: {title: 'name', media: 'logo'}},
})

const kitComponent = defineType({
  name: 'kitComponent',
  title: 'Компонент комплекта',
  type: 'object',
  fields: [
    defineField({
      name: 'product',
      title: 'Товар',
      type: 'reference',
      to: [{type: 'product'}],
      options: {
        filter: ({document}) => {
          const currentId = String(document?._id || '').replace(/^drafts\./, '')
          return {
            filter: '!references($kitCategoryId) && _id != $currentId && _id != $draftId',
            params: {
              kitCategoryId: KIT_CATEGORY_ID,
              currentId,
              draftId: 'drafts.' + currentId,
            },
          }
        },
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'quantity',
      title: 'Количество',
      type: 'number',
      validation: Rule => Rule.required().min(0.000001),
    }),
    defineField({
      name: 'unit',
      title: 'Единица измерения',
      type: 'string',
      options: {list: [
        {title: 'бр.', value: 'pcs'},
        {title: 'm', value: 'm'},
      ]},
      initialValue: 'pcs',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Заметка',
      type: 'object',
      fields: [
        defineField({name: 'bg', title: 'Бележка (BG)', type: 'string'}),
        defineField({name: 'ru', title: 'Заметка (RU)', type: 'string'}),
        defineField({name: 'en', title: 'Note (EN)', type: 'string'}),
      ],
    }),
  ],
  preview: {select: {productRef: 'product._ref', quantity: 'quantity', unit: 'unit'}},
  components: {preview: KitComponentPreview},
})

const irrigationProduct = defineType({
  name: 'product', title: 'Продукти за поливане', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Име на продукта (BG)', type: 'string'}),
    slugField(),
    defineField({name: 'sku', title: 'Артикул / SKU', type: 'string'}),
    defineField({name: 'ean', title: 'EAN / баркод', type: 'string'}),
    defineField({name: 'brand', title: 'Марка', type: 'reference', to: [{type: 'brand'}]}),
    defineField({name: 'category', title: 'Основна категория (legacy)', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'categories', title: 'Категории на продукта', type: 'array', of: [{type: 'reference', to: [{type: 'category'}]}]}),
    defineField({name: 'shortDescription', title: 'Кратко описание', type: 'text', rows: 3}),
    defineField({name: 'description', title: 'Пълно описание (BG)', type: 'richDescription'}),
    defineField({name: 'mainImage', title: 'Основна снимка', type: 'image', options: {hotspot: true}, fields: [
      defineField({name: 'alt', title: 'Alt текст (BG)', type: 'string'}),
      defineField({name: 'altEn', title: 'Alt text (EN)', type: 'string'}),
      defineField({name: 'altRu', title: 'Alt текст (RU)', type: 'string'}),
    ]}),
    defineField({name: 'gallery', title: 'Допълнителни снимки', type: 'array', of: [{type: 'image', options: {hotspot: true}, fields: [
      defineField({name: 'alt', title: 'Alt текст (BG)', type: 'string'}),
      defineField({name: 'altEn', title: 'Alt text (EN)', type: 'string'}),
      defineField({name: 'altRu', title: 'Alt текст (RU)', type: 'string'}),
    ]}]}),
    defineField({name: 'priceEUR', title: 'Цена (EUR)', type: 'number'}),
    defineField({name: 'oldPriceEUR', title: 'Стара цена (EUR)', type: 'number'}),
    defineField({name: 'vatIncluded', title: 'Цената включва ДДС', description: 'За крайните потребителски цени това поле трябва да остане включено.', type: 'boolean', initialValue: true}),
    defineField({name: 'stockStatus', title: 'Наличност', type: 'string', options: {list: [
      {title: 'В наличност', value: 'inStock'}, {title: 'По заявка', value: 'onRequest'}, {title: 'Изчерпан', value: 'outOfStock'},
    ]}}),
    defineField({name: 'stockQuantity', title: 'Количество на склад', type: 'number'}),
    defineField({name: 'weightKg', title: 'Тегло (кг)', type: 'number'}),
    defineField({name: 'specifications', title: 'Технически характеристики', type: 'array', of: [{type: 'productSpec'}]}),
    defineField({name: 'compatibility', title: 'Съвместимост', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'manualPDF', title: 'Инструкция / PDF', type: 'file', options: {accept: '.pdf'}}),
    defineField({name: 'catalogPDF', title: 'Каталог / PDF', type: 'file', options: {accept: '.pdf'}}),
    defineField({name: 'relatedProducts', title: 'Свързани продукти', type: 'array', of: [{type: 'reference', to: [{type: 'product'}]}]}),
    defineField({
      name: 'relatedContent',
      title: 'Свързани услуги и материали',
      description: 'Изберете активни услуги на Florial и публикувани статии, свързани с продукта.',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'service'}, {type: 'blogPost'}]}],
    }),
    defineField({
      name: 'kitComponents',
      title: 'Състав на комплекта',
      description: 'Показва се само за продуктите от категория „Готови комплекти за автоматично поливане“. Количеството поддържа дробни стойности.',
      type: 'array',
      hidden: ({document}) => {
        const primaryCategoryId = (document?.category as {_ref?: string} | undefined)?._ref
        const categories = Array.isArray(document?.categories) ? document.categories : []
        return primaryCategoryId !== KIT_CATEGORY_ID && !categories.some((item: any) => item?._ref === KIT_CATEGORY_ID)
      },
      of: [{type: 'kitComponent'}],
    }),
    defineField({name: 'isFeatured', title: 'Препоръчан продукт', type: 'boolean'}),
    defineField({name: 'isActive', title: 'Показвай в магазина', type: 'boolean'}),
    defineField({name: 'sortOrder', title: 'Ред на показване', type: 'number'}),
    productTranslations,
    defineField({name: 'seo', title: 'SEO', type: 'productSeoFields'}),
  ],
  preview: {select: {title: 'name', subtitle: 'sku', media: 'mainImage'}},
})

const service = defineType({
  name: 'service', title: 'Услуги', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Име на услугата', type: 'string'}),
    defineField({name: 'sortOrder', title: 'Ред на показване', type: 'number', description: 'По-малката стойност се показва по-напред.'}),
    defineField({name: 'serviceCategory', title: 'Категория на услугата', type: 'string', options: {list: [
      {title: 'Ландшафтен дизайн', value: 'landscaping'},
      {title: 'Засаждане', value: 'planting'},
      {title: 'Поливни системи', value: 'irrigation'},
      {title: 'Тревни площи', value: 'lawn'},
      {title: 'Поддръжка', value: 'maintenance'},
      {title: 'Доставка', value: 'delivery'},
    ]}}),
    defineField({name: 'serviceLayout', title: 'Шаблон на страницата', type: 'string', options: {list: [
      {title: 'Стандартна услуга', value: 'standard'},
      {title: 'Доставка', value: 'delivery'},
    ]}, initialValue: 'standard'}),
    slugField(),
    defineField({name: 'sourcePageUrl', title: 'Източник / стара страница DROP', type: 'url'}),
    defineField({name: 'shortDescription', title: 'Кратко описание', type: 'text', rows: 3}),
    defineField({name: 'description', title: 'Пълно описание', type: 'array', of: [{type: 'block'}]}),
    defineField({name: 'image', title: 'Основна снимка', type: 'image', options: {hotspot: true}, fields: localizedAltFields()}),
    defineField({name: 'gallery', title: 'Галерия снимки', type: 'array', of: [{type: 'image', options: {hotspot: true}, fields: localizedAltFields()}]}),
    defineField({name: 'contentBlocks', title: 'Съдържание: снимка и текст', type: 'array', of: [{type: 'serviceContentBlock'}]}),
    defineField({name: 'advantages', title: 'Предимства', type: 'array', of: [{type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'text', title: 'Текст', type: 'text', rows: 3}),
    ]}]}),
    defineField({name: 'hero', title: 'Hero блок', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'subtitle', title: 'Подзаглавие', type: 'text', rows: 3}),
      defineField({name: 'image', title: 'Снимка', type: 'image', options: {hotspot: true}, fields: localizedAltFields()}),
    ]}),
    defineField({name: 'callToAction', title: 'Призив към действие', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'text', title: 'Текст', type: 'text', rows: 3}),
      defineField({name: 'buttonLabel', title: 'Текст на бутона', type: 'string'}),
    ]}),
    defineField({name: 'leadForm', title: 'Форма за запитване', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'submitLabel', title: 'Текст на бутона', type: 'string'}),
      defineField({name: 'successMessage', title: 'Съобщение след изпращане', type: 'text', rows: 3}),
      defineField({name: 'fields', title: 'Полета на формата', type: 'array', of: [{type: 'object', fields: [
        defineField({name: 'name', title: 'Техническо име', type: 'string'}),
        defineField({name: 'label', title: 'Етикет', type: 'string'}),
        defineField({name: 'type', title: 'Тип на полето', type: 'string', options: {list: [
          {title: 'Текст', value: 'text'},
          {title: 'Телефон', value: 'tel'},
          {title: 'Имейл', value: 'email'},
          {title: 'Дълъг текст', value: 'textarea'},
        ]}, initialValue: 'text'}),
        defineField({name: 'placeholder', title: 'Подсказка', type: 'string'}),
        defineField({name: 'required', title: 'Задължително', type: 'boolean'}),
      ]}]}),
    ]}),
    defineField({name: 'steps', title: 'Етапи на услугата', type: 'array', of: [{type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'text', title: 'Текст', type: 'text', rows: 3}),
    ]}]}),
    defineField({name: 'translations', title: 'Преводи', type: 'object', fields: [
      translationText('en', 'English'),
      translationText('ru', 'Русский'),
    ]}),
    defineField({name: 'startingPriceEUR', title: 'Начална цена (EUR)', type: 'number'}),
    defineField({name: 'isActive', title: 'Активна услуга', type: 'boolean'}),
    defineField({name: 'seo', title: 'SEO', type: 'seoFields'}),
  ],
  preview: {select: {title: 'name', media: 'image'}},
})

const deliveryZone = defineType({
  name: 'deliveryZone', title: 'Зони и тарифи за доставка', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Населено място (BG)', type: 'string', validation: Rule => Rule.required()}),
    defineField({name: 'slug', title: 'Уникален код на населеното място', type: 'string', validation: Rule => Rule.required()}),
    defineField({name: 'translations', title: 'Преводи на населеното място', type: 'object', fields: [
      defineField({name: 'en', title: 'English', type: 'object', fields: [
        defineField({name: 'name', title: 'Locality name', type: 'string'}),
        defineField({name: 'note', title: 'Delivery note', type: 'text', rows: 2}),
      ]}),
      defineField({name: 'ru', title: 'Русский', type: 'object', fields: [
        defineField({name: 'name', title: 'Название населённого пункта', type: 'string'}),
        defineField({name: 'note', title: 'Примечание о доставке', type: 'text', rows: 2}),
      ]}),
    ]}),
    defineField({name: 'distanceKm', title: 'Разстояние от Слънчев бряг (км)', type: 'number', validation: Rule => Rule.min(0)}),
    defineField({name: 'feeEUR', title: 'Цена за доставка (EUR)', type: 'number', validation: Rule => Rule.min(0)}),
    defineField({name: 'note', title: 'Бележка за доставката (BG)', type: 'text', rows: 2}),
    defineField({name: 'isActive', title: 'Активна зона', type: 'boolean', initialValue: true}),
    defineField({name: 'sortOrder', title: 'Ред на показване', type: 'number'}),
  ],
  preview: {select: {title: 'name', subtitle: 'feeEUR'}},
})

const page = defineType({
  name: 'page', title: 'Страници', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Заглавие', type: 'string'}),
    slugField('URL адрес'),
    defineField({name: 'excerpt', title: 'Кратко описание', type: 'text', rows: 3}),
    defineField({name: 'body', title: 'Съдържание', type: 'array', of: [{type: 'block'}]}),
    defineField({name: 'heroImage', title: 'Основна снимка', type: 'image', options: {hotspot: true}, fields: localizedAltFields()}),
    defineField({name: 'seo', title: 'SEO', type: 'seoFields'}),
  ],
})

const photo = defineType({
  name: 'photo', title: 'Снимки и медии', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Заглавие (BG)', type: 'string'}),
    defineField({name: 'titleEn', title: 'Title (EN)', type: 'string'}),
    defineField({name: 'titleRu', title: 'Заглавие (RU)', type: 'string'}),
    defineField({name: 'slug', title: 'Уникален код за търсене', type: 'string'}),
    defineField({name: 'image', title: 'Изображение', type: 'image', options: {hotspot: true}, fields: localizedAltFields()}),
    defineField({name: 'logoUrl', title: 'URL на логото (старо поле)', type: 'url'}),
    defineField({name: 'seoDescription', title: 'Описание за SEO (BG)', type: 'text', rows: 3}),
    defineField({name: 'category', title: 'Категория', type: 'string', options: {list: [
      {title: 'Начало', value: 'home'}, {title: 'Поливане', value: 'irrigation'},
      {title: 'Услуги', value: 'services'}, {title: 'Ландшафт', value: 'landscape'},
      {title: 'Тревен чим', value: 'lawn'}, {title: 'Друго', value: 'other'},
    ]}}),
    defineField({name: 'tags', title: 'Тагове', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'isActive', title: 'Активна', type: 'boolean'}),
  ],
  preview: {select: {title: 'title', media: 'image'}},
})

const siteSettings = defineType({
  name: 'siteSettings', title: 'Настройки на сайта', type: 'document',
  fields: [
    defineField({name: 'siteName', title: 'Име на сайта', type: 'string'}),
    defineField({name: 'logo', title: 'Лого на сайта', type: 'image', options: {hotspot: true}, fields: localizedAltFields()}),
    defineField({name: 'logoUrl', title: 'URL на логото (резервно)', type: 'url'}),
    defineField({name: 'defaultLocale', title: 'Основен език', type: 'string', initialValue: 'bg'}),
    defineField({name: 'supportedLocales', title: 'Езици', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'contactEmail', title: 'Имейл за контакт', type: 'string'}),
    defineField({name: 'contactPhone', title: 'Телефон', type: 'string'}),
    defineField({name: 'address', title: 'Адрес', type: 'text', rows: 3}),
    defineField({name: 'socialLinks', title: 'Социални мрежи', type: 'array', of: [{type: 'object', fields: [
      defineField({name: 'label', title: 'Име', type: 'string'}),
      defineField({name: 'url', title: 'URL', type: 'url'}),
    ]}]}),
  ],
})

const plantCategory = defineType({
  name: 'category', title: 'Категории растения', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Име на категорията (BG)', type: 'string'}),
    slugField(),
    defineField({name: 'description', title: 'Описание', type: 'text', rows: 4}),
    defineField({name: 'image', title: 'Снимка', type: 'image', options: {hotspot: true}, fields: [...localizedAltFields(), ...localizedImageTitleFields()]}),
    defineField({name: 'externalImageUrl', title: 'Външен URL на снимката', type: 'url'}),
    defineField({name: 'parent', title: 'Родителска категория', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'sortOrder', title: 'Ред на показване', type: 'number'}),
    defineField({name: 'translations', title: 'Преводи', type: 'object', fields: [
      defineField({name: 'en', title: 'English', type: 'object', fields: [
        defineField({name: 'name', title: 'Name', type: 'string'}), defineField({name: 'description', title: 'Description', type: 'text'}),
        defineField({name: 'seo', title: 'SEO', type: 'categorySeoFields'}),
      ]}),
      defineField({name: 'ru', title: 'Русский', type: 'object', fields: [
        defineField({name: 'name', title: 'Название', type: 'string'}), defineField({name: 'description', title: 'Описание', type: 'text'}),
        defineField({name: 'seo', title: 'SEO', type: 'categorySeoFields'}),
      ]}),
    ]}),
    defineField({name: 'helpBlock', title: 'Блок за помощ при избор и засаждане на растения', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие (BG)', type: 'string'}),
      defineField({name: 'text', title: 'Текст (BG)', type: 'text', rows: 8}),
      defineField({name: 'buttonLabel', title: 'Текст на бутона (BG)', type: 'string'}),
      defineField({name: 'buttonUrl', title: 'Вътрешен адрес на услугата или статията', type: 'string', description: 'Използвайте относителен адрес, започващ с /services/ или /blog/. Ако е празно, сайтът използва общата услуга за засаждане на растения.'}),
      defineField({name: 'translations', title: 'Преводи', type: 'object', fields: ['en', 'ru'].map((language) => defineField({
        name: language, title: language === 'en' ? 'English' : 'Русский', type: 'object', fields: [
          defineField({name: 'title', title: language === 'en' ? 'Title' : 'Заголовок', type: 'string'}),
          defineField({name: 'text', title: language === 'en' ? 'Text' : 'Текст', type: 'text', rows: 8}),
          defineField({name: 'buttonLabel', title: language === 'en' ? 'Button label' : 'Подпись кнопки', type: 'string'}),
        ],
      }))}),
    ]}),
    defineField({name: 'seo', title: 'SEO (български)', type: 'categorySeoFields'}),
  ],
  preview: {select: {title: 'name', media: 'image'}},
})


const plantCare = defineType({
  name: 'plantCare',
  title: 'Грижи и характеристики на растението',
  type: 'object',
  fields: [
    defineField({
      name: 'light',
      title: 'Светлина',
      description: 'Предпочитано изложение: пълно слънце, полусянка или сянка.',
      type: 'string',
      options: {list: [
        {title: 'Пълно слънце', value: 'sun'},
        {title: 'Полусянка', value: 'partialShade'},
        {title: 'Сянка', value: 'shade'},
      ]},
      validation: Rule => Rule.custom(value => value == null || ['sun', 'partialShade', 'shade'].includes(String(value)) || 'Изберете една от посочените стойности за светлина.'),
    }),
    defineField({
      name: 'waterNeeds',
      title: 'Нужда от поливане',
      description: 'Обичайна потребност от вода при подходящи условия на отглеждане.',
      type: 'string',
      options: {list: [
        {title: 'Ниска', value: 'low'},
        {title: 'Средна', value: 'medium'},
        {title: 'Висока', value: 'high'},
      ]},
      validation: Rule => Rule.custom(value => value == null || ['low', 'medium', 'high'].includes(String(value)) || 'Изберете ниска, средна или висока нужда от поливане.'),
    }),
    defineField({
      name: 'minWinterTempC',
      title: 'Минимална зимна температура (°C)',
      description: 'Минималната температура, която растението може да понесе според проверен ботанически източник.',
      type: 'number',
      validation: Rule => Rule.min(-60).max(60),
    }),
    defineField({
      name: 'blackSeaCoast',
      title: 'Пригодност за Черноморието',
      description: 'Оценка за отглеждане при климатичните условия на българското Черноморие.',
      type: 'string',
      options: {list: [
        {title: 'Подходящо', value: 'suitable'},
        {title: 'Неподходящо', value: 'notSuitable'},
        {title: 'Непроверено', value: 'needsVerification'},
      ]},
      validation: Rule => Rule.custom(value => value == null || ['suitable', 'notSuitable', 'needsVerification'].includes(String(value)) || 'Изберете валидна оценка за Черноморието.'),
      initialValue: 'needsVerification',
    }),
    defineField({
      name: 'adultHeightCm',
      title: 'Височина на възрастното растение (см)',
      description: 'Очаквана височина на зряло растение при подходящи условия.',
      type: 'number',
      validation: Rule => Rule.min(0),
    }),
    defineField({
      name: 'foliageType',
      title: 'Тип листна маса',
      description: 'Посочете дали растението е вечнозелено или листопадно.',
      type: 'string',
      options: {list: [
        {title: 'Вечнозелено', value: 'evergreen'},
        {title: 'Листопадно', value: 'deciduous'},
      ]},
      validation: Rule => Rule.custom(value => value == null || ['evergreen', 'deciduous'].includes(String(value)) || 'Изберете вечнозелено или листопадно растение.'),
    }),
    defineField({
      name: 'floweringSeason',
      title: 'Сезон на цъфтеж',
      description: 'Един или повече основни сезони на цъфтеж.',
      type: 'array',
      of: [{type: 'string', options: {list: [
        {title: 'Пролет', value: 'spring'},
        {title: 'Лято', value: 'summer'},
        {title: 'Есен', value: 'autumn'},
        {title: 'Зима', value: 'winter'},
      ]}}],
      validation: Rule => Rule.unique().max(4).custom(value => !Array.isArray(value) || value.every(item => ['spring', 'summer', 'autumn', 'winter'].includes(String(item))) || 'Изберете валиден сезон на цъфтеж.'),
    }),
    defineField({
      name: 'plantingSeason',
      title: 'Сезон на засаждане',
      description: 'Препоръчителен сезон или сезони за засаждане според вида и условията.',
      type: 'array',
      of: [{type: 'string', options: {list: [
        {title: 'Пролет', value: 'spring'},
        {title: 'Лято', value: 'summer'},
        {title: 'Есен', value: 'autumn'},
        {title: 'Зима', value: 'winter'},
        {title: 'През цялата година', value: 'yearRound'},
      ]}}],
      validation: Rule => Rule.unique().max(5).custom(value => !Array.isArray(value) || value.every(item => ['spring', 'summer', 'autumn', 'winter', 'yearRound'].includes(String(item))) || 'Изберете валиден сезон за засаждане.'),
    }),
    defineField({
      name: 'saleFormat',
      title: 'Размер при продажба',
      description: 'Размер на конкретното растение при предлагане за продажба.',
      type: 'object',
      fields: [
        defineField({
          name: 'containerVolumeL',
          title: 'Обем на контейнера (литри)',
          description: 'Обем на саксията или контейнера в литри.',
          type: 'number',
          validation: Rule => Rule.min(0.1).max(10000),
        }),
        defineField({
          name: 'saleHeightCm',
          title: 'Височина при продажба (см)',
          description: 'Височина на растението при продажба в сантиметри.',
          type: 'number',
          validation: Rule => Rule.min(0).max(10000),
        }),
      ],
    }),
  ],
})


const plantSaleVariant = defineType({
  name: 'plantSaleVariant',
  title: 'Вариант за продажба на растение',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Размер / вариант (BG)', description: 'Например: Компактно, Средно, Голямо или конкретен търговски размер.', type: 'string', validation: Rule => Rule.required().min(2).max(100)}),
    defineField({name: 'nameEn', title: 'Размер / вариант (EN)', type: 'string'}),
    defineField({name: 'nameRu', title: 'Размер / вариант (RU)', type: 'string'}),
    defineField({name: 'sku', title: 'Артикул на варианта', type: 'string'}),
    defineField({name: 'saleHeightCm', title: 'Височина при продажба (см)', type: 'number', validation: Rule => Rule.min(0).max(10000)}),
    defineField({name: 'containerVolumeL', title: 'Обем на контейнера (литри)', type: 'number', validation: Rule => Rule.min(0.1).max(10000)}),
    defineField({name: 'priceEUR', title: 'Цена с ДДС (EUR)', description: 'Крайна продажна цена за този вариант.', type: 'number', validation: Rule => Rule.min(0.01)}),
    defineField({name: 'oldPriceEUR', title: 'Стара цена (EUR)', type: 'number', validation: Rule => Rule.min(0)}),
    defineField({name: 'stockStatus', title: 'Наличност на варианта', type: 'string', options: {list: [
      {title: 'В наличност', value: 'inStock'},
      {title: 'По заявка', value: 'onRequest'},
      {title: 'Изчерпан', value: 'outOfStock'},
    ]}}),
    defineField({name: 'stockQuantity', title: 'Количество на склад', type: 'number', validation: Rule => Rule.integer().min(0)}),
  ],
  preview: {select: {title: 'name', subtitle: 'priceEUR'}},
})

const plantCareGuideBlock = {
  type: 'block',
  styles: [
    {title: 'Параграф', value: 'normal'},
    {title: 'Заглавие 2', value: 'h2'},
    {title: 'Заглавие 3', value: 'h3'},
  ],
  lists: [
    {title: 'Неномериран списък', value: 'bullet'},
    {title: 'Номериран списък', value: 'number'},
  ],
  marks: {
    decorators: [
      {title: 'Удебелен', value: 'strong'},
      {title: 'Курсив', value: 'em'},
    ],
  },
}

const plantProductTypes = [
  {title: 'Растение (съществуващ тип)', value: 'plant'},
  {title: 'Дърво', value: 'tree'},
  {title: 'Храст', value: 'shrub'},
  {title: 'Цвете', value: 'flower'},
  {title: 'Многогодишно растение', value: 'perennial'},
  {title: 'Стайно растение', value: 'indoor'},
  {title: 'Цитрус', value: 'citrus'},
  {title: 'Палма', value: 'palm'},
  {title: 'Иглолистно растение', value: 'conifer'},
  {title: 'Плодово растение', value: 'fruit'},
  {title: 'Сукулент', value: 'succulent'},
  {title: 'Катерливо растение', value: 'climber'},
  {title: 'Декоративна трева', value: 'ornamentalGrass'},
  {title: 'Почвопокривно растение', value: 'groundcover'},
  {title: 'Луковично растение', value: 'bulb'},
  {title: 'Билка', value: 'herb'},
  {title: 'Водно растение', value: 'aquatic'},
  {title: 'Друг вид растение', value: 'other'},
]

const plantProduct = defineType({
  name: 'product', title: 'Растения', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Име на растението (BG)', type: 'string', validation: r => r.required()}),
    slugField(),
    defineField({name: 'sku', title: 'Артикул', type: 'string'}),
    defineField({
      name: 'productType',
      title: 'Тип на растението',
      description: 'Ботаническа или търговска група на растението. Стойността plant се запазва за съществуващите продукти.',
      type: 'string',
      options: {list: plantProductTypes},
      validation: Rule => Rule.valid(plantProductTypes.map(item => item.value)),
    }),
    defineField({name: 'scientificName', title: 'Ботаническо име', type: 'string'}),
    defineField({name: 'category', title: 'Основна категория', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'categories', title: 'Категории', type: 'array', of: [{type: 'reference', to: [{type: 'category'}]}]}),
    defineField({name: 'shortDescription', title: 'Кратко описание (BG)', type: 'text', rows: 3}),
    defineField({
      name: 'plantCare',
      title: 'Грижи и характеристики',
      description: 'Структурирани характеристики за филтриране и представяне на растението.',
      type: 'plantCare',
    }),
    defineField({
      name: 'careGuide',
      title: 'Ръководство за отглеждане (BG)',
      description: 'Подробни инструкции за засаждане, поливане, подрязване, торене и зимна защита на български език.',
      type: 'array',
      of: [plantCareGuideBlock],
      validation: Rule => Rule.max(100),
    }),
    defineField({
      name: 'recommendedIrrigation',
      title: 'Препоръчителна система за поливане',
      description: 'Метод за поливане и незадължителен slug на съответен продукт или комплект от каталога за поливане.',
      type: 'object',
      fields: [
        defineField({
          name: 'irrigationType',
          title: 'Тип поливане',
          description: 'Препоръчителен метод за напояване на растението.',
          type: 'string',
          options: {list: [
            {title: 'Капково напояване', value: 'drip'},
            {title: 'Ротаторни дюзи', value: 'rotator'},
            {title: 'Кореново напояване', value: 'root'},
            {title: 'Мъглуване', value: 'mist'},
          ]},
          validation: Rule => Rule.custom(value => value == null || ['drip', 'rotator', 'root', 'mist'].includes(String(value)) || 'Изберете валиден тип поливане.'),
        }),
        defineField({
          name: 'productSlug',
          title: 'Slug на продукт или комплект',
          description: 'Точният slug на продукт или комплект в dataset production. Не е Sanity reference.',
          type: 'string',
          validation: Rule => Rule.max(120).custom(value => value == null || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value)) || 'Въведете валиден slug с малки латински букви и тирета.'),
        }),
      ],
    }),
    defineField({
      name: 'relatedContentBySlug',
      title: 'Свързани услуги и статии',
      description: 'Връзки към услуги и статии в блога чрез техния slug, без cross-dataset reference.',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({
            name: 'contentType',
            title: 'Тип съдържание',
            description: 'Изберете дали връзката води към услуга или статия в блога.',
            type: 'string',
            options: {list: [
              {title: 'Услуга', value: 'service'},
              {title: 'Статия в блога', value: 'blogPost'},
            ]},
            validation: Rule => Rule.required().custom(value => ['service', 'blogPost'].includes(String(value)) || 'Изберете услуга или статия в блога.'),
          }),
          defineField({
            name: 'slug',
            title: 'Slug на страницата',
            description: 'Точният slug на услугата или статията.',
            type: 'string',
            validation: Rule => Rule.required().max(160).custom(value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value)) || 'Въведете валиден slug с малки латински букви и тирета.'),
          }),
          defineField({
            name: 'label',
            title: 'Текст на връзката',
            description: 'Незадължителен текст на връзката. Ако е празен, frontend използва заглавието на страницата.',
            type: 'string',
            validation: Rule => Rule.max(100),
          }),
        ],
      }],
      validation: Rule => Rule.max(10).unique(),
    }),

    defineField({name: 'description', title: 'Пълно описание (BG)', type: 'richDescription'}),
    defineField({name: 'mainImage', title: 'Основна снимка', type: 'image', options: {hotspot: true}, fields: localizedAltFields()}),
    defineField({name: 'gallery', title: 'Допълнителни снимки', type: 'array', of: [{type: 'image', options: {hotspot: true}, fields: localizedAltFields()}]}),
    defineField({
      name: 'saleVariants',
      title: 'Размери и варианти за продажба',
      description: 'Добавете отделен вариант за всеки реално предлаган размер. Посочете измерената височина, контейнера, крайната цена и наличността. Не попълвайте предполагаеми стойности.',
      type: 'array',
      of: [{type: 'plantSaleVariant'}],
      validation: Rule => Rule.max(30),
    }),
    defineField({name: 'priceEUR', title: 'Цена (EUR)', type: 'number'}),
    defineField({
      name: 'oldPriceEUR',
      title: 'Стара цена (EUR)',
      description: 'Предишна цена преди намалението. Оставете празно, ако няма намаление.',
      type: 'number',
      validation: Rule => Rule.min(0).custom((value, context) => {
        if (value == null) return true
        const document = context.document as {priceEUR?: number}
        if (typeof document.priceEUR !== 'number') return 'Първо въведете текущата цена.'
        return value > document.priceEUR ? true : 'Старата цена трябва да е по-висока от текущата цена.'
      }),
    }),
    defineField({
      name: 'isFeatured',
      title: 'Препоръчано растение',
      description: 'Отбележете, ако растението трябва да се показва сред препоръчаните продукти.',
      type: 'boolean',
      initialValue: false,
      validation: Rule => Rule.custom(value => value === undefined || typeof value === 'boolean' || 'Стойността трябва да бъде Да или Не.'),
    }),
    defineField({name: 'vatIncluded', title: 'Цената включва ДДС', description: 'За крайните потребителски цени това поле трябва да остане включено.', type: 'boolean', initialValue: true}),
    defineField({name: 'stockStatus', title: 'Наличност', type: 'string', options: {list: [
      {title: 'В наличност', value: 'inStock'}, {title: 'По заявка', value: 'onRequest'}, {title: 'Изчерпан', value: 'outOfStock'},
    ]}}),
    defineField({name: 'stockQuantity', title: 'Количество на склад', type: 'number'}),
    defineField({name: 'isActive', title: 'Показвай в магазина', type: 'boolean'}),
    defineField({name: 'sortOrder', title: 'Ред на показване', type: 'number'}),
    defineField({name: 'sourcePageUrl', title: 'Източник / референтна страница', type: 'url'}),
    defineField({name: 'sourceImageGroup', title: 'Група на източника на снимката', type: 'string'}),
    defineField({name: 'plantDetails', title: 'Подробности за растението', type: 'object', fields: [
      defineField({
        name: 'scientificName',
        title: 'Ботаническо име (остаряло)',
        description: 'ОСТАРЯЛО ПОЛЕ: използвайте основното поле „Ботаническо име“ на продукта. Съществуващите стойности се запазват до приключване на миграцията.',
        type: 'string',
        deprecated: {reason: 'Използвайте кореновото поле scientificName. Стойностите не се изтриват.'},
        readOnly: true,
        hidden: true,
      }),
      defineField({name: 'availabilityNote', title: 'Бележка за наличност', type: 'text', rows: 3}),
    ]}),
    defineField({name: 'seo', title: 'SEO (BG)', type: 'productSeoFields'}),
    defineField({name: 'translations', title: 'Преводи', type: 'object', fields: [
      ...['bg', 'en', 'ru'].map((lang) => defineField({name: lang, title: ({bg: 'Български', en: 'English', ru: 'Русский'} as Record<string,string>)[lang], type: 'object', fields: [
        defineField({name: 'name', title: 'Име / Name / Название', type: 'string'}),
        defineField({name: 'shortDescription', title: 'Кратко описание', type: 'text', rows: 3}),
        defineField({name: 'description', title: 'Пълно описание', type: 'richDescription'}),
        defineField({name: 'seo', title: 'SEO за езика', type: 'productSeoFields'}),
      ]})),
    ]}),
  ],
  preview: {select: {title: 'name', subtitle: 'scientificName', media: 'mainImage'}},
})

const youtubeEmbed = defineType({
  name: 'youtubeEmbed', title: 'YouTube видео', type: 'object',
  fields: [
    defineField({name: 'url', title: 'URL на видеото', type: 'url', validation: (Rule) => Rule.required()}),
    defineField({name: 'title', title: 'Заглавие на видеото', type: 'string'}),
    defineField({name: 'caption', title: 'Надпис', type: 'string'}),
  ],
})
const blogPost = defineType({
  name: 'blogPost', title: 'Статии в блога', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Заглавие (BG, за преглед)', type: 'string'}),
    defineField({name: 'slug', title: 'URL адрес (slug)', type: 'slug', options: {source: 'translations.bg.title', maxLength: 96}}),
    defineField({name: 'publishedAt', title: 'Дата на публикуване', type: 'datetime'}),
    defineField({name: 'sourceUrl', title: 'Източник / оригинална публикация', type: 'url'}),
    defineField({name: 'isPublished', title: 'Публикувана', type: 'boolean', initialValue: false}),
    defineField({name: 'cover', title: 'Основна снимка', type: 'image', options: {hotspot: true}, fields: [
      ...localizedAltFields(),
      defineField({name: 'caption', title: 'Надпис', type: 'string'}),
    ]}),
    defineField({name: 'gallery', title: 'Допълнителни снимки', type: 'array', of: [{type: 'image', options: {hotspot: true}, fields: [
      ...localizedAltFields(),
      defineField({name: 'caption', title: 'Надпис', type: 'string'}),
    ]}]}),
    defineField({name: 'tags', title: 'Тагове', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'translations', title: 'Езикови версии', type: 'object', fields: ['bg', 'ru', 'en'].map((language) =>
      defineField({name: language, title: language, type: 'object', fields: [
        defineField({name: 'title', title: 'Заглавие', type: 'string'}),
        defineField({name: 'shortDescription', title: 'Кратко описание', type: 'text', rows: 3}),
        defineField({name: 'body', title: 'Текст на статията', type: 'array', of: [
          {type: 'block', styles: [{title: 'Параграф', value: 'normal'}, {title: 'Заглавие 2', value: 'h2'}, {title: 'Заглавие 3', value: 'h3'}, {title: 'Заглавие 4', value: 'h4'}, {title: 'Цитат', value: 'blockquote'}], lists: [{title: 'Неномериран списък', value: 'bullet'}, {title: 'Номериран списък', value: 'number'}], marks: {decorators: [{title: 'Удебелен', value: 'strong'}, {title: 'Курсив', value: 'em'}, {title: 'Подчертан', value: 'underline'}], annotations: [{name: 'link', type: 'object', title: 'Връзка', fields: [{name: 'href', type: 'url', title: 'URL', validation: (Rule) => Rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']})}, {name: 'blank', type: 'boolean', title: 'Отваряне в нов прозорец', initialValue: true}]}]}},
          {type: 'image', options: {hotspot: true}, fields: [...localizedAltFields(), {name: 'caption', type: 'string', title: 'Надпис'}]},
          {type: 'youtubeEmbed', title: 'YouTube видео'},
        ]}),
        defineField({name: 'coverAlt', title: 'Alt на обложката', type: 'string'}),
        defineField({name: 'seoTitle', title: 'SEO title', type: 'string'}),
        defineField({name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3}),
      ]}))}),
  ],
  preview: {select: {title: 'translations.bg.title', subtitle: 'publishedAt', media: 'cover'}},
})
export const irrigationSchemaTypes = [
  seoFields, productSeoFields, categorySeoFields, richDescription, productSpec, kitComponent, serviceContentBlock, brand, irrigationCategory,
  irrigationProduct, service, deliveryZone, youtubeEmbed, blogPost, page, photo, siteSettings,
]
export const plantSchemaTypes = [seoFields, productSeoFields, categorySeoFields, richDescription, plantCare, plantSaleVariant, plantCategory, plantProduct]
