<script setup lang="ts">
import { computed } from 'vue';
import type { SignatureFieldToggles, Card } from '@/types';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: SignatureFieldToggles;
  card: Card;
  selectedPhones: number[];
  selectedEmails: number[];
  selectedWebsites: number[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: SignatureFieldToggles];
  'update:selectedPhones': [value: number[]];
  'update:selectedEmails': [value: number[]];
  'update:selectedWebsites': [value: number[]];
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

function togglePhone(index: number) {
  const current = props.selectedPhones;
  const next = current.includes(index)
    ? current.filter((i) => i !== index)
    : [...current, index].sort();
  emit('update:selectedPhones', next);
}

function toggleEmail(index: number) {
  const current = props.selectedEmails;
  const next = current.includes(index)
    ? current.filter((i) => i !== index)
    : [...current, index].sort();
  emit('update:selectedEmails', next);
}

function toggleWebsite(index: number) {
  const current = props.selectedWebsites;
  const next = current.includes(index)
    ? current.filter((i) => i !== index)
    : [...current, index].sort();
  emit('update:selectedWebsites', next);
}
</script>

<template>
  <fieldset class="field-toggles">
    <legend class="field-toggles__legend">{{ t('signatures.editor.fields') }}</legend>
    <template v-for="field in fields" :key="field">
      <label
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

      <!-- Phone sub-items -->
      <template v-if="field === 'phone' && modelValue.phone && card.phones && card.phones.length > 1">
        <label
          v-for="(phone, i) in card.phones"
          :key="'phone-' + i"
          class="field-toggles__sub-item"
        >
          <input
            type="checkbox"
            class="field-toggles__checkbox"
            :checked="selectedPhones.includes(i)"
            @change="togglePhone(i)"
          />
          <span class="field-toggles__sub-label">
            {{ phone.number }}<template v-if="phone.label"> ({{ phone.label }})</template>
          </span>
        </label>
      </template>

      <!-- Email sub-items -->
      <template v-if="field === 'email' && modelValue.email && card.emails && card.emails.length > 1">
        <label
          v-for="(email, i) in card.emails"
          :key="'email-' + i"
          class="field-toggles__sub-item"
        >
          <input
            type="checkbox"
            class="field-toggles__checkbox"
            :checked="selectedEmails.includes(i)"
            @change="toggleEmail(i)"
          />
          <span class="field-toggles__sub-label">
            {{ email.email }}<template v-if="email.label"> ({{ email.label }})</template>
          </span>
        </label>
      </template>

      <!-- Website sub-items -->
      <template v-if="field === 'website' && modelValue.website && card.websites && card.websites.length > 1">
        <label
          v-for="(site, i) in card.websites"
          :key="'website-' + i"
          class="field-toggles__sub-item"
        >
          <input
            type="checkbox"
            class="field-toggles__checkbox"
            :checked="selectedWebsites.includes(i)"
            @change="toggleWebsite(i)"
          />
          <span class="field-toggles__sub-label">
            {{ site.label || site.url }}
          </span>
        </label>
      </template>
    </template>
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

.field-toggles__sub-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  padding-left: var(--space-6);
  cursor: pointer;
}

.field-toggles__checkbox {
  accent-color: var(--color-primary-500);
  cursor: inherit;
}

.field-toggles__label {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.field-toggles__sub-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
</style>
