<script setup lang="ts">
import { X, Plus } from 'lucide-vue-next';
import type { Phone, Email, Address } from '@/types';

const props = defineProps<{
  phones: Phone[];
  emails: Email[];
  address: Address;
}>();

const emit = defineEmits<{
  addPhone: [];
  removePhone: [index: number];
  addEmail: [];
  removeEmail: [index: number];
  'update:address': [address: Address];
}>();

function updateAddress(field: keyof Address, value: string) {
  emit('update:address', { ...props.address, [field]: value });
}
</script>

<template>
  <div class="contact-fields">
    <fieldset class="contact-fields__group">
      <legend class="contact-fields__legend">Phone Numbers</legend>
      <div
        v-for="(phone, index) in phones"
        :key="index"
        class="contact-fields__row"
      >
        <input
          v-model="phone.number"
          type="tel"
          placeholder="Phone number"
          class="contact-fields__input contact-fields__input--phone"
        />
        <input
          v-model="phone.label"
          type="text"
          placeholder="Label (e.g. Work)"
          class="contact-fields__input contact-fields__input--label"
        />
        <button
          type="button"
          class="contact-fields__remove-btn"
          @click="emit('removePhone', index)"
        >
          <X :size="14" />
        </button>
      </div>
      <button
        type="button"
        class="contact-fields__add-btn"
        @click="emit('addPhone')"
      >
        <Plus :size="14" /> Add Phone
      </button>
    </fieldset>

    <fieldset class="contact-fields__group">
      <legend class="contact-fields__legend">Email Addresses</legend>
      <div
        v-for="(email, index) in emails"
        :key="index"
        class="contact-fields__row"
      >
        <input
          v-model="email.email"
          type="email"
          placeholder="Email address"
          class="contact-fields__input contact-fields__input--email"
        />
        <input
          v-model="email.label"
          type="text"
          placeholder="Label (e.g. Personal)"
          class="contact-fields__input contact-fields__input--label"
        />
        <button
          type="button"
          class="contact-fields__remove-btn"
          @click="emit('removeEmail', index)"
        >
          <X :size="14" />
        </button>
      </div>
      <button
        type="button"
        class="contact-fields__add-btn"
        @click="emit('addEmail')"
      >
        <Plus :size="14" /> Add Email
      </button>
    </fieldset>

    <fieldset class="contact-fields__group">
      <legend class="contact-fields__legend">Address</legend>
      <div class="contact-fields__address-grid">
        <input
          :value="address.street"
          type="text"
          placeholder="Street"
          class="contact-fields__input contact-fields__input--full"
          @input="updateAddress('street', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="address.city"
          type="text"
          placeholder="City"
          class="contact-fields__input"
          @input="updateAddress('city', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="address.zip"
          type="text"
          placeholder="ZIP / Postal Code"
          class="contact-fields__input"
          @input="updateAddress('zip', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="address.country"
          type="text"
          placeholder="Country"
          class="contact-fields__input contact-fields__input--full"
          @input="updateAddress('country', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.contact-fields__group {
  border: none;
  padding: 0;
  margin-bottom: var(--space-4);
}

.contact-fields__legend {
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  padding: 0;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.contact-fields__row {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  align-items: center;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.contact-fields__input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  flex: 1;
}

.contact-fields__input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.contact-fields__input--label {
  max-width: 160px;
}

.contact-fields__input--full {
  width: 100%;
}

.contact-fields__address-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.contact-fields__address-grid .contact-fields__input--full {
  grid-column: 1 / -1;
}

.contact-fields__add-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  font-size: var(--text-sm);
  cursor: pointer;
  color: var(--color-primary-600);
  margin-top: 0.25rem;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.contact-fields__add-btn:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-500);
}

.contact-fields__remove-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.contact-fields__remove-btn:hover {
  color: var(--color-error-500);
  background: var(--color-error-50);
}
</style>
