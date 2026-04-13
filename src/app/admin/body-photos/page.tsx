import { prisma } from '@/lib/db'
import { BodyPhotoGallery } from '@/components/admin/BodyPhotoGallery'

export const dynamic = 'force-dynamic'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default async function BodyPhotosPage() {
  const photosRaw = await prisma.bodyPhoto.findMany({
    orderBy: { date: 'desc' },
    select: { id: true, date: true, category: true, notes: true },
  })

  const photos = photosRaw.map((p) => ({
    id: p.id,
    date: p.date.toISOString().slice(0, 10),
    category: p.category,
    notes: p.notes,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Foto-Galerie</h1>
        <p className="text-on-surface-variant text-sm">
          Private Körperaufnahmen — nur im Admin sichtbar, Bilder ausserhalb von public/
        </p>
      </div>
      <BodyPhotoGallery photos={photos} todayDate={todayString()} />
    </div>
  )
}
