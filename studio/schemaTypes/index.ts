import {defineField, defineType} from 'sanity'

const slugField = (title = 'URL адрес') => defineField({
  name: 'slug',
  title: `${title} (slug)`,
  type: 'slug',
  options: {source: 'name', maxLength: 96},
})

const seoFields = defineType({
  name: 'seoFields', title: 'SEO', type: 'object',
  fields: [
    defineField({name: 'metaTitle', title: 'Meta title', type: 'string'}),
    defineField({name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3}),
    defineField({name: 'noIndex', title: 'Не индексирай страницата', type: 'boolean', initialValue: false}),
    defineField({name: 'keywords', title: 'Ключови думи', type: 'array', of: [{type: 'string'}]}),
  ],
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
    defineField({name: 'image', title: 'Снимка', type: 'image', options: {hotspot: true}}),
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
      defineField({name: 'seo', title: 'SEO за езика', type: 'seoFields'}),
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
      defineField({name: 'description', title: language === 'en' ? 'Description' : 'Описание', type: 'text', rows: 8}),
      defineField({name: 'seo', title: 'SEO за езика', type: 'seoFields'}),
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
    defineField({name: 'image', title: 'Снимка', type: 'image', options: {hotspot: true}}),
    defineField({name: 'description', title: 'Описание', type: 'text', rows: 4}),
    defineField({name: 'sortOrder', title: 'Ред на показване', type: 'number'}),
    categoryTranslations,
    defineField({name: 'helpBlock', title: 'Блок за помощ при избор на поливна система', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие (BG)', type: 'string'}),
      defineField({name: 'text', title: 'Текст (BG)', type: 'text', rows: 4}),
      defineField({name: 'buttonLabel', title: 'Текст на бутона (BG)', type: 'string'}),
      defineField({name: 'translations', title: 'Преводи', type: 'object', fields: ['en', 'ru'].map((language) => defineField({
        name: language, title: language === 'en' ? 'English' : 'Русский', type: 'object', fields: [
          defineField({name: 'title', title: language === 'en' ? 'Title' : 'Заголовок', type: 'string'}),
          defineField({name: 'text', title: language === 'en' ? 'Text' : 'Текст', type: 'text', rows: 4}),
          defineField({name: 'buttonLabel', title: language === 'en' ? 'Button label' : 'Подпись кнопки', type: 'string'}),
        ],
      }))}),
    ]}),
    defineField({name: 'seo', title: 'SEO', type: 'seoFields'}),
  ],
  preview: {select: {title: 'name', media: 'image'}},
})

const brand = defineType({
  name: 'brand', title: 'Марки', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Име на марката', type: 'string'}),
    slugField('URL адрес'),
    defineField({name: 'logo', title: 'Лого', type: 'image', options: {hotspot: true}}),
    defineField({name: 'description', title: 'Описание', type: 'text', rows: 4}),
    defineField({name: 'website', title: 'Официален сайт', type: 'url'}),
    defineField({name: 'isFeatured', title: 'Препоръчана марка', type: 'boolean'}),
  ],
  preview: {select: {title: 'name', media: 'logo'}},
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
    defineField({name: 'description', title: 'Пълно описание', type: 'array', of: [{type: 'block'}]}),
    defineField({name: 'mainImage', title: 'Основна снимка', type: 'image', options: {hotspot: true}}),
    defineField({name: 'gallery', title: 'Допълнителни снимки', type: 'array', of: [{type: 'image', options: {hotspot: true}}]}),
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
    defineField({name: 'isFeatured', title: 'Препоръчан продукт', type: 'boolean'}),
    defineField({name: 'isActive', title: 'Показвай в магазина', type: 'boolean'}),
    defineField({name: 'sortOrder', title: 'Ред на показване', type: 'number'}),
    productTranslations,
    defineField({name: 'seo', title: 'SEO', type: 'seoFields'}),
  ],
  preview: {select: {title: 'name', subtitle: 'sku', media: 'mainImage'}},
})

