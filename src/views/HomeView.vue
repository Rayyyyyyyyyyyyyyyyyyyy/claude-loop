<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { latestDigest } from '../lib/digest'
import SectionBlock from '../components/SectionBlock.vue'

const digest = latestDigest()
</script>

<template>
  <div v-if="digest">
    <p class="dateline">{{ digest.date }} ・ 今日日報</p>
    <SectionBlock v-for="s in digest.sections" :key="s.id" :section="s" />
    <p class="more"><RouterLink to="/archive">瀏覽歷史歸檔 →</RouterLink></p>
  </div>
  <p v-else class="empty">尚無日報。</p>
</template>
