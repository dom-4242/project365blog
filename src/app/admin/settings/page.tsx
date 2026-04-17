import { getProfile } from '@/lib/profile'
import { getPriorityPillar } from '@/lib/settings'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { PriorityPillarForm } from '@/components/admin/PriorityPillarForm'

export default async function SettingsPage() {
  const [profile, priorityPillar] = await Promise.all([
    getProfile(),
    getPriorityPillar(),
  ])

  const initial = {
    heightCm: profile.heightCm?.toString() ?? '',
    targetWeight: profile.targetWeight?.toString() ?? '',
    targetSteps: profile.targetSteps?.toString() ?? '',
    projectStartDate: profile.projectStartDate ?? '',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-on-surface">Einstellungen</h1>
        <p className="text-on-surface-variant text-sm mt-1">Statische Werte und persönliche Ziele.</p>
      </div>

      <SettingsForm initial={initial} />

      {/* Prioritäts-Säule */}
      <div className="mt-6 bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Prioritäts-Säule</h3>
        <p className="text-xs text-on-surface-variant mb-4">
          Die gewählte Säule wird auf der öffentlichen Startseite visuell hervorgehoben.
        </p>
        <PriorityPillarForm current={priorityPillar} />
      </div>
    </div>
  )
}
