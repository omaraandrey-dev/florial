import { useEffect, useState } from 'react'
import { sanityClient } from '../lib/sanity'

export function Header() {
  const [status, setStatus] = useState('Загрузка из Sanity...')
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const query = `*[defined(image.asset)][0]{
      "imageUrl": image.asset->url,
      "title": title
    }`

    sanityClient.fetch(query)
      .then((data) => {
        if (data && data.imageUrl) {
          setImageUrl(data.imageUrl)
          setStatus(`Найдено: ${data.title || 'Логотип'}`)
        } else {
          setStatus('Документ с картинкой не найден в Sanity!')
        }
      })
      .catch((err) => {
        setStatus(`Ошибка связи: ${err.message}`)
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
