# PMGInput

Universal text input component. Source lives at
[Input.vue](./Input.vue) in this layer and is auto-imported as
`<PMGInput>` (prefix `PMG`, no path segment) via the `components` entry in
[nuxt.config.ts](../../../nuxt.config.ts).

---

## Props Reference

| Prop          | Type                                                                                                                | Default  | Description                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `v-model`     | `string \| number \| null`                                                                                          | `null`   | The input's value.                                                                      |
| `type`        | `'text' \| 'email' \| 'password' \| 'number' \| 'tel' \| 'url' \| 'search' \| 'date' \| 'time' \| 'datetime-local'` | `'text'` | Native HTML input type. `'search'` shows a leading magnifying glass.                    |
| `name`        | `string`                                                                                                            | —        | Opt-in vee-validate field name (see [Validation](#validation-vee-validate--yup) below). |
| `label`       | `string`                                                                                                            | —        | Label text above the input.                                                             |
| `placeholder` | `string`                                                                                                            | —        | Placeholder text.                                                                       |
| `disabled`    | `boolean`                                                                                                           | `false`  | Disable the input.                                                                      |
| `required`    | `boolean`                                                                                                           | `false`  | Show required indicator (\*) on label.                                                  |
| `clearable`   | `boolean`                                                                                                           | `false`  | Show a clear (×) button when the input has a value.                                     |

## Events

| Event               | Payload                    | Description                                                        |
| ------------------- | -------------------------- | ------------------------------------------------------------------ |
| `update:modelValue` | `string \| number \| null` | Standard v-model event.                                            |
| `change`            | `string \| number \| null` | Emitted on every input change (same payload as modelValue update). |

---

## Usage

### Plain text input

```vue
<PMGInput v-model="name" label="Name" placeholder="Enter your name" clearable />
```

### Search input (magnifying glass on the left)

```vue
<PMGInput
  v-model="query"
  type="search"
  label="Search"
  placeholder="Search..."
  clearable
/>
```

### Other native types

```vue
<PMGInput v-model="email" type="email" label="Email" />
<PMGInput v-model="password" type="password" label="Password" />
<PMGInput v-model="age" type="number" label="Age" />
```

**Note:** when `type="number"`, the `v-model` value is emitted as a `number`
(or `null` when empty) instead of a string.

---

## Validation (vee-validate + yup)

`PMGInput` has opt-in [vee-validate](https://vee-validate.logaretm.com/v4/) support. Pass a
`name` prop and the component registers itself via `useField` internally:

```ts
useField(() => props.name, undefined, {
  syncVModel: true,
  validateOnValueUpdate: true,
});
```

- `syncVModel: true` keeps the field's value synced with the component's own `modelValue`
  prop/emit, so `v-model` (if you still use it) keeps working the same either way.
- If the component is rendered inside a component that calls `useForm()` (or inside a
  `<Form>`), it automatically joins that form — no extra wiring needed, and no `v-model`
  is required since the form tracks the value by `name`.
- If there's no surrounding form, `useField` still works standalone.
- The validation error message renders below the field once the field has been touched
  (blurred) and has an error.
- Without a `name` prop, the component behaves exactly like a plain `v-model` input —
  vee-validate is not involved at all.

```vue
<script setup lang="ts">
import { useForm } from "vee-validate";
import * as yup from "yup";

const validationSchema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
});

const { handleSubmit } = useForm({ validationSchema });
const onSubmit = handleSubmit((values) => {
  /* values.email */
});
</script>

<template>
  <form @submit.prevent="onSubmit">
    <PMGInput name="email" type="email" label="Email" required />
    <PMGButton type="submit">Submit</PMGButton>
  </form>
</template>
```
