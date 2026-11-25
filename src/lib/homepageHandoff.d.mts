type HomepageReadiness = {
  isHomepageRoute: boolean
  headerDataReady: boolean
  categoriesReady: boolean
  homeCategoriesAndHeroReady: boolean
  homeFeaturedPlantsReady: boolean
  homeFeaturedEquipmentReady: boolean
  homeBlogReady: boolean
}

type HiddenRoot = { hidden: boolean }

export function isHomepageClientReady(readiness: HomepageReadiness): boolean
export function completeHomepageHandoff(serverRoot: HiddenRoot | null, clientRoot: HiddenRoot | null): boolean
