'use client'

import { createContext, useContext, useState } from 'react'

const CategoryMenuContext = createContext()

export const useCategoryMenu = () => {
  const context = useContext(CategoryMenuContext)
  if (!context) {
    throw new Error('useCategoryMenu must be used within a CategoryMenuProvider')
  }
  return context
}

export const CategoryMenuProvider = ({ children }) => {
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({})

  const toggleCategoryMenu = () => {
    setIsCategoryMenuOpen(!isCategoryMenuOpen)
  }

  const closeCategoryMenu = () => {
    setIsCategoryMenuOpen(false)
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      // If the clicked category is already expanded, collapse it
      if (prev[categoryId]) {
        return { [categoryId]: false }
      }
      // If it's collapsed, expand it and collapse all others
      return { [categoryId]: true }
    })
  }

  const value = {
    isCategoryMenuOpen,
    expandedCategories,
    toggleCategoryMenu,
    closeCategoryMenu,
    toggleCategory,
    setExpandedCategories
  }

  return (
    <CategoryMenuContext.Provider value={value}>
      {children}
    </CategoryMenuContext.Provider>
  )
}
