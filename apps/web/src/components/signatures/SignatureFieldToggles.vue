<script setup lang="ts">
import { computed } from 'vue';
import type { SignatureFieldToggles, Card } from '@/types';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: SignatureFieldToggles;
  card: Card;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: SignatureFieldToggles];
}>();

const { t } = useI18n();

type FieldKey = keyof SignatureFieldToggles;

const fields: FieldKey[] = [
  'avatar', 'phone', 'email', 'website', 'socials',
  'pronouns', 'calendar', 'disclaimer', 'cardLink',
];

const cardHasData = computed<Record<FieldKey, boolean>>(() => ({
  avatar: !!props.card.avatarPath,
  phone: Array.isArray(props.card.phones) && props.card.phones.length > 0,
  email: Array.isArray(props.card.emails) && props.card.emails.length > 0,
  website: Array.isArray(props.card.websites) && props.card.websites.length > 0,
  socials: Array.isArray(props.card.socialLinks) && props.card.socialLinks.length > 0,
  pronouns: !!props.card.pronouns,
  calendar: !!props.card.calendarUrl,
  disclaimer: true,
  cardLink: true,
}));

function toggle(field: FieldKey) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: !props.modelValue[field],
  });
}
</script>

<template>
  <fieldset class="field-toggles">
    <legend class="field-toggles__legend">{{ t('signatures.editor.fields') }}</legend>
    <label
      v-for="field in fields"
      :key="field"
      class="field-toggles__item"
      :class="{ 'field-toggles__item--disabled': !cardHasData[field] }"
    >
      <input
        type="checkbox"
        class="field-toggles__checkbox"
        :checked="modelValue[field]"
        :disabled="!cardHasData[field]"
        @change="toggle(field)"
      />
      <span class="field-toggles__label">
        {{ t(`signatures.editor.fieldLabels.${field}`) }}
      </span>
    </label>
  </fieldset>
</template>

<style scoped>
.field-toggles {
  border: none;
  padding: 0;
  margin: 0;
}

.field-toggles__legend {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.field-toggles__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  cursor: pointer;
}

.field-toggles__item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-toggles__checkbox {
  accent-color: var(--color-primary-500);
  cursor: inherit;
}

.field-toggles__label {
  font-size: var(--text-sm);
  color: var(--color-text);
}
</style>
