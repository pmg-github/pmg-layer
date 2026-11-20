# nuxt-layer-starter

A reusable **Nuxt 4 layer** — shared components, composables, utils, server utils
and config that you `extends` into your real projects instead of copy-pasting
boilerplate between them.

## What's inside

```
nuxt-layer-starter/
├── app/
│   ├── components/       # auto-imported components (Button.vue)
│   ├── composables/      # auto-imported composables (useLayerCounter)
│   ├── utils/             # auto-imported plain utils (formatDate)
│   ├── plugins/           # auto-registered Nuxt plugins (layer-info)
│   ├── assets/css/         # shared global CSS
│   └── app.config.ts        # shared, mergeable reactive app config
├── stores/                    # Pinia stores (useLayerPreferencesStore)
├── i18n.config.ts              # shared i18n messages and defaults
├── server/utils/              # auto-imported Nitro server utils
├── nuxt.config.ts               # shared modules / css / runtimeConfig defaults
├── .playground/                   # a throwaway Nuxt app for developing this layer in isolation
└── package.json
```

This follows Nuxt 4's default directory structure: application code lives under
`app/`, while `nuxt.config.ts`, `server/`, and `public/` stay at the project root.
A layer is just a Nuxt app, which is why it's easy to author and test on its own.

## Developing this layer standalone

The `.playground` folder is a minimal Nuxt app that extends `..` (this layer),
so you can run and see your changes live without needing a consumer project.

```bash
npm install
npm run dev          # starts .playground with this layer applied
```

## Using this layer in another project

Your consuming project also needs to be on Nuxt 4 (or Nuxt 3 with
`future.compatibilityVersion: 4` set) for the `app/` directory to resolve correctly.

**Option A — local path** (monorepo / sibling folder):

```ts
// consuming-project/nuxt.config.ts
export default defineNuxtConfig({
  extends: ["../nuxt-layer-starter"],
});
```

**Option B — installed npm package** (publish this repo, or `npm link` locally):

```bash
npm install @yourscope/nuxt-layer-starter
```

```ts
export default defineNuxtConfig({
  extends: ["@yourscope/nuxt-layer-starter"],
});
```

**Option C — git repository** (no publishing needed):

```ts
export default defineNuxtConfig({
  extends: ["github:yourname/nuxt-layer-starter"],
});
```

**Option D — local layers directory** (auto-registered, no `extends` needed):

Drop this folder into your project's `~~/layers/` directory and Nuxt registers
it automatically.

Once extended, the consuming project automatically gets:

- `<PMGButton />` component
- `<PMGSelect />` universal select/combobox component (see [Select.md](./app/components/inputs/Select.md))
- `<PMGInput />` universal text input component (see [Input.md](./app/components/inputs/Input.md))
- `<PMGTextarea />`, `<PMGSwitch />`, `<PMGCheckbox />`, `<PMGRadioGroup />` form controls (see [FormControls.md](./app/components/inputs/FormControls.md))
- `<PMGTable />` semantic table primitives (see [Table.md](./app/components/table/Table.md))
- `useLayerCounter()` composable
- `formatDate()` util
- `useLayerPreferencesStore()` Pinia store
- `$layerBuildDate` plugin injection via `useNuxtApp()`
- i18n via `@nuxtjs/i18n` with shared messages (`$t('common.welcome')`)
- `successResponse()` / `errorResponse()` server utils
- the shared `main.css`
- `app/app.config.ts` merged into its own app config
- the `@vueuse/nuxt`, `@pinia/nuxt`, and `@nuxtjs/i18n` modules plus any other
  modules/config declared in this layer's `nuxt.config.ts`
- Tailwind CSS support via `@nuxtjs/tailwindcss` with this layer's shared config
- TipTap building blocks: `<TiptapCarousel />`, `<TiptapGallery />`,
  `<TiptapVideo />`, `CarouselExtension`, `GalleryExtension`, and `VideoExtension`
  - `<TiptapVideo />` playback and video search fall back to Dutch (`nl`) when
    the requested language is not found or has no playable source.
- Page blocks such as `<PMGHero />`, `<PMGFeatures />`, `<PMGTileGrid />`,
  `<PMGTimeline />`, `<PMGQAndA />`, and the other components in
  `app/components/blocks`

## Article charts

