# PMGTextarea

Multi-line text input. Source: [Textarea.vue](./Textarea.vue), auto-imported
as `<PMGTextarea>`.

| Prop          | Type             | Default | Description                            |
| ------------- | ---------------- | ------- | -------------------------------------- |
| `v-model`     | `string \| null` | `null`  | The textarea's value.                  |
| `label`       | `string`         | —       | Label text above the textarea.         |
| `placeholder` | `string`         | —       | Placeholder text.                      |
| `disabled`    | `boolean`        | `false` | Disable the textarea.                  |
| `required`    | `boolean`        | `false` | Show required indicator (\*) on label. |
| `rows`        | `number`         | `3`     | Number of visible text rows.           |

Events: `update:modelValue`, `change` — both emit `string | null`.

```vue
<PMGTextarea v-model="bio" label="Bio" placeholder="Tell us about yourself" />
```

---

# PMGSwitch

Boolean toggle switch. Source: [Switch.vue](./Switch.vue), auto-imported as
`<PMGSwitch>`. Built on Reka UI `SwitchRoot`/`SwitchThumb`.

| Prop       | Type      | Default | Description                            |
| ---------- | --------- | ------- | -------------------------------------- |
| `v-model`  | `boolean` | `false` | The switch's checked state.            |
| `label`    | `string`  | —       | Label text next to the switch.         |
| `disabled` | `boolean` | `false` | Disable the switch.                    |
| `required` | `boolean` | `false` | Show required indicator (\*) on label. |

Events: `update:modelValue`, `change` — both emit `boolean`.

```vue
<PMGSwitch v-model="notificationsEnabled" label="Enable notifications" />
```

---

# PMGCheckbox

Single boolean checkbox. Source: [Checkbox.vue](./Checkbox.vue), auto-imported
as `<PMGCheckbox>`. Built on Reka UI `CheckboxRoot`/`CheckboxIndicator`.

| Prop       | Type      | Default | Description                            |
| ---------- | --------- | ------- | -------------------------------------- |
| `v-model`  | `boolean` | `false` | The checkbox's checked state.          |
| `label`    | `string`  | —       | Label text next to the checkbox.       |
| `disabled` | `boolean` | `false` | Disable the checkbox.                  |
| `required` | `boolean` | `false` | Show required indicator (\*) on label. |

Events: `update:modelValue`, `change` — both emit `boolean`.

```vue
<PMGCheckbox v-model="agreedToTerms" label="I agree to the terms" />
```

---

# PMGRadioGroup

Group of mutually-exclusive radio options, using the same `options` /
`optionLabel` / `optionValue` accessor pattern as [PMGSelect](./Select.md).
Source: [RadioGroup.vue](./RadioGroup.vue), auto-imported as
`<PMGRadioGroup>`. Built on Reka UI `RadioGroupRoot`/`RadioGroupItem`/
`RadioGroupIndicator`.

| Prop          | Type                         | Default       | Description                            |
| ------------- | ---------------------------- | ------------- | -------------------------------------- |
| `v-model`     | `V \| null`                  | `null`        | The selected option's value.           |
| `options`     | `T[]`                        | —             | List of options (required).            |
| `optionLabel` | `(option: T) => string`      | `key`/`label` | Extracts display text from an option.  |
| `optionValue` | `(option: T) => V`           | `value`/`id`  | Extracts the raw value from an option. |
| `label`       | `string`                     | —             | Label text above the group.            |
| `disabled`    | `boolean`                    | `false`       | Disable the whole group.               |
| `required`    | `boolean`                    | `false`       | Show required indicator (\*) on label. |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'`  | Layout direction of the options.       |

Events: `update:modelValue`, `change` — both emit the selected value.

```vue
<PMGRadioGroup
  v-model="deliveryMethod"
  :options="[
    { label: 'Standard', value: 'standard' },
    { label: 'Express', value: 'express' },
    { label: 'Overnight', value: 'overnight' },
  ]"
  label="Delivery method"
/>
```

---

# PMGTags

Tag input for comma- or separator-based keyword entry. Source:
[Tags.vue](./Tags.vue), auto-imported as `<PMGTags>`. Built on Reka UI
`TagsInputRoot` primitives.

| Prop              | Type             | Default                      | Description                                      |
| ----------------- | ---------------- | ---------------------------- | ------------------------------------------------ |
| `v-model`         | `string \| null` | `null`                       | Serialized tag string joined by `separator`.     |
| `name`            | `string`         | —                            | Opt-in vee-validate field name.                  |
| `label`           | `string`         | —                            | Label text above the input.                      |
| `placeholder`     | `string`         | `'Trefwoorden toevoegen...'` | Placeholder text in the editable area.           |
| `disabled`        | `boolean`        | `false`                      | Disable the component.                           |
| `required`        | `boolean`        | `false`                      | Show required indicator (`*`) on label.          |
| `clearable`       | `boolean`        | `false`                      | Show a clear (×) button when tags exist.         |
| `separator`       | `string`         | `','`                        | Output separator used in the serialized value.   |
| `delimiters`      | `RegExp`         | `/[,;]/`                     | Pattern used to split typed or pasted tag input. |
| `allowDuplicates` | `boolean`        | `false`                      | Allow repeated tags.                             |

Events: `update:modelValue`, `change` — both emit `string | null`.

```vue
<PMGTags
  v-model="keywords"
  label="Trefwoorden"
  placeholder="Voeg trefwoorden toe"
  clearable
/>
```
