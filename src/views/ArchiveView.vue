<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { allDates } from '../lib/digest'
import { isoWeek } from '../lib/week'

interface WeekGroup {
  key: string
  start: string
  end: string
  dates: string[]
}

const groups: WeekGroup[] = (() => {
  const map = new Map<string, WeekGroup>()
  for (const date of allDates()) {
    const w = isoWeek(date)
    let g = map.get(w.key)
    if (!g) {
      g = { key: w.key, start: w.start, end: w.end, dates: [] }
      map.set(w.key, g)
    }
    g.dates.push(date)
  }
  const arr = [...map.values()]
  arr.sort((a, b) => (a.start < b.start ? 1 : -1)) // 週新到舊
  for (const g of arr) g.dates.sort((a, b) => (a < b ? 1 : -1)) // 組內新到舊
  return arr
})()
</script>

<template>
  <div>
    <p class="dateline">歷史歸檔</p>
    <p v-if="!groups.length" class="empty">尚無日報。</p>
    <section v-for="g in groups" :key="g.key" class="week">
      <h2 class="week-title">{{ g.start }} – {{ g.end }}<span class="week-key">{{ g.key }}</span></h2>
      <ul class="week-dates">
        <li v-for="d in g.dates" :key="d">
          <RouterLink :to="`/${d}`">{{ d }}</RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>
