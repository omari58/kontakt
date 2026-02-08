<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div>
    <h1>Edit Card</h1>
    <p>Card ID: {{ route.params.id }}</p>
  </div>
</template>
