import React from 'react'

export function BlogArticleLoadingState({label}: {label: string}) {
  return <main className="mx-auto min-h-[100svh] w-full max-w-4xl flex-grow px-4 py-8 md:py-12" aria-busy="true">
    <p className="sr-only" role="status" aria-live="polite">{label}</p>
    <div aria-hidden="true" className="mb-6 h-4 w-48 animate-pulse rounded bg-slate-200" />
    <div aria-hidden="true" className="mb-8 space-y-4">
      <div className="h-9 w-11/12 animate-pulse rounded bg-slate-200 md:h-12" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
    </div>
    <div aria-hidden="true" className="mb-9 aspect-[2/3] max-h-[620px] animate-pulse rounded-2xl bg-slate-100 md:aspect-auto md:h-[620px]" />
    <div aria-hidden="true" className="space-y-5">
      <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
      <div className="h-5 w-11/12 animate-pulse rounded bg-slate-100" />
      <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
      <div className="my-8 h-8 w-2/3 animate-pulse rounded bg-slate-200" />
      {Array.from({length: 5}, (_, index) => <div key={index} className="h-5 w-full animate-pulse rounded bg-slate-100" />)}
    </div>
  </main>
}
