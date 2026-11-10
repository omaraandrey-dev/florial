export const normalizePlantOldPrice = (oldPriceEUR, currentPriceEUR) =>
  oldPriceEUR !== null && oldPriceEUR > currentPriceEUR ? oldPriceEUR : null
