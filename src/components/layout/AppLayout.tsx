import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

const HEADER_HEIGHT = 96

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isChromeVisible, setIsChromeVisible] = useState(true)
  const location = useLocation()

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isMobileViewport = window.innerWidth <= 768

      if (!isMobileViewport) {
        setIsChromeVisible(true)
        lastScrollY = currentScrollY
        return
      }

      if (currentScrollY <= 24) {
        setIsChromeVisible(true)
      } else if (currentScrollY > lastScrollY + 8) {
        setIsChromeVisible(false)
      } else if (currentScrollY < lastScrollY - 8) {
        setIsChromeVisible(true)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] text-[var(--color-text)] md:pl-[232px]">
      <Sidebar isChromeVisible={isChromeVisible} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header isChromeVisible={isChromeVisible} onMenuToggle={() => setIsSidebarOpen(true)} />

      <main
        className="min-w-0 px-4 pb-6 pt-[112px] sm:px-5 md:px-6 md:pt-[120px]"
        style={{
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          scrollMarginTop: HEADER_HEIGHT,
        }}
      >
        <div className="mx-auto max-w-[1208px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
