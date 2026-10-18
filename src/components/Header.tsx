import { useEffect, useState } from 'react'
import { sanityClient } from '../lib/sanity'

export function Header() {
  const [status, setStatus] = useState('Загрузка из Sanity...')
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    // Ищем документ строго с категорией 'home' (или специфичный для логотипа)
    const query = `*[defined(image.asset) && category == "home"][0]{
      "imageUrl": image.asset->url,
      "title": title
    }`

    sanityClient.fetch(query)
      .then((data) => {
        if (data && data.imageUrl) {
          setImageUrl(data.imageUrl)
          setStatus(`Найдено: ${data.title || 'Логотип'}`)
        } else {
          // Запасной вариант, если category == "home" не проставлена у самого логотипа, 
          // но документ называется "Логотип" или содержит слово Logo
          sanityClient.fetch(`*[defined(image.asset) && (title match "*Logo*" || title match "*лого*")][0]{ "imageUrl": image.asset->url }`)
            .then(fallbackData => {
              if (fallbackData?.imageUrl) setImageUrl(fallbackData.imageUrl)
            })
        }
      })
      .catch((err) => {
        setStatus(`Ошибка: ${err.message}`)
      })
  }, [])

  return (
    <header className="w-full bg-[#1b4332] text-white py-4 px-6 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <img src={imageUrl} alt="Logo" className="h-12 w-auto bg-white/10 p-1 rounded" />
        ) : (
          <span className="text-xl font-bold">Florial</span>
        )}
      </div>
      {/* Отладочная плашка прямо в шапке */}
      <div className="text-xs bg-black/30 px-3 py-1 rounded text-yellow-300">
        Статус Sanity: {status}
      </div>
    </header>
  )
}
