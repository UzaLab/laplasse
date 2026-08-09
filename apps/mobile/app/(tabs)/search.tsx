import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { SearchDiscoverView } from '@/src/components/SearchDiscoverView'
import SearchResultsView from '@/src/screens/SearchResultsView'

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>()
  const [submitted, setSubmitted] = useState(params.q ?? '')

  useEffect(() => {
    if (params.q) setSubmitted(params.q)
  }, [params.q])

  if (!submitted || submitted.length < 2) {
    return <SearchDiscoverView initialCategory={params.category} />
  }

  return (
    <SearchResultsView
      initialQuery={submitted}
      initialCategory={params.category}
      onClear={() => setSubmitted('')}
    />
  )
}
