import { redirect } from 'next/navigation'

interface Props {
  params: { slug: string }
}

// Middleware handles locale redirect; this is a fallback.
export default function JournalRedirect({ params }: Props) {
  redirect(`/de/journal/${params.slug}`)
}
