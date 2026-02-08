<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen p-8">
    <h1 class="text-2xl font-bold mb-4">Edit Card</h1>
    <p class="text-gray-600">Card ID: {{ route.params.id }}</p>
  </div>
</template>
