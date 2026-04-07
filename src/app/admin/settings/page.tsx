import { getProfile } from '@/lib/profile'
import { SettingsForm } from '@/components/admin/SettingsForm'

export default async function SettingsPage() {
  const profile = await getProfile()

  const initial = {
    heightCm: profile.heightCm?.toString() ?? '',
    targetWeight: profile.targetWeight?.toString() ?? '',
    targetSteps: profile.targetSteps?.toString() ?? '',
    projectStartDate: profile.projectStartDate ?? '',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#1a1714] dark:text-[#faf9f7]">Einstellungen</h1>
        <p className="text-sand-500 text-sm mt-1">Statische Werte und persönliche Ziele.</p>
      </div>

      <SettingsForm initial={initial} />
    </div>
  )
}
