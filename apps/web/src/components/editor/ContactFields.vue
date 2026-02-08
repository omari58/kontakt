<script setup lang="ts">
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
          Remove
        </button>
      </div>
      <button
        type="button"
        class="contact-fields__add-btn"
        @click="emit('addPhone')"
      >
        + Add Phone
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
          Remove
        </button>
      </div>
      <button
        type="button"
        class="contact-fields__add-btn"
        @click="emit('addEmail')"
      >
        + Add Email
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
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.contact-fields__legend {
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0 0.5rem;
  color: #333;
}

.contact-fields__row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.contact-fields__input {
  padding: 0.5rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.875rem;
  flex: 1;
}

.contact-fields__input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.15);
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
  gap: 0.5rem;
}

.contact-fields__address-grid .contact-fields__input--full {
  grid-column: 1 / -1;
}

.contact-fields__add-btn {
  padding: 0.375rem 0.75rem;
  border: 1px dashed #d0d0d0;
  border-radius: 4px;
  background: transparent;
  font-size: 0.8125rem;
  cursor: pointer;
  color: #0066cc;
  margin-top: 0.25rem;
}

.contact-fields__add-btn:hover {
  background: #f0f7ff;
  border-color: #0066cc;
}

.contact-fields__remove-btn {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d32f2f;
  border-radius: 4px;
  background: transparent;
  font-size: 0.75rem;
  cursor: pointer;
  color: #d32f2f;
  flex-shrink: 0;
}

.contact-fields__remove-btn:hover {
  background: #fce4ec;
}
</style>
