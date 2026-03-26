import fs from 'fs'
import path from 'path'

const JOURNAL_DIR = path.join(process.cwd(), 'content/journal')

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

const template = (date: string) => `---
title: "Tag X — "
date: "${date}"
# banner: "/images/journal/${date}.jpg"
tags: []

# === GEWOHNHEITEN (Die drei Säulen) ===
habits:
  movement: "steps_only"    # minimal | steps_only | steps_trained
  nutrition: "two"          # none | one | two | three
  smoking: "none"           # smoked | replacement | none
---

Heute...

## Was ich heute gelernt habe

...

## Wie ich mich fühle

...
`

function createEntry() {
  const date = getTodayDate()
  const filePath = path.join(JOURNAL_DIR, `${date}.mdx`)

  if (!fs.existsSync(JOURNAL_DIR)) {
    fs.mkdirSync(JOURNAL_DIR, { recursive: true })
  }

  if (fs.existsSync(filePath)) {
    console.log(`Entry for ${date} already exists: ${filePath}`)
    return
  }

  fs.writeFileSync(filePath, template(date), 'utf8')
  console.log(`Created: ${filePath}`)
}

createEntry()
