import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'kjkc2aazayha1zdg3opyp8uc',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  useCdn: false, // Ставим false, чтобы свежие загруженные фото сразу появлялись без задержки кэша
  apiVersion: '2024-01-01',
})
