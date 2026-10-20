import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Language = 'bg' | 'en' | 'ru'

const translations: Record<string, Record<Language, string>> = {
  'Начало': { bg: 'Начало', en: 'Home', ru: 'Главная' },
  'Продукти': { bg: 'Продукти', en: 'Products', ru: 'Товары' },
  'Услуги': { bg: 'Услуги', en: 'Services', ru: 'Услуги' },
  'Контакти': { bg: 'Контакти', en: 'Contacts', ru: 'Контакты' },
  'Количка': { bg: 'Количка', en: 'Cart', ru: 'Корзина' },
  'Всички продукти': { bg: 'Всички продукти', en: 'All products', ru: 'Все товары' },
  'Търсене на продукти...': { bg: 'Търсене на продукти...', en: 'Search products...', ru: 'Поиск товаров...' },
  'Търсене на продукти': { bg: 'Търсене на продукти', en: 'Search products', ru: 'Поиск товаров' },
  'Търси': { bg: 'Търси', en: 'Search', ru: 'Найти' },
  'Език': { bg: 'Език', en: 'Language', ru: 'Язык' },
  'Български': { bg: 'Български', en: 'Bulgarian', ru: 'Болгарский' },
  'Английски': { bg: 'Английски', en: 'English', ru: 'Английский' },
  'Руски': { bg: 'Руски', en: 'Russian', ru: 'Русский' },
  'Градински център Флориал': { bg: 'Градински център Флориал', en: 'Florial Garden Centre', ru: 'Садовый центр Florial' },
  'Професионално напояване, ландшафтен дизайн и оборудване в Бургас и Слънчев бряг с гаранция.': { bg: 'Професионално напояване, ландшафтен дизайн и оборудване в Бургас и Слънчев бряг с гаранция.', en: 'Professional irrigation, landscape design and equipment in Burgas and Sunny Beach, backed by a guarantee.', ru: 'Профессиональный полив, ландшафтный дизайн и оборудование в Бургасе и Солнечном Береге с гарантией.' },
  'Нашите услуги и готови комплекти': { bg: 'Нашите услуги и готови комплекти', en: 'Our services and ready-made kits', ru: 'Наши услуги и готовые комплекты' },
  'Професионални решения за градината': { bg: 'Професионални решения за градината', en: 'Professional garden solutions', ru: 'Профессиональные решения для сада' },
  'Каталог продукти': { bg: 'Каталог продукти', en: 'Product catalogue', ru: 'Каталог товаров' },
  'Изберете категория': { bg: 'Изберете категория', en: 'Choose a category', ru: 'Выберите категорию' },
  'Няма снимка': { bg: 'Няма снимка', en: 'No image', ru: 'Нет изображения' },
  'Няма изображение': { bg: 'Няма изображение', en: 'No image available', ru: 'Нет изображения' },
  'По оферта': { bg: 'По оферта', en: 'Request a quote', ru: 'По запросу' },
  'Детайли →': { bg: 'Детайли →', en: 'Details →', ru: 'Подробнее →' },
  'Виж детайли': { bg: 'Виж детайли', en: 'View details', ru: 'Подробнее' },
  'Виж продукта →': { bg: 'Виж продукта →', en: 'View product →', ru: 'Открыть товар →' },
  'Начало / Каталог': { bg: 'Начало / Каталог', en: 'Home / Catalogue', ru: 'Главная / Каталог' },
  'Назад към началната страница': { bg: 'Назад към началната страница', en: 'Back to home', ru: 'Вернуться на главную' },
  'Към началната страница': { bg: 'Към началната страница', en: 'Back to home', ru: 'На главную' },
  'Разгледайте каталога': { bg: 'Разгледайте каталога', en: 'Browse catalogue', ru: 'Перейти в каталог' },
  'Подкатегории:': { bg: 'Подкатегории:', en: 'Subcategories:', ru: 'Подкатегории:' },
  'Всички': { bg: 'Всички', en: 'All', ru: 'Все' },
  'В тази категория все още няма налични продукти.': { bg: 'В тази категория все още няма налични продукти.', en: 'There are no products in this category yet.', ru: 'В этой категории пока нет товаров.' },
  'Технически характеристики': { bg: 'Технически характеристики', en: 'Technical specifications', ru: 'Технические характеристики' },
  'Описание': { bg: 'Описание', en: 'Description', ru: 'Описание' },
  'Количество:': { bg: 'Количество:', en: 'Quantity:', ru: 'Количество:' },
  'Добави в количката': { bg: 'Добави в количката', en: 'Add to cart', ru: 'Добавить в корзину' },
  'Продуктът е добавен успешно в кошницата!': { bg: 'Продуктът е добавен успешно в кошницата!', en: 'Product added to your cart successfully!', ru: 'Товар успешно добавлен в корзину!' },
  'Артикул (SKU):': { bg: 'Артикул (SKU):', en: 'SKU:', ru: 'Артикул (SKU):' },
  'Артикул:': { bg: 'Артикул:', en: 'SKU:', ru: 'Артикул:' },
  'Резултати от търсенето': { bg: 'Резултати от търсенето', en: 'Search results', ru: 'Результаты поиска' },
  'Търсене:': { bg: 'Търсене:', en: 'Search:', ru: 'Поиск:' },
  'Зареждане на продуктите...': { bg: 'Зареждане на продуктите...', en: 'Loading products...', ru: 'Загрузка товаров...' },
  'Въведете име, марка или продуктов код в полето за търсене.': { bg: 'Въведете име, марка или продуктов код в полето за търсене.', en: 'Enter a product name, brand or product code in the search field.', ru: 'Введите название, бренд или артикул в поле поиска.' },
  'Няма намерени продукти': { bg: 'Няма намерени продукти', en: 'No products found', ru: 'Товары не найдены' },
  'Опитайте с друго име, марка или продуктов код.': { bg: 'Опитайте с друго име, марка или продуктов код.', en: 'Try another name, brand or product code.', ru: 'Попробуйте другое название, бренд или артикул.' },
  'Намерени продукти:': { bg: 'Намерени продукти:', en: 'Products found:', ru: 'Найдено товаров:' },
  'Зареждане на продукта...': { bg: 'Зареждане на продукта...', en: 'Loading product...', ru: 'Загрузка товара...' },
  'Продуктът не е намерен': { bg: 'Продуктът не е намерен', en: 'Product not found', ru: 'Товар не найден' },
  'Проверете адреса или се върнете към началната страница.': { bg: 'Проверете адреса или се върнете към началната страница.', en: 'Check the address or return to the home page.', ru: 'Проверьте адрес или вернитесь на главную страницу.' },
  'Работни часове': { bg: 'Работни часове', en: 'Opening hours', ru: 'Часы работы' },
  'Адрес и контакти': { bg: 'Адрес и контакти', en: 'Address and contacts', ru: 'Адрес и контакты' },
  'Обаждане': { bg: 'Обаждане', en: 'Call us', ru: 'Позвонить' },
  'Работни дни': { bg: 'Работни дни', en: 'Working days', ru: 'Рабочие дни' },
  'Свържете се с нас за консултация и оглед': { bg: 'Свържете се с нас за консултация и оглед', en: 'Contact us for a consultation and site visit', ru: 'Свяжитесь с нами для консультации и осмотра объекта' },
  'WhatsApp Контакт': { bg: 'WhatsApp Контакт', en: 'Contact on WhatsApp', ru: 'Связаться в WhatsApp' },
  'За нас': { bg: 'За нас', en: 'About us', ru: 'О нас' },
  'Райони и населени места на обслужване:': { bg: 'Райони и населени места на обслужване:', en: 'Service areas:', ru: 'Районы обслуживания:' },
  'Количка за пазаруване': { bg: 'Количка за пазаруване', en: 'Shopping cart', ru: 'Корзина покупок' },
  'Вашата количка е празна.': { bg: 'Вашата количка е празна.', en: 'Your cart is empty.', ru: 'Ваша корзина пуста.' },
  'Детайли за поръчката': { bg: 'Детайли за поръчката', en: 'Order details', ru: 'Детали заказа' },
  'Общо:': { bg: 'Общо:', en: 'Total:', ru: 'Итого:' },
  'Име и фамилия *': { bg: 'Име и фамилия *', en: 'Full name *', ru: 'Имя и фамилия *' },
  'Телефон *': { bg: 'Телефон *', en: 'Phone *', ru: 'Телефон *' },
  'Град / Населено място *': { bg: 'Град / Населено място *', en: 'City / Town *', ru: 'Город / населённый пункт *' },
  'Адрес за доставка': { bg: 'Адрес за доставка', en: 'Delivery address', ru: 'Адрес доставки' },
  'Изпрати поръчката': { bg: 'Изпрати поръчката', en: 'Submit order', ru: 'Оформить заказ' },
  'Благодарим ви за поръчката!': { bg: 'Благодарим ви за поръчката!', en: 'Thank you for your order!', ru: 'Спасибо за ваш заказ!' },
  'Вашата поръчка беше приета успешно. Наш специалист ще се свърже с вас възможно най-скоро за потвърждение.': { bg: 'Вашата поръчка беше приета успешно. Наш специалист ще се свърже с вас възможно най-скоро за потвърждение.', en: 'Your order has been received. Our specialist will contact you shortly to confirm it.', ru: 'Ваш заказ принят. Наш специалист свяжется с вами в ближайшее время для подтверждения.' },
  'Премахни': { bg: 'Премахни', en: 'Remove', ru: 'Удалить' },
  'Висококачествен продукт за поливни системи.': { bg: 'Висококачествен продукт за поливни системи.', en: 'High-quality product for irrigation systems.', ru: 'Высококачественный товар для систем полива.' },
  "Намерени продукти:": {"bg":"Намерени продукти:","en":"Products found:","ru":"Найдено товаров:"},
  "Търсене:": {"bg":"Търсене:","en":"Search:","ru":"Поиск:"},
  "Начална цена:": {"bg":"Начална цена:","en":"Starting price:","ru":"Начальная цена:"},
  "Услуги на Florial": {"bg":"Услуги на Florial","en":"Florial services","ru":"Услуги Florial"},
  "Свържете се с нас и ще обсъдим подходящото решение за вашата градина.": {"bg":"Свържете се с нас и ще обсъдим подходящото решение за вашата градина.","en":"Contact us and we will discuss the right solution for your garden.","ru":"Свяжитесь с нами, и мы подберём подходящее решение для вашего сада."},
  "Свържете се с нас": {"bg":"Свържете се с нас","en":"Contact us","ru":"Связаться с нами"},
  "Каталог": {"bg":"Каталог","en":"Catalogue","ru":"Каталог"},
  "Документи и инструкции": {"bg":"Документи и инструкции","en":"Documents and instructions","ru":"Документы и инструкции"},
  "Изтегляне ↓": {"bg":"Изтегляне ↓","en":"Download ↓","ru":"Скачать ↓"},
  "Съвместими продукти": {"bg":"Съвместими продукти","en":"Compatible products","ru":"Совместимые товары"},
  "Детайлно описание на продукта.": {"bg":"Детайлно описание на продукта.","en":"Detailed product description.","ru":"Подробное описание товара."},
  "Детайли": {"bg":"Детайли","en":"Details","ru":"Подробнее"},
  "Виж": {"bg":"Виж","en":"View","ru":"Смотреть"},
  "Количество": {"bg":"Количество","en":"Quantity","ru":"Количество"},
  " / бр.": {"bg":" / бр.","en":" / pc.","ru":" / шт."},
  "Количка за пазаруване": {"bg":"Количка за пазаруване","en":"Shopping cart","ru":"Корзина покупок"},
  "Детайли за поръчката": {"bg":"Детайли за поръчката","en":"Order details","ru":"Детали заказа"},
  "Име и фамилия *": {"bg":"Име и фамилия *","en":"Full name *","ru":"Имя и фамилия *"},
  "Телефон *": {"bg":"Телефон *","en":"Phone *","ru":"Телефон *"},
  "Град / Населено място *": {"bg":"Град / Населено място *","en":"City / town *","ru":"Город / населённый пункт *"},
  "Адрес за доставка": {"bg":"Адрес за доставка","en":"Delivery address","ru":"Адрес доставки"},
  "Изпрати поръчката": {"bg":"Изпрати поръчката","en":"Submit order","ru":"Оформить заказ"},
  "понеделник": {"bg":"понеделник","en":"Monday","ru":"Понедельник"},
  "вторник": {"bg":"вторник","en":"Tuesday","ru":"Вторник"},
  "сряда": {"bg":"сряда","en":"Wednesday","ru":"Среда"},
  "четвъртък": {"bg":"четвъртък","en":"Thursday","ru":"Четверг"},
  "петък": {"bg":"петък","en":"Friday","ru":"Пятница"},
  "Събота": {"bg":"Събота","en":"Saturday","ru":"Суббота"},
  "Възкресение": {"bg":"Възкресение","en":"Sunday","ru":"Воскресенье"},
  "Почивен ден": {"bg":"Почивен ден","en":"Closed","ru":"Выходной"},
  "Разсадник за растения": {"bg":"Разсадник за растения","en":"Plant nursery","ru":"Питомник растений"},
  "за Українські мови и Русского языка": {"bg":"за Українські мови и Русского языка","en":"Ukrainian and Russian speaking","ru":"украинский и русский языки"},
  "Работни часове": {"bg":"Работни часове","en":"Opening hours","ru":"Часы работы"},
  "Адрес и контакти": {"bg":"Адрес и контакти","en":"Address and contacts","ru":"Адрес и контакты"},
  "От": {"bg":"От","en":"From","ru":"От"},
  "Свържете се с нас за консултация и оглед": {"bg":"Свържете се с нас за консултация и оглед","en":"Contact us for a consultation and site visit","ru":"Свяжитесь с нами для консультации и осмотра объекта"},
}

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (source: string) => string
  localize: (item: any, field: string) => any
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('florial-language') : null
    const fromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null
    const candidate = fromUrl || stored || 'bg'
    return candidate === 'en' || candidate === 'ru' ? candidate : 'bg'
  })

  const setLanguage = (next: Language) => {
    setLanguageState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('florial-language', next)
      document.documentElement.lang = next
      const url = new URL(window.location.href)
      if (next === 'bg') url.searchParams.delete('lang')
      else url.searchParams.set('lang', next)
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    }
  }

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (source: string) => translations[source]?.[language] || source,
    localize: (item: any, field: string) => {
      if (!item) return undefined
      const translated = item.translations?.[language]?.[field]
        ?? item[`${field}Translations`]?.[language]?.[field]
        ?? item[`${field}Translations`]?.[language]?.name
        ?? item[`${field}${language.toUpperCase()}`]
        ?? item[`${field}_${language}`]
      return translated ?? item[field]
    },
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useI18n must be used inside LanguageProvider')
  return value
}
