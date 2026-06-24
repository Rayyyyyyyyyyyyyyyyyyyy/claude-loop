<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { digestByDate } from '../lib/digest'
import SectionBlock from '../components/SectionBlock.vue'

const route = useRoute()
const date = computed(() => String(route.params.date ?? ''))
const digest = computed(() => digestByDate(date.value))
</script>

<template>
  <div v-if="digest">
    <p class="dateline">{{ digest.date }} 日報</p>
    <SectionBlock v-for="s in digest.sections" :key="s.id" :section="s" />
    <p class="more"><RouterLink to="/archive">← 回歷史歸檔</RouterLink></p>
  </div>
  <div v-else class="empty">
    <p>找不到 {{ date }} 的日報。</p>
    <p>
      <RouterLink to="/">回今日</RouterLink>
      ・
      <RouterLink to="/archive">歷史歸檔</RouterLink>
    </p>
  </div>
</template>
