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
      <div className="flex gap-1 border-b border-sand-200 dark:border-ctp-surface0 mb-8">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-t-lg -mb-px border-b-2 transition-colors duration-150',
              activeTab === id
                ? 'border-ctp-peach text-ctp-peach'
                : 'border-transparent text-sand-500 hover:text-ctp-text hover:border-sand-300 dark:hover:border-ctp-surface2'
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
