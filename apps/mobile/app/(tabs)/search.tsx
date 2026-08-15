import { useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { SearchDiscoverView } from '@/src/components/SearchDiscoverView'
import SearchResultsView from '@/src/screens/SearchResultsView'

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? ''
  return value?.trim() ?? ''
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string | string[]; category?: string | string[]; filters?: string | string[] }>()
  const queryFromParams = useMemo(() => paramString(params.q), [params.q])
  const categoryFromParams = useMemo(() => paramString(params.category), [params.category])
  const filtersOpen = paramString(params.filters) === '1'
  const [submitted, setSubmitted] = useState(queryFromParams)

  useEffect(() => {
    if (queryFromParams) setSubmitted(queryFromParams)
  }, [queryFromParams])

  const showResults = filtersOpen || submitted.length >= 2

  if (!showResults) {
    return <SearchDiscoverView initialCategory={categoryFromParams} />
  }

  return (
    <SearchResultsView
      initialQuery={submitted}
      initialCategory={categoryFromParams}
      filtersOpen={filtersOpen}
      onClear={() => setSubmitted('')}
    />
  )
}
