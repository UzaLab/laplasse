import { useQuery } from '@tanstack/react-query'
import { fetchGeoCities, fetchGeoCommunes, type GeoCommune } from '@/lib/geoApi'
import { getCountryCode, getDefaultCity } from '@/lib/country'

export function useGeoCommunesForDefaultCity() {
  const country = getCountryCode()
  const defaultCityName = getDefaultCity(country)

  return useQuery<GeoCommune[]>({
    queryKey: ['geo-communes-search', country, defaultCityName],
    queryFn: async () => {
      const citiesResult = await fetchGeoCities(country)
      if (!citiesResult.ok || !citiesResult.data?.length) return []

      const city =
        citiesResult.data.find(c => c.name.toLowerCase() === defaultCityName.toLowerCase())
        ?? citiesResult.data.find(c => c.is_default)
        ?? citiesResult.data[0]

      const communesResult = await fetchGeoCommunes(city.slug, country)
      if (!communesResult.ok) return []
      return communesResult.data.communes ?? []
    },
    staleTime: 1000 * 60 * 30,
  })
}
