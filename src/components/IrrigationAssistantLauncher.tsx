import type { MouseEvent } from 'react'

interface IrrigationAssistantLauncherProps {
  imageUrl?: string
  imageAlt: string
  language: string
  onOpen: () => void
}

const copy = {
  bg: { label: 'Помощник за напояване', hint: 'Нуждаете се от помощ при избора на поливна система?' },
  ru: { label: 'Помощник полива', hint: 'Нужна помощь с подбором системы полива?' },
  en: { label: 'Irrigation assistant', hint: 'Need help choosing an irrigation system?' },
}

export function IrrigationAssistantLauncher({ imageUrl, imageAlt, language, onOpen }: IrrigationAssistantLauncherProps) {
  const text = copy[language as keyof typeof copy] || copy.bg

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onOpen()
  }

  return (
    <div className="fixed bottom-28 left-3 z-[70] flex items-center gap-3 sm:bottom-8 sm:left-5">
      <button
        type="button"
        onClick={handleClick}
        aria-label={text.label}
        title={text.hint}
        className="group relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-emerald-700 shadow-[0_4px_20px_rgba(15,60,40,0.28)] outline-none transition duration-200 hover:scale-105 hover:shadow-[0_6px_24px_rgba(15,60,40,0.38)] focus-visible:ring-4 focus-visible:ring-emerald-300"
      >
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} loading="lazy" decoding="async" className="h-full w-full rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="text-3xl">💧</span>
        )}
        <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
      </button>
      <span className="pointer-events-none hidden max-w-56 rounded-xl border border-emerald-100 bg-white/95 px-3 py-2 text-xs font-semibold leading-5 text-slate-700 shadow-lg sm:block">
        {text.hint}
      </span>
    </div>
  )
}
