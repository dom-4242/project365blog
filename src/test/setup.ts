import '@testing-library/jest-dom'
import { vi } from 'vitest'

// React 18.3's server-only `cache` API is provided by the Next.js runtime but is
// `undefined` in the plain vitest/jsdom React build. Fill it in with an identity
// wrapper so server libs that call `cache()` at module scope (e.g. lib/settings)
// can be imported by logic tests without pulling in the Next runtime.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    cache: actual.cache ?? (<T>(fn: T): T => fn),
  }
})
