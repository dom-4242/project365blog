import { EntryForm } from '@/components/admin/EntryForm'
import { getMealLog } from '@/lib/meal-log'
import { zurichDateStr } from '@/lib/timezone'

export default async function NewEntryPage() {
  const mealLog = await getMealLog(zurichDateStr())

  return (
    <div className="max-w-3xl">
      <h1 className="font-headline text-2xl font-bold text-on-surface mb-8">Neuer Eintrag</h1>
      <EntryForm mode="create" mealLog={mealLog} />
    </div>
  )
}
