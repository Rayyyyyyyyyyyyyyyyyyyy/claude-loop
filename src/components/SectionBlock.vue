<script setup lang="ts">
import type { DigestSection } from '../types/digest'
import DigestEntry from './DigestEntry.vue'

defineProps<{ section: DigestSection }>()
</script>

<template>
  <section class="section">
    <h2 class="section-title">{{ section.title }}</h2>
    <p v-if="section.status === 'error'" class="section-note">本版面今日產生失敗。</p>
    <p v-else-if="!section.items.length" class="section-note">本版面今日無可考究來源的內容。</p>
    <div v-else class="section-items">
      <DigestEntry v-for="(item, i) in section.items" :key="i" :item="item" />
    </div>
  </section>
</template>
