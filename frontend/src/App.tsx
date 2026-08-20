import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { ApiError } from '@/api'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { Footer, Header } from '@/components/layout/Layout'
import { BookingPage } from '@/pages/BookingPage'
import { BookingSuccessPage } from '@/pages/BookingSuccessPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { TourDetailsPage } from '@/pages/TourDetailsPage'
import { ToursPage } from '@/pages/ToursPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Повторять запрос при 404 бессмысленно — ресурса нет.
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status === 404 ? false : failureCount < 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Header />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/tours" replace />} />
              <Route path="/tours" element={<ToursPage />} />
              <Route path="/tours/:tourId" element={<TourDetailsPage />} />
              <Route path="/tours/:tourId/book" element={<BookingPage />} />
              <Route path="/bookings/:bookingId" element={<BookingSuccessPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          <Footer />

          <ChatWidget />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
