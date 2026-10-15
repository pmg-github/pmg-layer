const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const layer = path.resolve(__dirname, "..");
const dashboard = path.resolve(layer, "../dashboard");
const req = createRequire(path.join(dashboard, "package.json"));
const { JSDOM } = req("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>");
for (const key of [
  "window",
  "document",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "Event",
  "MouseEvent",
  "MutationObserver",
])
  global[key] = dom.window[key];
global.PointerEvent = dom.window.MouseEvent;
const vue = req("vue");
Object.assign(global, vue);
const locale = vue.ref("nl");
global.useI18n = () => ({ locale });
const requests = [];
const delayed = new Map();
let failId = null;
const resultFor = (id, language) => ({
  id,
  title: "Campaign " + id,
  items: [
    {
      id: id * 10,
      name: "Partner " + id + " " + language,
      logoUrl: "/logo-" + id + ".svg",
      url: "https://example.com/" + id,
    },
  ],
});
global.useApi = () => async (url) => {
  requests.push(url);
  const [, id, language] = url.match(/campagnes\/(\d+)\/(\w+)/);
  if (Number(id) === failId) throw Error("Unavailable campaign");
  if (delayed.has(Number(id)))
    return new Promise((resolve) =>
      delayed.set(Number(id), () => resolve(resultFor(Number(id), language))),
    );
  return resultFor(Number(id), language);
};
global.useFetchFilters = () => ({
  getCampaigns: async () => [
    { key: "First", value: 101 },
    { key: "Second", value: "202" },
    { key: "Invalid", value: "bad" },
  ],
});

// Match Nuxt's keyed state and first-handler sharing, including reactive keys.
const cache = new Map();
global.useAsyncData = (key, handler, options = {}) => {
  function entry() {
    const value = vue.toValue(key);
    if (!cache.has(value))
      cache.set(value, {
        data: vue.ref(null),
        status: vue.ref("idle"),
        error: vue.ref(null),
        handler,
      });
    return cache.get(value);
  }
  async function execute() {
    const state = entry();
    state.status.value = "pending";
    state.error.value = null;
    try {
      state.data.value = await state.handler();
      state.status.value = "success";
    } catch (error) {
      state.error.value = error;
      state.data.value = null;
      state.status.value = "error";
    }
  }
  vue.watch(() => vue.toValue(key), execute, { immediate: true });
  if (options.watch) vue.watch(options.watch, execute);
  return {
    data: vue.computed(() => entry().data.value),
    status: vue.computed(() => entry().status.value),
    error: vue.computed(() => entry().error.value),
    refresh: execute,
  };
};
const { parse, compileScript } = req("@vue/compiler-sfc");
const output = path.join(
  os.tmpdir(),
  "partner-grid-check-" + process.pid + ".cjs",
);
const source =
  process.env.PARTNER_GRID_SOURCE ||
  path.join(layer, "app/components/blocks/PartnerGrid.vue");
