'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

type TabId = 'entries' | 'habits' | 'metrics'

interface HomeTabsProps {
  labels: { entries: string; habits: string; metrics: string }
  entriesContent: React.ReactNode
  habitsContent: React.ReactNode
  metricsContent: React.ReactNode
}

export function HomeTabs({ labels, entriesContent, habitsContent, metricsContent }: HomeTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('entries')

  const tabs: { id: TabId; label: string }[] = [
    { id: 'entries', label: labels.entries },
    { id: 'habits',  label: labels.habits },
    { id: 'metrics', label: labels.metrics },
  ]

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-0 border-b border-outline-variant/15 mb-8">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase -mb-px border-b-2 transition-colors duration-150',
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div hidden={activeTab !== 'entries'}>{entriesContent}</div>
      <div hidden={activeTab !== 'habits'}>{habitsContent}</div>
      <div hidden={activeTab !== 'metrics'}>{metricsContent}</div>
    </div>
  )
}
