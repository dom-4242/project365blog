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
      <div className="flex gap-1 border-b border-surface-container-high border-surface-container mb-8">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-t-lg -mb-px border-b-2 transition-colors duration-150',
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline hover:border-surface-container-highest'
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
