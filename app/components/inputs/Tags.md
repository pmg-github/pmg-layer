# PMGTags

Tags input component for comma- or separator-based keyword entry. Source lives
at [Tags.vue](./Tags.vue) in this layer and is auto-imported as
`<PMGTags>` (prefix `PMG`, no path segment) via the `components` entry in
[nuxt.config.ts](../../../nuxt.config.ts).

---

## Props Reference

| Prop              | Type             | Default                      | Description                                                       |
| ----------------- | ---------------- | ---------------------------- | ----------------------------------------------------------------- |
| `v-model`         | `string \| null` | `null`                       | The serialized tags value, joined with `separator`.               |
| `name`            | `string`         | —                            | Opt-in vee-validate field name.                                   |
| `label`           | `string`         | —                            | Label text above the input.                                       |
| `placeholder`     | `string`         | `'Trefwoorden toevoegen...'` | Placeholder shown in the editable area.                           |
| `disabled`        | `boolean`        | `false`                      | Disable the component.                                            |
| `required`        | `boolean`        | `false`                      | Show required indicator (`*`) on label.                           |
| `clearable`       | `boolean`        | `false`                      | Show a clear (×) button when tags are present.                    |
| `separator`       | `string`         | `','`                        | String used when serializing the selected tags back to `v-model`. |
| `delimiters`      | `RegExp`         | `/[,;]/`                     | Pattern used to split typed / pasted text into multiple tags.     |
| `allowDuplicates` | `boolean`        | `false`                      | Allow repeated tags instead of de-duplicating identical values.   |

## Events

| Event               | Payload          | Description                                             |
| ------------------- | ---------------- | ------------------------------------------------------- |
| `update:modelValue` | `string \| null` | Standard v-model event with the serialized tags string. |
| `change`            | `string \| null` | Emitted whenever the tags change.                       |

---

## Usage

### Simple tags input

```vue
<PMGTags
  v-model="store.metaData.keywords"
  label="Trefwoorden"
  placeholder="Voeg trefwoorden toe"
  clearable
/>
```

### Custom separator output

```vue
<PMGTags v-model="seoKeywords" label="SEO trefwoorden" separator=", " />
```

### With vee-validate

```vue
<PMGTags name="keywords" label="Trefwoorden" required />
```

---

## Validation (vee-validate)

`PMGTags` has the same opt-in `vee-validate` integration pattern as
`PMGInput` and `PMGSelect`. Pass a `name` prop and it registers via
`useField()` internally with `syncVModel: true` and
`validateOnValueUpdate: true`.

- Without a `name` prop, it behaves as a plain `v-model` component.
- With a `name` prop, it shows the validation message below the control once
  the field has been touched and has an error.
