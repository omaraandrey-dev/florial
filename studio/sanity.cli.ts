import {defineCliConfig} from 'sanity/cli'

/**
 * Existing hosted Florial Studio application.
 * Both workspaces are configured in sanity.config.ts and deploy together.
 */
export default defineCliConfig({
  api: {
    projectId: 'bxvcy0qs',
    dataset: 'production',
  },
  deployment: {
    appId: 'owtr7mlnn6xm33qah9z2wop6',
  },
})
