'use client'

import { createContext, useContext, useState } from 'react'

const SearchContext = createContext()

export const SearchProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState([])
  const [currentSearchQuery, setCurrentSearchQuery] = useState('')
  const [isSearchResultsLoading, setIsSearchResultsLoading] = useState(false)

  return (
    <SearchContext.Provider value={{
      searchResults,
      setSearchResults,
      currentSearchQuery,
      setCurrentSearchQuery,
      isSearchResultsLoading,
      setIsSearchResultsLoading
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider')
  }
  return context
}

