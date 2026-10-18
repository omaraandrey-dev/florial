export default {
  name: 'photoLibrary',
  title: 'База фотографий (SEO)',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Название / Описание для внутреннего поиска',
      type: 'string',
      description: 'Например: Логотип шапки, Фото газона для главной и т.д.',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Изображение',
      type: 'image',
      options: {
        hotspot: true, // Включает кадрирование и фокус
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'alt',
      title: 'Alt-текст (SEO для поисковиков)',
      type: 'string',
      description: 'Опишите словами, что изображено на фото для Google/Яндекс',
      validation: (Rule: any) => Rule.required().warning('Желательно заполнить для SEO'),
    },
    {
      name: 'tag',
      title: 'Метка использования',
      type: 'string',
      options: {
        list: [
          { title: 'Логотип шапки', value: 'header-logo' },
          { title: 'Баннер главной страницы', value: 'hero-banner' },
          { title: 'Галерея работ', value: 'gallery' },
          { title: 'Общее / Прочее', value: 'general' },
        ],
      },
    },
  ],
}
