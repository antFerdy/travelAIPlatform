import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// Каждый тест независим: см. ai-rules/frontend.md → Output Contracts → Tests
beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})
