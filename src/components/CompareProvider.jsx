'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'cristasur:compare:v1'
const MAX_ITEMS = 3

const CompareContext = createContext(null)

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare debe usarse dentro de <CompareProvider>')
  return ctx
}

export default function CompareProvider({ children }) {
  const [compareItems, setCompareItems] = useState([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setCompareItems(parsed)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems))
    } catch {}
  }, [compareItems, hydrated])

  const addToCompare = useCallback((product) => {
    setCompareItems((prev) => {
      if (prev.length >= MAX_ITEMS) return prev
      if (prev.some((p) => String(p._id) === String(product._id))) return prev
      return [...prev, product]
    })
  }, [])

  const removeFromCompare = useCallback((id) => {
    setCompareItems((prev) => prev.filter((p) => String(p._id) !== String(id)))
  }, [])

  const clearCompare = useCallback(() => setCompareItems([]), [])

  const isInCompare = useCallback(
    (id) => compareItems.some((p) => String(p._id) === String(id)),
    [compareItems]
  )

  const value = useMemo(
    () => ({ compareItems, addToCompare, removeFromCompare, clearCompare, isInCompare }),
    [compareItems, addToCompare, removeFromCompare, clearCompare, isInCompare]
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}
