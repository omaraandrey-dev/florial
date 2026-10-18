import React from 'react'
import type { ServiceItem } from '../types'

interface ServicePageProps {
  service: ServiceItem
  onNavigateHome: () => void
}

const renderPortableText = (content: any) => {
  if (!content) return null
  if (typeof content === 'string') {
    return <p className="text-slate-700 leading-relaxed mb-4">{content}</p>
  }
  if (Array.isArray(content)) {
    return content.map((block: any, index: number) => {
      if (block._type !== 'block') return null
      const text = block.children?.map((child: any) => child.text).join('') || ''
      switch (block.style) {
        case 'h2':
          return <h2 key={block._key || index} className="text-2xl font-bold text-slate-900 mt-6 mb-3">{text}</h2>
        case 'h3':
          return <h3 key={block._key || index} className="text-xl font-bold text-slate-800 mt-5 mb-2">{text}</h3>
        default:
          return <p key={block._key || index} className="text-slate-700 leading-relaxed mb-4 text-base">{text}</p>
      }
    })
  }
  return null
}

export function ServicePage({ service, onNavigateHome }: ServicePageProps) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 flex-grow w-full">
      <button 
        onClick={onNavigateHome}
        className="mb-6 inline-flex items-center text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition cursor-pointer"
      >
        ← Назад към началната страница
      </button>
      <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-10">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">Услуга Florial</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">{service.name}</h1>
        {service.imageUrl && (
          <div className="h-64 md:h-96 w-full bg-slate-100 rounded-xl overflow-hidden mb-8 border border-slate-100">
            <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
          </div>
        )}
        {service.startingPriceEUR && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-8 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-900">Начална цена на услугата:</span>
            <span className="text-2xl font-bold text-emerald-800">от {service.startingPriceEUR} €</span>
          </div>
        )}
        {service.shortDescription && (
          <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-emerald-600 mb-6 text-slate-700 font-medium leading-relaxed text-lg">
            {service.shortDescription}
          </div>
        )}
        <div className="prose prose-emerald max-w-none mb-8">
          {renderPortableText(service.description)}
        </div>
      </article>
    </main>
  )
}
