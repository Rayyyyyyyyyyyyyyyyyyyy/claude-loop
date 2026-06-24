<script setup lang="ts">
import type { DigestItem } from '../types/digest'

defineProps<{ item: DigestItem }>()
</script>

<template>
  <article class="entry">
    <h3 class="entry-title">{{ item.title }}</h3>
    <p v-if="item.category" class="entry-category">{{ item.category }}</p>
    <p class="entry-summary">{{ item.summary }}</p>
    <ul v-if="item.sources.length" class="entry-sources">
      <li v-for="(s, i) in item.sources" :key="i">
        <a :href="s.url" target="_blank" rel="noopener noreferrer">{{ s.title || s.url }}</a>
      </li>
    </ul>
  </article>
</template>
