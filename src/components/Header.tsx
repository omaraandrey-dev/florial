import { useEffect, useState } from 'react'
import { sanityClient } from '../lib/sanity'

interface LogoData {
  title: string
  alt: string
  imageUrl: string
}

export function Header() {
  const [logo, setLogo] = useState<LogoData | null>(null)

  useEffect(() => {
    // Ищем любой документ, у которого есть изображение и в названии/slug есть нужный текст
    const query = `*[defined(image) && (slug.current == "oficialno-logo-na-florial-gradinski-centar" || title match "*лого*")][0]{
      "title": title,
      "alt": alt,
      "imageUrl": image.asset->url
    }`

    sanityClient.fetch(query).then((data) => {
      console.log("Данные из Sanity получены:", data)
      if (data && data.imageUrl) {
        setLogo(data)
      }
    }).catch((err) => console.error("Ошибка запроса Sanity:", err))
  }, [])

  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Логотип сайта */}
        <a href="/" className="flex items-center gap-3 decoration-0">
          {logo?.imageUrl ? (
            <img 
              src={logo.imageUrl} 
              alt={logo.alt || logo.title || "Florial Logo"} 
              className="h-12 w-auto object-contain"
            />
          ) : (
            <span className="text-2xl font-bold text-green-800">Florial</span>
          )}
        </a>

        {/* Навигационное меню */}
        <nav className="hidden md:flex items-center gap-8 font-medium text-gray-700">
          <a href="/" className="hover:text-green-700 transition">Начало</a>
          <a href="/services" className="hover:text-green-700 transition">Услуги</a>
          <a href="/products" className="hover:text-green-700 transition">Продукти</a>
          <a href="/contacts" className="hover:text-green-700 transition">Контакти</a>
        </nav>
      </div>
    </header>
  )
}
