import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {irrigationSchemaTypes, plantSchemaTypes} from './schemaTypes'

/**
 * Florial Sanity Studio source of truth.
 * Keep both datasets in one version-controlled Studio project.
 * This file configures Studio workspaces; document fields live in ./schemaTypes.
 */
export default defineConfig([
  {
    name: 'florial-admin',
    title: 'Florial — Каталог и услуги',
    projectId: 'bxvcy0qs',
    dataset: 'production',
    basePath: '/admin',
    plugins: [structureTool()],
    schema: {types: irrigationSchemaTypes},
  },
  {
    name: 'plants',
    title: 'Florial — Растения',
    projectId: 'bxvcy0qs',
    dataset: 'plants',
    basePath: '/plants',
    plugins: [structureTool()],
    schema: {types: plantSchemaTypes},
  },
])
