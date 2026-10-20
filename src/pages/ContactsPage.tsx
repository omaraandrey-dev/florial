import React, { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import { sanityClient } from '../lib/sanity'

interface ContactsPageProps {
  onNavigateHome: () => void
}

interface CenterInfo {
  name: string
  address: string
  mapUrl: string
  slug: string
  imageUrl?: string
}

export function ContactsPage({ onNavigateHome }: ContactsPageProps) {
  const { t, language } = useI18n()
  
  const [centers, setCenters] = useState<Record<string, { imageUrl?: string; title?: string }>>({})
  const [loadingImages, setLoadingImages] = useState(true)

  // Загружаем фото для садовых центров из Sanity по их уникальным slug
  useEffect(() => {
    const fetchCenterImages = async () => {
      try {
        const query = `*[slug.current in $slugs] {
          "slug": slug.current,
          "imageUrl": coalesce(mainImage.asset->url, image.asset->url),
          title
        }`
        const data = await sanityClient.fetch(query, { 
          slugs: ['Florial-nesebr', 'Florial-ravda'] 
        })
        
        const mapped: Record<string, { imageUrl?: string; title?: string }> = {}
        data.forEach((item: any) => {
          if (item.slug) {
            mapped[item.slug] = {
              imageUrl: item.imageUrl,
              title: item.title
            }
          }
        })
        setCenters(mapped)
      } catch (err) {
        console.error('Грешка при зареждане на снимките на центровете:', err)
      } finally {
        setLoadingImages(false)
      }
    }

    fetchCenterImages()
  }, [])

  const gardenCenters: CenterInfo[] = [
    {
      slug: 'Florial-nesebr',
      name: language === 'en' ? 'Garden Centre Nessebar' : language === 'ru' ? 'Садовый центр Несебр' : 'Градински център Несебър',
      address: language === 'en' ? 'ul. "Khan Krum", 8230 Nessebar (Next to Janet store)' : language === 'ru' ? 'ул. "Хан Крум", 8230 Несебр (Рядом с магазином Janet)' : 'ул. „Хан Крум“, 8230 Несебър (до магазин Janet)',
      mapUrl: 'https://maps.app.goo.gl/pK8qGHh9b1xoCc4P9'
    },
    {
      slug: 'Florial-ravda',
      name: language === 'en' ? 'Garden Centre Ravda' : language === 'ru' ? 'Садовый центр Равда' : 'Градински център Равда',
      address: language === 'en' ? 'Ravda, Bulgaria' : language === 'ru' ? 'Равда, Болгария' : 'с. Равда, България',
      mapUrl: 'https://maps.app.goo.gl/3fiLaRgwSLDTH77U6'
    }
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 flex-grow w-full">
      <button 
        onClick={onNavigateHome}
        className="mb-6 inline-flex items-center text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition cursor-pointer"
      >
        ← {t('Назад към началната страница')}
      </button>

      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">
        {language === 'en' ? 'Contacts & Locations' : language === 'ru' ? 'Контакты и адреса' : 'Контакти и локации'}
      </h1>

      {/* Два бокса с садовыми центрами */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {gardenCenters.map((center) => {
          const centerData = centers[center.slug]
          const imageUrl = centerData?.imageUrl

          return (
            <div key={center.slug} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                {/* Фото садового центра */}
                <div className="h-52 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={center.name} 
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <span className="text-slate-400 text-sm font-medium">
                      {loadingImages ? t('Зареждане...') : t('Няма изображение')}
                    </span>
                  )}
                </div>

                {/* Информация */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{center.name}</h3>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">{center.address}</p>
                </div>
              </div>

              {/* Кнопка Google Карт */}
              <div className="px-6 pb-6 pt-0">
                <a 
                  href={center.mapUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 px-4 rounded-xl text-center text-sm transition border border-emerald-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  🗺️ {t('Виж на Google карти')}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* Рабочие часы */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('Работни часове')}</h2>
        <ul className="space-y-2 text-slate-700 font-medium">
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>{t('понеделник')}</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>{t('вторник')}</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>{t('сряда')}</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>{t('четвъртък')}</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>{t('петък')}</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>{t('Събота')}</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between pt-1"><i>{t('Възкресение')}</i> <span className="font-bold text-red-700">{t('Почивен ден')}</span></li>
        </ul>
      </div>

      {/* Телефоны и общие контакты */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{t('Адрес и контакти')}</h2>
        <div className="space-y-2 text-sm">
          <p><a href="tel:+359876777902" className="text-emerald-800 font-bold hover:underline">+359876777902</a></p>
          <p><a href="tel:+359885834860" className="text-emerald-800 font-bold hover:underline">+359885834860</a> {t('за Українські мови и Русского языка')}</p>
        </div>
      </div>

      {/* Быстрые действия (Звонок и WhatsApp) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <a href="tel:+359876777902" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-center shadow transition flex items-center justify-center gap-2 cursor-pointer">
          📞 {t('Обаждане')}
        </a>
        <a href="https://wa.me/359876777902" target="_blank" rel="noreferrer" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl text-center shadow transition flex items-center justify-center gap-2 cursor-pointer">
          💬 WhatsApp
        </a>
      </div>
    </main>
  )
}
