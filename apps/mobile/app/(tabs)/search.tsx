import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { SearchDiscoverView } from '@/src/components/SearchDiscoverView'
import SearchResultsView from '@/src/screens/SearchResultsView'

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string; filters?: string }>()
  const [submitted, setSubmitted] = useState(params.q ?? '')

  useEffect(() => {
    if (params.q) setSubmitted(params.q)
  }, [params.q])

  const showResults =
    params.filters === '1' || (submitted.length >= 2)

  if (!showResults) {
    return <SearchDiscoverView initialCategory={params.category} />
  }

  return (
    <SearchResultsView
      initialQuery={submitted}
      initialCategory={params.category}
      filtersOpen={params.filters === '1'}
      onClear={() => setSubmitted('')}
    />
  )
}
