import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'bxvcy0qs',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  useCdn: true, // true для быстрого чтения из кэша
  apiVersion: '2024-01-01',
})