The article editor's `ChartExtension` uses a single TipTap chart component for
rendering and editing, without an external service or chart library. It supports `bar`, `line`, `pie`,
and `donut`, keyboard/touch interaction, and reduced motion.
Text controls are Dutch, matching the article editor, with `nl-BE` number formatting.

```ts
import type { ChartData } from "pmg-layer/utils/chart";
import ChartExtension from "pmg-layer/utils/extensions/chart";

const chart: ChartData = {
  type: "bar",
  title: "Vervoer naar het werk",
  xAxisLabel: "",
  yAxisLabel: "",
  description: "Fictieve voorbeeldgegevens",
  unit: "%",
  source: "Demonstratie",
  palette: "categorical",
  points: [
    { label: "Fiets", value: 60 },
    { label: "Auto", value: 40 },
  ],
};

// Add ChartExtension to the consuming TipTap editor's extensions.
// The editor must also provide document, paragraph and text nodes.
editor.chain().focus().insertChart(chart).run();
// Or insert an empty block, then configure it using "Grafiek instellen":
editor.chain().focus().insertChart().run();
```

The node view uses the layer's shared modal for chart type,
title, description, unit, source and add/remove/reorder controls for 1–30 rows.
CSV import replaces the draft rows with two columns (name and numeric value),
separated by commas or semicolons. Quoted fields and decimal commas in
semicolon-separated files are supported; an optional header can use
`Naam,Waarde` (also `Label,Value` or `Categorie,Waarde`). Invalid files leave
the current rows unchanged. Save the settings to apply the imported data.
Settings are grouped into chart type, data and optional information. Chart types
include visual examples and guidance. New charts use the default color palette;
existing chart colors are preserved, without a color picker. Settings use
a single-column dialog with save/cancel always visible, without a live preview.
Edits are saved together in one update; cancelling leaves the article unchanged.
The block follows the other TipTap components: a labeled empty state with a setup
action, a circular edit control, and a separate unavailable state for invalid data.
Charts can be deleted from the settings modal's footer.
Read-only mode hides all editing controls.
Titles are optional; row labels are required and values must be finite numbers. Negative values
are supported for bars/lines, while pie/donut require non-negative values and a
positive finite total. Bars/lines always include zero. Lines use equally spaced
categories in the supplied order, not a continuous date axis. This first version
uses one data series; it does not fetch external data.

Article JSON stores the configuration in `chart` node `attrs.chart`.
HTML round-trips via `figure[data-chart]` and includes a readable table fallback
for static HTML consumers. Interactive rendering uses the same registered
extension in a read-only TipTap editor. Registering the extension and adding its insert action to the
consumer's toolbar remains the consumer's responsibility. Invalid data is shown
explicitly rather than silently coerced.

The node view is in `app/components/tiptap/Chart.vue`.
See `/charts` in the playground (`npm run dev`).

## Overlay stacking

Components use explicit values, not a shared overlay manager. `PMGModal`
defaults to 50; use its `zIndex` prop for nested surfaces. The dashboard uses
60 for the image library/lightboxes, 70 for image editors, 80 for editor
confirmations, and 90 for blocking confirmations. Portalled select/combobox
content uses 100, tooltips use 110, and notifications use 120.

Keep local page controls below modal levels. Do not globally override Reka
popper wrappers: Reka copies the content's z-index to its positioning wrapper.
Fixed tiers do not order arbitrary nested dialogs automatically; close an open
menu before opening another modal and explicitly place nested dialogs above
their parent.

## Shared page blocks

The page blocks use the dashboard implementation as their canonical source.
They render as normal read-only components when `editable` is omitted or false:

```vue
<PMGFeatures title="Features" :content="features" color-scheme="light" />
```

The dashboard can pass `editable` and `selected` to activate the inline-editing
paths. Editor controls such as `BlocksSharedEditableText`, block settings,
image selection, and item controls remain consumer-owned components, so the
public website does not need to implement them.

The layer includes read-only fallbacks for the shared text and selection-frame
components. A consuming dashboard's local `BlocksSharedEditableText` and
`BlocksSharedSelectionFrame` components override these fallbacks automatically.

The blocks can also be imported explicitly when building a dynamic registry:

```ts
import Features from "pmg-layer/app/components/blocks/Features.vue";
import Hero from "pmg-layer/app/components/blocks/Hero.vue";
```

