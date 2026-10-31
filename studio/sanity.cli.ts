import {defineCliConfig} from 'sanity/cli'

/**
 * Existing hosted Florial Studio application.
 * Both workspaces are configured in sanity.config.ts and deploy together.
 */
export default defineCliConfig({
  studioHost: 'florial-admin-bg',
  api: {
    projectId: 'bxvcy0qs',
    dataset: 'production',
  },
  deployment: {
    // Verified against the single Studio application currently registered in Sanity.
    appId: 'fdy0ldwl717qtp5pikl7715l',
  },
})
