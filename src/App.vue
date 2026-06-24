<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="page">
    <header class="masthead">
      <RouterLink to="/" class="masthead-title">每日日報</RouterLink>
      <nav class="masthead-nav">
        <RouterLink to="/">今日</RouterLink>
        <RouterLink to="/archive">歷史歸檔</RouterLink>
      </nav>
      <p class="masthead-note">本日報由 AI（Gemini + Google Search）自動彙整，每則內容皆附可考究來源，請自行查證。</p>
    </header>

    <main class="content">
      <RouterView />
    </main>

    <footer class="colophon">
      <p>每日日報 ・ 自動產生於台北時間每日清晨</p>
    </footer>
  </div>
</template>