async function run() {
  await req("esbuild").build({
    stdin: {
      contents: `import PartnerGrid from ${JSON.stringify(source)};import Toolbar from ${JSON.stringify(path.join(dashboard, "components/blocks/shared/BlockToolbar.vue"))};import * as context from ${JSON.stringify(path.join(layer, "app/components/block-editor/context.ts"))};export {PartnerGrid,Toolbar,context};`,
      resolveDir: layer,
    },
    outfile: output,
    bundle: true,
    format: "cjs",
    platform: "node",
    logLevel: "silent",
    plugins: [
      {
        name: "vue",
        setup(build) {
          build.onResolve({ filter: /^vue$/ }, () => ({
            path: req.resolve("vue"),
            external: true,
          }));
          build.onLoad({ filter: /\.vue$/ }, (args) => {
            const { descriptor, errors } = parse(
              fs.readFileSync(args.path, "utf8"),
              { filename: args.path },
            );
            assert.equal(errors.length, 0);
            const compiled = compileScript(descriptor, {
              id: args.path,
              inlineTemplate: true,
            });
            const missing = [
              "ref",
              "computed",
              "watch",
              "nextTick",
              "onMounted",
              "onBeforeUnmount",
              "onUnmounted",
              "inject",
              "provide",
              "useId",
            ].filter(
              (name) =>
                !compiled.bindings[name] &&
                new RegExp("\\b" + name + "\\b").test(compiled.content),
            );
            return {
              contents:
                (missing.length
                  ? `import {${missing.join(",")}} from 'vue';\n`
                  : "") + compiled.content,
              loader: "ts",
              resolveDir: path.dirname(args.path),
            };
          });
        },
      },
    ],
  });
  const { PartnerGrid, Toolbar, context } = require(output);
  const selectors = [];
  const Select = {
    props: ["modelValue", "fetch", "name"],
    emits: ["update:modelValue"],
    setup(props, { emit }) {
      selectors.push({
        props,
        choose: (value) => emit("update:modelValue", value),
      });
      return () => vue.h("span", "Campaign selector");
    },
  };
  const Generic = {
    setup: (_, ctx) => () => vue.h("div", ctx.slots.default?.()),
  };
  const components = {
    BlockSettings: Generic,
    EditableText: Generic,
    EditableLinks: Generic,
    SelectionFrame: Generic,
  };
  const drafts = vue.reactive([{ content: {} }, { content: {} }]);
  const errors = [];
  const container = document.createElement("div");
  document.body.append(container);
  const app = vue.createApp({
    setup() {
      vue.provide(
        context.blockEditorComponentsKey,
        vue.computed(() => components),
      );
      return () =>
        drafts.map((draft, index) =>
          vue.h("div", { "data-partner-block": index }, [
            vue.h(PartnerGrid, {
              ...draft,
              editable: true,
              selected: true,
              "onUpdate:props": (patch) => Object.assign(draft, patch),
            }),
          ]),
        );
    },
  });
  app.config.errorHandler = (error) => errors.push(error);
  app.config.warnHandler = () => {};
  app.component("PMGSelect", Select);
  app.component("Icon", Generic);
  app.mount(container);
  const settle = async () => {
    for (let n = 0; n < 5; n++) {
      await Promise.resolve();
      await vue.nextTick();
    }
  };
  const block = (index) =>
    container.querySelector('[data-partner-block="' + index + '"]');
  await settle();
  assert.equal(requests.length, 0, "Empty blocks must not fetch a campaign");
  assert.ok(
    selectors.every((select) => select.props.name === undefined),
    "Selectors must not share a vee-validate field",
  );
  const options = await selectors[1].props.fetch("");
  assert.deepEqual(
    options.map((option) => option.value),
    [101, 202],
  );
  selectors[1].choose(options[1]);
  await settle();
  assert.match(block(1).textContent, /Partner 202 nl/);
  assert.doesNotMatch(block(0).textContent, /Partner 202/);
  assert.equal(drafts[1].content.campaign.value, 202);
  selectors[0].choose(options[0]);
  await settle();
  assert.match(block(0).textContent, /Partner 101 nl/);
  assert.match(block(1).textContent, /Partner 202 nl/);
  selectors[1].choose(options[0]);
  await settle();
  selectors[0].choose(options[1]);
  await settle();
  assert.match(block(0).textContent, /Partner 202 nl/);
  assert.match(block(1).textContent, /Partner 101 nl/);
  locale.value = "fr";
  await settle();
  assert.match(block(0).textContent, /Partner 202 fr/);
  assert.match(block(1).textContent, /Partner 101 fr/);
  selectors[1].choose(null);
  await settle();
  assert.equal(block(1).querySelectorAll("img").length, 0);
  assert.match(block(1).textContent, /Selecteer een campagne/);
  delayed.set(303, null);
  selectors[1].choose({ key: "Slow", value: 303 });
  await settle();
  assert.match(block(1).textContent, /Partners laden/);
  selectors[1].choose(options[1]);
  await settle();
  delayed.get(303)();
  await settle();
  assert.match(block(1).textContent, /Partner 202 fr/);
  assert.doesNotMatch(block(1).textContent, /Partner 303/);
  failId = 404;
  selectors[1].choose({ key: "Failed", value: 404 });
  await settle();
  assert.match(block(1).textContent, /konden niet worden geladen/);
  failId = null;
  [...block(1).querySelectorAll("button")]
    .find((button) => button.textContent.trim() === "Opnieuw proberen")
    .click();
  await settle();
  assert.match(block(1).textContent, /Partner 404 fr/);
  assert.equal(errors.length, 0);
  app.unmount();
  container.remove();
  console.log(
    "PASS campaign selection, independent blocks, numeric IDs, language changes, clearing, slow responses, and retry",
  );

  const patches = [];
  const toolbarBlock = vue.reactive({
    key: "Features",
    props: { colorScheme: "white" },
  });
  const toolbarEl = document.createElement("div");
  document.body.append(toolbarEl);
  const toolbarApp = vue.createApp({
    render: () =>
      vue.h(Toolbar, {
        block: toolbarBlock,
        "onUpdate:props": (patch) => {
          patches.push(patch);
          Object.assign(toolbarBlock.props, patch);
        },
      }),
  });
  toolbarApp.component("Icon", Generic);
  toolbarApp.mount(toolbarEl);
  const swatches = [
    ...toolbarEl.querySelectorAll('[aria-label^="Kleurschema "]'),
  ];
  assert.equal(swatches.length, 3);
  for (const button of swatches) {
    assert.ok(button.classList.contains("size-6"));
    assert.ok(button.classList.contains("rounded-full"));
    assert.equal(button.children.length, 0);
    button.click();
    await settle();
    assert.equal(button.getAttribute("aria-pressed"), "true");
  }
  assert.deepEqual(
    patches.map((patch) => patch.colorScheme),
    ["white", "light", "dark"],
  );
  assert.ok(swatches[1].classList.contains("bg-primary-100"));
  assert.ok(swatches[2].classList.contains("bg-primary-600"));
  toolbarApp.unmount();
  toolbarEl.remove();
  console.log(
    "PASS original circular swatches, original tones, selection and update events",
  );
}
run()
  .finally(() => {
    if (fs.existsSync(output)) fs.unlinkSync(output);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