const service = defineType({
  name: 'service', title: 'Услуги', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Име на услугата', type: 'string'}),
    // Plain text by request: no slug generator and no slug validation.
    defineField({name: 'slug', title: 'URL адрес (обикновен текст)', type: 'string'}),
    defineField({name: 'sourcePageUrl', title: 'Източник / стара страница DROP', type: 'url'}),
    defineField({name: 'shortDescription', title: 'Кратко описание', type: 'text', rows: 3}),
    defineField({name: 'description', title: 'Пълно описание', type: 'array', of: [{type: 'block'}]}),
    defineField({name: 'image', title: 'Основна снимка', type: 'image', options: {hotspot: true}}),
    defineField({name: 'gallery', title: 'Галерия снимки', type: 'array', of: [{type: 'image', options: {hotspot: true}}]}),
    defineField({name: 'contentBlocks', title: 'Съдържание: снимка и текст', type: 'array', of: [{type: 'serviceContentBlock'}]}),
    defineField({name: 'advantages', title: 'Предимства', type: 'array', of: [{type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'text', title: 'Текст', type: 'text', rows: 3}),
    ]}]}),
    defineField({name: 'hero', title: 'Hero блок', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'subtitle', title: 'Подзаглавие', type: 'text', rows: 3}),
      defineField({name: 'image', title: 'Снимка', type: 'image', options: {hotspot: true}}),
    ]}),
    defineField({name: 'callToAction', title: 'Призив към действие', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'text', title: 'Текст', type: 'text', rows: 3}),
      defineField({name: 'buttonLabel', title: 'Текст на бутона', type: 'string'}),
    ]}),
    defineField({name: 'leadForm', title: 'Форма за запитване', type: 'object', fields: [
      defineField({name: 'title', title: 'Заглавие', type: 'string'}),
      defineField({name: 'submitLabel', title: 'Текст на бутона', type: 'string'}),
      defineField({name: 'fields', title: 'Полета на формата', type: 'array', of: [{type: 'object', fields: [
        defineField({name: 'name', title: 'Техническо име', type: 'string'}),
        defineField({name: 'label', title: 'Етикет', type: 'string'}),
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

const page = defineType({
  name: 'page', title: 'Страници', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Заглавие', type: 'string'}),
    slugField('URL адрес'),
    defineField({name: 'excerpt', title: 'Кратко описание', type: 'text', rows: 3}),
    defineField({name: 'body', title: 'Съдържание', type: 'array', of: [{type: 'block'}]}),
    defineField({name: 'heroImage', title: 'Основна снимка', type: 'image', options: {hotspot: true}}),
    defineField({name: 'seo', title: 'SEO', type: 'seoFields'}),
  ],
})

const photo = defineType({
  name: 'photo', title: 'Снимки и медии', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Заглавие', type: 'string'}),
    defineField({name: 'slug', title: 'Уникален код за търсене', type: 'string'}),
    defineField({name: 'image', title: 'Изображение', type: 'image', options: {hotspot: true}}),
    defineField({name: 'logoUrl', title: 'URL на логото (старо поле)', type: 'url'}),
    defineField({name: 'seoDescription', title: 'Описание за SEO', type: 'text', rows: 3}),
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
    defineField({name: 'logo', title: 'Лого на сайта', type: 'image', options: {hotspot: true}}),
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
    defineField({name: 'image', title: 'Снимка', type: 'image', options: {hotspot: true}}),
    defineField({name: 'externalImageUrl', title: 'Външен URL на снимката', type: 'url'}),
    defineField({name: 'parent', title: 'Родителска категория', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'sortOrder', title: 'Ред на показване', type: 'number'}),
    defineField({name: 'translations', title: 'Преводи', type: 'object', fields: [
      defineField({name: 'en', title: 'English', type: 'object', fields: [
        defineField({name: 'name', title: 'Name', type: 'string'}), defineField({name: 'description', title: 'Description', type: 'text'}),
        defineField({name: 'seo', title: 'SEO', type: 'seoFields'}),
      ]}),
      defineField({name: 'ru', title: 'Русский', type: 'object', fields: [
        defineField({name: 'name', title: 'Название', type: 'string'}), defineField({name: 'description', title: 'Описание', type: 'text'}),
        defineField({name: 'seo', title: 'SEO', type: 'seoFields'}),
      ]}),
    ]}),
  ],
  preview: {select: {title: 'name', media: 'image'}},
})

const plantProduct = defineType({
  name: 'product', title: 'Растения', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Име на растението (BG)', type: 'string', validation: r => r.required()}),
    slugField(),
    defineField({name: 'sku', title: 'Артикул', type: 'string'}),
    defineField({name: 'productType', title: 'Тип продукт', type: 'string'}),
    defineField({name: 'scientificName', title: 'Ботаническо име', type: 'string'}),
    defineField({name: 'category', title: 'Основна категория', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'categories', title: 'Категории', type: 'array', of: [{type: 'reference', to: [{type: 'category'}]}]}),
    defineField({name: 'shortDescription', title: 'Кратко описание (BG)', type: 'text', rows: 3}),
    defineField({name: 'description', title: 'Пълно описание (BG)', type: 'text', rows: 8}),
    defineField({name: 'mainImage', title: 'Основна снимка', type: 'image', options: {hotspot: true}}),
    defineField({name: 'gallery', title: 'Допълнителни снимки', type: 'array', of: [{type: 'image', options: {hotspot: true}}]}),
    defineField({name: 'priceEUR', title: 'Цена (EUR)', type: 'number'}),
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
      defineField({name: 'scientificName', title: 'Ботаническо име', type: 'string'}),
      defineField({name: 'availabilityNote', title: 'Бележка за наличност', type: 'text', rows: 3}),
    ]}),
    defineField({name: 'seo', title: 'SEO (BG)', type: 'object', fields: [
      defineField({name: 'title', title: 'SEO заглавие', type: 'string'}),
      defineField({name: 'description', title: 'SEO описание', type: 'text', rows: 3}),
    ]}),
    defineField({name: 'translations', title: 'Преводи', type: 'object', fields: [
      ...['bg', 'en', 'ru'].map((lang) => defineField({name: lang, title: ({bg: 'Български', en: 'English', ru: 'Русский'} as Record<string,string>)[lang], type: 'object', fields: [
        defineField({name: 'name', title: 'Име / Name / Название', type: 'string'}),
        defineField({name: 'shortDescription', title: 'Кратко описание', type: 'text', rows: 3}),
        defineField({name: 'description', title: 'Пълно описание', type: 'text', rows: 8}),
        defineField({name: 'seo', title: 'SEO за езика', type: 'seoFields'}),
      ]})),
    ]}),
  ],
  preview: {select: {title: 'name', subtitle: 'scientificName', media: 'mainImage'}},
})

const blogPost = defineType({
  name: 'blogPost', title: 'Статии в блога', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Заглавие (BG, за преглед)', type: 'string'}),
    slugField('URL адрес'),
    defineField({name: 'publishedAt', title: 'Дата на публикуване', type: 'datetime'}),
    defineField({name: 'sourceUrl', title: 'Източник / оригинална публикация', type: 'url'}),
    defineField({name: 'isPublished', title: 'Публикувана', type: 'boolean', initialValue: false}),
    defineField({name: 'cover', title: 'Основна снимка', type: 'image', options: {hotspot: true}, fields: [
      defineField({name: 'alt', title: 'Alt текст', type: 'string'}),
      defineField({name: 'caption', title: 'Надпис', type: 'string'}),
    ]}),
    defineField({name: 'gallery', title: 'Допълнителни снимки', type: 'array', of: [{type: 'image', options: {hotspot: true}, fields: [
      defineField({name: 'alt', title: 'Alt текст', type: 'string'}),
      defineField({name: 'caption', title: 'Надпис', type: 'string'}),
    ]}]}),
    defineField({name: 'tags', title: 'Тагове', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'translations', title: 'Езикови версии', type: 'object', fields: ['bg', 'ru', 'en'].map((language) =>
      defineField({name: language, title: language, type: 'object', fields: [
        defineField({name: 'title', title: 'Заглавие', type: 'string'}),
        defineField({name: 'shortDescription', title: 'Кратко описание', type: 'text', rows: 3}),
        defineField({name: 'body', title: 'Текст на статията', type: 'array', of: [
          {type: 'block', styles: [{title: 'Параграф', value: 'normal'}, {title: 'Заглавие 2', value: 'h2'}, {title: 'Заглавие 3', value: 'h3'}, {title: 'Заглавие 4', value: 'h4'}, {title: 'Цитат', value: 'blockquote'}], lists: [{title: 'Неномериран списък', value: 'bullet'}, {title: 'Номериран списък', value: 'number'}], marks: {decorators: [{title: 'Удебелен', value: 'strong'}, {title: 'Курсив', value: 'em'}, {title: 'Подчертан', value: 'underline'}], annotations: [{name: 'link', type: 'object', title: 'Връзка', fields: [{name: 'href', type: 'url', title: 'URL'}, {name: 'blank', type: 'boolean', title: 'Отваряне в нов прозорец', initialValue: true}]}]}},
          {type: 'image', options: {hotspot: true}, fields: [{name: 'alt', type: 'string', title: 'Alt текст'}, {name: 'caption', type: 'string', title: 'Надпис'}]},
        ]}),
        defineField({name: 'coverAlt', title: 'Alt на обложката', type: 'string'}),
        defineField({name: 'seoTitle', title: 'SEO title', type: 'string'}),
        defineField({name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3}),
      ]}))),
  ],
  preview: {select: {title: 'title', subtitle: 'publishedAt', media: 'cover'}},
})
export const irrigationSchemaTypes = [
  seoFields, productSpec, serviceContentBlock, brand, irrigationCategory,
  irrigationProduct, service, blogPost, page, photo, siteSettings,
]
export const plantSchemaTypes = [seoFields, plantCategory, plantProduct]
