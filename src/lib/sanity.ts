import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'bxvcy0qs',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
})

 
// Separate dataset for the plant catalogue; irrigation equipment remains in production.
export const plantsClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'bxvcy0qs',
  dataset: import.meta.env.VITE_SANITY_PLANTS_DATASET || 'plants',
  useCdn: false,
  apiVersion: '2024-01-01',
})
