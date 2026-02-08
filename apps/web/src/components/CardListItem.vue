<script setup lang="ts">
import type { Card } from '@/types';

const props = defineProps<{
  card: Card;
}>();

const emit = defineEmits<{
  edit: [id: string];
  delete: [id: string];
}>();

const publicUrl = `/c/${props.card.slug}`;

function copyLink() {
  navigator.clipboard.writeText(window.location.origin + publicUrl);
}
</script>

<template>
  <div class="card-item">
    <div class="card-item__avatar">
      <img
        v-if="card.avatarPath"
        :src="card.avatarPath"
        :alt="card.name"
        class="card-item__avatar-img"
      />
      <div v-else class="card-item__avatar-placeholder">
        {{ card.name.charAt(0).toUpperCase() }}
      </div>
    </div>
    <div class="card-item__info">
      <h3 class="card-item__name">{{ card.name }}</h3>
      <p v-if="card.jobTitle" class="card-item__detail">{{ card.jobTitle }}</p>
      <p v-if="card.company" class="card-item__detail card-item__company">{{ card.company }}</p>
      <p class="card-item__slug">/c/{{ card.slug }}</p>
    </div>
    <div class="card-item__actions">
      <button class="card-item__btn card-item__btn--edit" @click="emit('edit', card.id)">
        Edit
      </button>
      <a
        :href="publicUrl"
        target="_blank"
        rel="noopener"
        class="card-item__btn card-item__btn--preview"
      >
        Preview
      </a>
      <button class="card-item__btn card-item__btn--share" @click="copyLink">
        Share
      </button>
      <button class="card-item__btn card-item__btn--delete" @click="emit('delete', card.id)">
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped>
.card-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.card-item__avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
}

.card-item__avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.card-item__avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
  color: #666;
}

.card-item__info {
  flex: 1;
  min-width: 0;
}

.card-item__name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.card-item__detail {
  font-size: 0.875rem;
  color: #555;
  margin: 0;
}

.card-item__company {
  color: #777;
}

.card-item__slug {
  font-size: 0.75rem;
  color: #999;
  margin: 0;
}

.card-item__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.card-item__btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: #fff;
  font-size: 0.8125rem;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: inline-flex;
  align-items: center;
}

.card-item__btn:hover {
  background: #f5f5f5;
}

.card-item__btn--delete {
  color: #d32f2f;
  border-color: #d32f2f;
}

.card-item__btn--delete:hover {
  background: #fce4ec;
}

@media (max-width: 640px) {
  .card-item {
    flex-wrap: wrap;
  }

  .card-item__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
