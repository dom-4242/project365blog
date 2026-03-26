interface JournalPostPageProps {
  params: {
    slug: string
  }
}

export default function JournalPostPage({ params }: JournalPostPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">{params.slug}</h1>
    </div>
  )
}
