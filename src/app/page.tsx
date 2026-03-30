import { redirect } from 'next/navigation'

// Middleware handles the locale redirect, but this is a fallback
// in case a request reaches this page without going through middleware.
export default function RootPage() {
  redirect('/de')
}
