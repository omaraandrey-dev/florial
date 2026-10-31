import React from 'react'
import type { Product } from '../types'
import { localizedHref } from '../lib/navigation'

const VALVE_CATEGORY_IDS = new Set(['category-valves-24v', 'category-valves-9v'])
const VALVE_BOX_CATEGORY_IDS = new Set(['6d09232c-4c54-4ba2-b463-1cb61d7345b8'])
const IMAGE = 'https://cdn.sanity.io/images/bxvcy0qs/production/95a24bbe6e98e8205655e910dac6ab29dd293d96-1536x1024.png'

type Language = 'bg' | 'ru' | 'en'
type Content = { title: string; description: string; linkLabel: string; href: string; imageAlt: string }
const CONTENT: Record<Language, { valve: Content; box: Content }> = {
  bg: {
    valve: { title: 'Нужен е монтаж или ремонт на електромагнитен клапан?', description: 'Florial извършва монтаж, диагностика, почистване и подмяна на електромагнитни клапани за автоматично напояване.', linkLabel: 'Прочетете повече', href: '/blog/montazh-remont-elektromagnitni-klapani', imageAlt: 'Монтаж и ремонт на електромагнитен клапан Rain Bird от Florial' },
    box: { title: 'Нуждаете се от монтаж на клапанна шахта?', description: 'Помагаме с монтаж на клапанни групи, свързване на електромагнитни клапани и поддръжка на поливни системи.', linkLabel: 'Вижте услугата', href: '/services/remont-i-poddrazhka', imageAlt: 'Клапанна шахта и оборудване за автоматично напояване' },
  },
  ru: {
    valve: { title: 'Нужен монтаж или ремонт электромагнитного клапана?', description: 'Florial выполняет монтаж, диагностику, очистку и замену электромагнитных клапанов систем автоматического полива.', linkLabel: 'Подробнее о работах', href: '/blog/montazh-remont-elektromagnitni-klapani', imageAlt: 'Монтаж и ремонт электромагнитного клапана Rain Bird компанией Florial' },
    box: { title: 'Нужен монтаж клапанного бокса?', description: 'Помогаем с монтажом клапанных групп, подключением электромагнитных клапанов и обслуживанием систем полива.', linkLabel: 'Подробнее об услуге', href: '/services/remont-i-poddrazhka', imageAlt: 'Клапанный бокс и оборудование для автоматического полива' },
  },
  en: {
    valve: { title: 'Need solenoid valve installation or repair?', description: 'Florial provides installation, diagnostics, cleaning and replacement of solenoid valves for automatic irrigation systems.', linkLabel: 'Read more', href: '/blog/montazh-remont-elektromagnitni-klapani', imageAlt: 'Rain Bird solenoid valve installation and repair by Florial' },
    box: { title: 'Need a valve box installed?', description: 'We help install valve manifolds, connect solenoid valves and maintain automatic irrigation systems.', linkLabel: 'View the service', href: '/services/remont-i-poddrazhka', imageAlt: 'Irrigation valve box and automatic irrigation equipment' },
  },
}

export function ValveServiceCrosslink({ product, language }: { product: Product; language: Language }) {
  const categoryIds = new Set([
    product.categoryId,
    ...(product.categories || []).map((category) => category._id),
  ].filter((id): id is string => Boolean(id)))
  const kind = [...categoryIds].some((id) => VALVE_CATEGORY_IDS.has(id))
    ? 'valve'
    : [...categoryIds].some((id) => VALVE_BOX_CATEGORY_IDS.has(id)) ? 'box' : null

  if (!kind) return null
  const content = CONTENT[language][kind]
  return (
    <aside aria-label={content.title} className="mb-12 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/50 shadow-sm">
      <div className="grid grid-cols-1 items-center gap-0 sm:grid-cols-[minmax(0,220px)_1fr]">
        <img src={IMAGE} alt={content.imageAlt} title={content.imageAlt} loading="lazy" className="h-44 w-full object-cover sm:h-full sm:min-h-44" />
        <div className="p-5 md:p-6">
          <h2 className="mb-2 text-lg font-bold leading-snug text-slate-900 md:text-xl">{content.title}</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-600">{content.description}</p>
          <a href={localizedHref(content.href, language)} className="inline-flex items-center gap-2 font-semibold text-emerald-800 underline-offset-4 transition hover:text-emerald-950 hover:underline">
            {content.linkLabel}<span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </aside>
  )
}
