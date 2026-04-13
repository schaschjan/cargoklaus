'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

const CONSENT_KEY = 'cookie-consent'
type ConsentValue = 'granted' | 'denied'

function updateConsent(value: ConsentValue) {
  window.gtag?.('consent', 'update', {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  })
}

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY) as ConsentValue | null
    if (!saved) {
      setShow(true)
      return
    }
    // Restore previous choice — runs before user interacts again
    updateConsent(saved)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'granted')
    updateConsent('granted')
    setShow(false)
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'denied')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="bg-background fixed right-0 bottom-0 left-0 z-50 border-t p-4 shadow-lg">
      <div className="container flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          We use cookies to analyse site traffic and improve your experience. See our{' '}
          <a className="hover:text-foreground underline underline-offset-4" href="/privacy">
            privacy policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={decline}>
            Decline
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
