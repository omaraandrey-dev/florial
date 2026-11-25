export function isHomepageClientReady(readiness) {
  return Boolean(
    readiness?.isHomepageRoute &&
    readiness?.headerDataReady &&
    readiness?.categoriesReady &&
    readiness?.homeCategoriesAndHeroReady &&
    readiness?.homeFeaturedPlantsReady &&
    readiness?.homeFeaturedEquipmentReady &&
    readiness?.homeBlogReady
  )
}

export function completeHomepageHandoff(serverRoot, clientRoot) {
  if (!serverRoot || !clientRoot || serverRoot === clientRoot) return false
  clientRoot.hidden = false
  serverRoot.hidden = true
  return true
}
