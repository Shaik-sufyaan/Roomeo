"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

interface SearchParamsHandlerProps {
  onMessage: (message: { type: 'error' | 'success', text: string } | null) => void
}

export default function SearchParamsHandler({ onMessage }: SearchParamsHandlerProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams?.get('error')
    const urlErrorDescription = searchParams?.get('error_description')
    const urlMessage = searchParams?.get('message')

    if (urlError) {
      onMessage({
        type: 'error',
        text: urlErrorDescription || urlError
      })

      // Clear URL parameters after showing message
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      url.searchParams.delete('error_description')
      window.history.replaceState({}, '', url.toString())
    } else if (urlMessage) {
      onMessage({
        type: 'success',
        text: urlMessage
      })

      // Clear URL parameters after showing message
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }

    // Auto-hide message after 8 seconds
    if (urlError || urlMessage) {
      setTimeout(() => {
        onMessage(null)
      }, 8000)
    }
  }, [searchParams, onMessage])

  return null
}