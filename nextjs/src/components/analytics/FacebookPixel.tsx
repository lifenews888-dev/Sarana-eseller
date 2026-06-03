'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void
    _fbq: unknown
  }
}

function PixelPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'PageView')
    }
  }, [pathname, searchParams])

  return null
}

export function FacebookPixel() {
  if (!PIXEL_ID) return null

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <Suspense fallback={null}>
        <PixelPageView />
      </Suspense>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

// Event helpers — import and call from any client component
export const fbEvent = {
  viewContent: (product: { id: string; name: string; price: number }) => {
    if (typeof window?.fbq === 'undefined') return
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'MNT',
    })
  },
  addToCart: (product: { id: string; name: string; price: number; qty: number }) => {
    if (typeof window?.fbq === 'undefined') return
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * product.qty,
      currency: 'MNT',
      num_items: product.qty,
    })
  },
  initiateCheckout: (total: number, items: number) => {
    if (typeof window?.fbq === 'undefined') return
    window.fbq('track', 'InitiateCheckout', {
      value: total,
      currency: 'MNT',
      num_items: items,
    })
  },
  purchase: (orderId: string, total: number) => {
    if (typeof window?.fbq === 'undefined') return
    window.fbq('track', 'Purchase', {
      value: total,
      currency: 'MNT',
      order_id: orderId,
    })
  },
  search: (query: string) => {
    if (typeof window?.fbq === 'undefined') return
    window.fbq('track', 'Search', { search_string: query })
  },
  register: () => {
    if (typeof window?.fbq === 'undefined') return
    window.fbq('track', 'CompleteRegistration')
  },
}
