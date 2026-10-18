import { useEffect, useState } from 'react'
import { sanityClient } from '../lib/sanity'

interface LogoData {
  title: string
  alt?: string
  imageUrl?: string
}

export function Header() {
  const [logo, setLogo] = useState<LogoData | null>(null)

  useEffect(() => {
    // Точный GROQ-запрос под вашу схему
    const query = `*[defined(image.asset) && (category == "home" || slug.current == "oficialno-logo-na-florial-gradinski-centar")][0]{
      "title": title,
      "alt": image.alt,
      "imageUrl": image.asset->url
    }`

    sanityClient.fetch(query)
      .then((data) => {
        console.log("Данные логотипа из Sanity:", data)
        if (data && data.imageUrl) {
          setLogo(data)
        }
      })
      .catch((err) => console.error("Ошибка Sanity:", err))
  }, [])

  return (
    <header className="w-full bg-[#1b4332] text-white py-4 px-6 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Логотип */}
        <a href="/" className="flex items-center gap-3 decoration-none">
          {logo?.imageUrl ? (
            <img 
              src={logo.imageUrl} 
              alt={logo.alt || logo.title || "Florial Logo"} 
              className="h-14 w-auto object-contain bg-white/10 p-1 rounded"
            />
          ) : (
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-wide text-white">Florial</span>
              <span className="text-xs text-green-200 uppercase tracking-wider">
                ГРАДИНСКИ ЦЕНТЪР — Автоматично напояване & Озеленяване
              </span>
            </div>
          )}
        </a>

        {/* Меню */}
        <nav className="hidden md:flex gap-6 font-medium text-white/90">
          <a href="/" className="hover:text-white transition">Начало</a>
          <a href="/services" className="hover:text-white transition">Услуги</a>
          <a href="/products" className="hover:text-white transition">Продукти</a>
          <a href="/contacts" className="hover:text-white transition">Контакти</a>
        </nav>
      </div>
    </header>
  )
}