Consumers that render `<PMGTabs />` must provide the `@headlessui/vue` peer
dependency.

The consuming project's own files always win if there's a naming collision
(project > layer).

## Publishing

1. Update `name`/`version` in `package.json`.
2. `npm publish` (or push to GitHub and use the `github:` extends syntax — no
   publish step needed).

## Notes

- Rename `@yourscope/nuxt-layer-starter` in `package.json` before publishing.
- Add more auto-imported dirs (`app/middleware/`, `app/layouts/`, `app/plugins/`,
  `app/pages/`) the same way — just create the folder under `app/`, Nuxt picks it up.
- Pinia stores can live in `stores/` and are available automatically once `@pinia/nuxt`
  is included in this layer.
- Shared translations can live in `i18n.config.ts`; consuming apps can extend/override
  locales and messages in their own `nuxt.config.ts`.
- If the consumer project uses Tailwind too, include this layer in the consumer's
  Tailwind `content` globs so classes in layer components are not purged.
- TipTap node-view components are presentation-only and read `editor.isEditable`
  to switch between editing controls and display mode.
- Multiple layers can be combined; see [Nuxt Layers docs](https://nuxt.com/docs/4.x/getting-started/layers) for priority/override rules.
- If a consumer project is still on Nuxt 3, either upgrade it to Nuxt 4 or set
  `future: { compatibilityVersion: 4 }` in its `nuxt.config.ts` so it resolves
  this layer's `app/` structure correctly.

## Image Picker Implementation Guide

The layer provides a deliberately unimplemented `useImagePicker()` composable.
Create `app/composables/useImagePicker.ts` in the consuming application to
override it. Nuxt gives the consuming app precedence over the layer.

```ts
import type {
  ImageEditorOptions,
  ImagePickerOptions,
} from "pmg-layer/composables/useImagePicker";

export const useImagePicker = () => {
  const pickImages = async (options?: ImagePickerOptions) => {
    // Open your application's picker and resolve with the selected images.
    // Each image must contain at least `id` and `url`.
    return openImagePicker(options);
  };

  const editImage = async (options: ImageEditorOptions) => {
    return openImageEditor(options);
  };

  return { pickImages, editImage };
};
```

`pickImages()` receives optional `folderId`, `maxSelected`, `jobCode`,
`aspectRatio`, and `currentSelection` values and must resolve to an image array.
`editImage()` receives the selected image and an optional `folderId`. It must
resolve with the edited image object, including changed metadata such as
`copyRight` (or `copyright`), so the change is saved to the article. Either
method may reject when the user cancels. The layer stub throws a descriptive
error so missing integration is detected immediately.

## TipTap Extensions Usage

```ts
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  CarouselExtension,
  GalleryExtension,
  VideoExtension,
} from "@yourscope/nuxt-layer-starter/app/utils/extensions";

const editor = new Editor({
  editable: true,
  extensions: [
    StarterKit,
    CarouselExtension,
    GalleryExtension,
    VideoExtension.configure({
      portalCode: "my-portal",
    }),
  ],
});

editor.commands.setCarousel([
  { id: 1, url: "https://example.com/image.jpg", caption: "Hero" },
]);

editor.commands.setGallery([
  { id: 1, url: "https://example.com/image.jpg", caption: "Hero" },
]);

editor.commands.setVideo({
  // Stored as reference, resolved through /api/videos/detail/{reference}/{locale}
  videoId: "123456",
  autoplay: false,
  muted: true,
});
```

Video resolution details:

- `videoId` is treated as a reference/job code and resolved via
  `useFetchVideos().getVideo(reference, locale)`.
- Bunny embeds receive the configured `portalCode` as the `data-theme` query
  parameter when you use `VideoExtension.configure({ portalCode })`.
- The layer provides `app/plugins/api.ts`, `app/composables/useApi.ts`, and
  `app/composables/useFetchVideos.ts` in the same pattern as your dashboard app.
- If the endpoint does not resolve, the component falls back to treating
  `videoId` as a direct Bunny embed ID.

## Tailwind Content Setup In Consuming Apps

```ts
// tailwind.config.ts (consumer app)
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts}",
    "./components/**/*.{vue,js,ts}",
    "./pages/**/*.vue",
    "./node_modules/@yourscope/nuxt-layer-starter/**/*.{vue,js,ts}",
  ],
} satisfies Config;
```
