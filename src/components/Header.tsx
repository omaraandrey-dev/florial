import React, { useState, useEffect } from 'react'
import { sanityClient } from '../lib/sanity' // Обратите внимание: '../lib/sanity', так как мы находимся в папке components

export function Header() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Зареждане на логотип...')

  useEffect(() => {
    // Ищем документ логотипа с категорией 'home' или подходящим заголовком
    const query = `*[defined(image.asset) && (category == "home" || title match "*Logo*" || title match "*лого*")][0]{
      "imageUrl": image.asset->url,
      "title": title
    }`

    sanityClient.fetch(query)
      .then((data) => {
        if (data && data.imageUrl) {
          setImageUrl(data.imageUrl)
          setStatus(`Найдено: ${data.title || 'Логотип'}`)
        } else {
          // Запасной запрос, если категории нет
          sanityClient.fetch(`*[defined(image.asset)][0]{ "imageUrl": image.asset->url }`)
            .then(fallbackData => {
              if (fallbackData?.imageUrl) setImageUrl(fallbackData.imageUrl)
            })
        }
      })
      .catch((err) => {
        setStatus(`Грешка: ${err.message}`)
      })
  }, [])

  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-900 px-4 py-3 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Градински център Флориал" 
              className="h-10 md:h-12 object-contain rounded bg-white/10 p-1" 
            />
          ) : (
            <div className="h-10 w-28 bg-emerald-900/50 rounded flex items-center justify-center text-xs text-emerald-300">
              {status}
            </div>
          )}
          <span className="font-extrabold text-lg tracking-wide hidden sm:inline-block">
            Florial
          </span>
        </div>

        <nav className="flex items-center gap-4 text-xs md:text-sm font-semibold">
          <a href="/" className="hover:text-emerald-300 transition">Начало</a>
          <a href="#catalog" className="hover:text-emerald-300 transition">Продукти</a>
          <a href="#services" className="hover:text-emerald-300 transition">Услуги</a>
        </nav>
      </div>
    </header>
  )
}
