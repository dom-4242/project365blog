'use client'

interface DatePickerProps {
  defaultValue: string
}

export function DatePicker({ defaultValue }: DatePickerProps) {
  return (
    <form method="get">
      <input
        type="date"
        name="date"
        defaultValue={defaultValue}
        onChange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
        className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
      />
    </form>
  )
}
