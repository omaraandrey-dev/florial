import React from 'react'

interface ContactsPageProps {
  onNavigateHome: () => void
}

export function ContactsPage({ onNavigateHome }: ContactsPageProps) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 flex-grow w-full">
      <button 
        onClick={onNavigateHome}
        className="mb-6 inline-flex items-center text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition cursor-pointer"
      >
        ← Назад към началната страница
      </button>

      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Работни часове</h2>
        <ul className="space-y-2 text-slate-700 font-medium">
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>понеделник</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>вторник</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>сряда</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>четвъртък</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>петък</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between border-b border-amber-200/50 pb-2"><i>Събота</i> <span>9:00 – 18.00</span></li>
          <li className="flex justify-between pt-1"><i>Възкресение</i> <span className="font-bold text-red-700">Почивен ден</span></li>
        </ul>
      </div>

      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm mb-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Адрес и контакти</h2>
        <p className="font-semibold text-slate-800">Градински център "Флориал"</p>
        <div className="space-y-2 text-sm">
          <p><a href="tel:+359876777902" className="text-emerald-800 font-bold hover:underline">+359876777902</a></p>
          <p><a href="tel:+359885834860" className="text-emerald-800 font-bold hover:underline">+359885834860</a> за Українські мови и Русского языка</p>
        </div>
        <p className="text-slate-700 pt-2 border-t border-amber-200/50">
          <strong>Разсадник за растения</strong><br />
          ул. „Хан Крум“, 8230 Несебър
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <a href="tel:+359876777902" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-center shadow transition flex items-center justify-center gap-2">
          📞 Обаждане
        </a>
        <a href="https://wa.me/359876777902" target="_blank" rel="noreferrer" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl text-center shadow transition flex items-center justify-center gap-2">
          💬 WhatsApp
        </a>
      </div>
    </main>
  )
}
