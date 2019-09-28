import * as SygicService from './sygic'
import * as SBBService from './sbb'
import { minBy, maxBy } from 'lodash'
import _flatten from 'lodash/flatten'
import dayjs from 'dayjs'
const util = require('util')

async function getSurpriseTrips({
  originId,
  travelDate,
  maxPrice,
  withHalfFare,
  categories,
}) {
  const formattedDate = dayjs(travelDate).format('YYYY-MM-DD')

  const matchingPlaces = await SygicService.getMatchingPlaces({
    categories: categories.join('|'),
  })

  const reachablePlaces = matchingPlaces
    .filter(place => place.isReachable && place.id !== originId)
    .slice(0, 10)

  // get the access token
  await SBBService.getSbbAccessToken()

  // query the top 10 places for trips
  const result = await Promise.all(
    reachablePlaces.map(async place => {
      // get the best outgoing trip
      const bestOut = await SBBService.getBestPrices(
        originId,
        place.id,
        formattedDate,
        ['06:00', '07:00', '08:00', '09:00'],
        maxPrice,
        withHalfFare,
      )

      if (bestOut.length === 0 || !bestOut.superSaver) {
        return []
      }

      // get the best return trip
      const bestReturn = await SBBService.getBestPrices(
        place.id,
        originId,
        formattedDate,
        ['18:00', '19:00', '20:00', '21:00'],
        maxPrice,
        withHalfFare,
      )

      if (bestReturn.length === 0 || !bestReturn.superSaver) {
        return []
      }

      return {
        bestOut,
        bestReturn,
        categories: place.categories,
        price: bestOut.price + bestReturn.price,
        discount: (bestOut.discount + bestReturn.discount) / 2,
        start: 1546325700,
        end: 1546371900,
      }
    }),
  )

  return _flatten(result)
}

export { getSurpriseTrips }
