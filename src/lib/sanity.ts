import { createClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || 'bxvcy0qs'
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
const plantsDataset = import.meta.env.VITE_SANITY_PLANTS_DATASET || 'plants'
const apiVersion = '2024-01-01'

// Public, published content is served through Sanity's API CDN.
export const sanityClient = createClient({
  projectId,
  dataset,
  useCdn: true,
  perspective: 'published',
  apiVersion,
})

// Commercial data that must stay fresh (product prices, stock and search) bypasses the CDN.
export const sanityLiveClient = createClient({
  projectId,
  dataset,
  useCdn: false,
  perspective: 'published',
  apiVersion,
})

// Live plant client is also used by Manager category operations; keep it uncached.
export const plantsClient = createClient({
  projectId,
  dataset: plantsDataset,
  useCdn: false,
  apiVersion,
})

// Public plant category content can use the CDN; product and variant data remains live.
export const publicPlantsClient = createClient({
  projectId,
  dataset: plantsDataset,
  useCdn: true,
  perspective: 'published',
  apiVersion,
})
