<script setup lang="ts">
import { ref } from 'vue';
import { Upload } from 'lucide-vue-next';

const props = defineProps<{
  label: string;
  imageUrl: string | null;
  accept?: string;
}>();

const emit = defineEmits<{
  upload: [file: File];
  remove: [];
}>();

const dragOver = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function handleFiles(files: FileList | null) {
  if (files && files.length > 0) {
    emit('upload', files[0]);
  }
}

function onDrop(event: DragEvent) {
  dragOver.value = false;
  handleFiles(event.dataTransfer?.files ?? null);
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  dragOver.value = true;
}

function onDragLeave() {
  dragOver.value = false;
}

function openFileDialog() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  handleFiles(input.files);
  input.value = '';
}
</script>

<template>
  <div class="image-uploader">
    <label class="image-uploader__label">{{ label }}</label>
    <div
      v-if="!imageUrl"
      class="image-uploader__dropzone"
      :class="{ 'image-uploader__dropzone--active': dragOver }"
      @drop.prevent="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @click="openFileDialog"
    >
      <Upload :size="32" class="image-uploader__upload-icon" />
      <p class="image-uploader__text">
        Drag and drop an image here, or click to browse
      </p>
      <input
        ref="fileInput"
        type="file"
        :accept="accept || 'image/*'"
        class="image-uploader__file-input"
        @change="onFileChange"
      />
    </div>
    <div v-else class="image-uploader__preview">
      <img
        :src="imageUrl"
        :alt="label"
        class="image-uploader__preview-img"
      />
      <div class="image-uploader__preview-actions">
        <button
          type="button"
          class="image-uploader__change-btn"
          @click="openFileDialog"
        >
          Change
        </button>
        <button
          type="button"
          class="image-uploader__remove-btn"
          @click="emit('remove')"
        >
          Remove
        </button>
      </div>
      <input
        ref="fileInput"
        type="file"
        :accept="accept || 'image/*'"
        class="image-uploader__file-input"
        @change="onFileChange"
      />
    </div>
  </div>
</template>

<style scoped>
.image-uploader {
  margin-bottom: 1rem;
}

.image-uploader__label {
  display: block;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.image-uploader__dropzone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-4);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.image-uploader__dropzone:hover,
.image-uploader__dropzone--active {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
}

.image-uploader__upload-icon {
  color: var(--color-gray-300);
  margin-bottom: var(--space-2);
}

.image-uploader__text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.image-uploader__file-input {
  display: none;
}

.image-uploader__preview {
  position: relative;
  display: inline-block;
}

.image-uploader__preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: var(--radius-lg);
  object-fit: cover;
  display: block;
  box-shadow: var(--shadow-sm);
}

.image-uploader__preview-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.image-uploader__change-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
  cursor: pointer;
}

.image-uploader__change-btn:hover {
  background: var(--color-gray-100);
}

.image-uploader__remove-btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-size: var(--text-sm);
  cursor: pointer;
  color: var(--color-text-muted);
}

.image-uploader__remove-btn:hover {
  color: var(--color-error-500);
}
</style>
