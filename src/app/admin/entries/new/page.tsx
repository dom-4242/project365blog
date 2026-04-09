import { EntryForm } from '@/components/admin/EntryForm'

export default function NewEntryPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-ctp-text mb-8">Neuer Eintrag</h1>
      <EntryForm mode="create" />
    </div>
  )
}
