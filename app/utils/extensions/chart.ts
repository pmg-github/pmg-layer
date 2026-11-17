import { Node, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import Chart from "../../components/tiptap/Chart.vue";
import { createChartData, validateChart, type ChartData } from "../chart";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    chart: {
      insertChart: (data?: ChartData) => ReturnType;
    };
  }
}

export default Node.create({
  name: "chart",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      chart: { default: createChartData(), rendered: false },
    };
  },

  parseHTML() {
    return [{
      tag: "figure[data-chart]",
      getAttrs: (element) => {
        try {
          const chart: unknown = JSON.parse(element.getAttribute("data-chart") ?? "null");
          const result = validateChart(chart);
          if (result.error) console.warn(`[Chart] ${result.error}`);
          return { chart: result.data ?? chart };
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
          console.warn("[Chart] De opgeslagen grafiek bevat ongeldige JSON.", error);
          return { chart: null };
        }
      },
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const result = validateChart(node.attrs.chart);
    const attributes = mergeAttributes(HTMLAttributes, {
      "data-chart": JSON.stringify(node.attrs.chart),
    });
    if (!result.data) return ["figure", attributes, ["p", `Grafiek niet beschikbaar: ${result.error}`]];
    const data = result.data;
    const rows: DOMOutputSpec[] = data.points.map((point) => [
      "tr",
      ["th", { scope: "row" }, point.label],
      ["td", String(point.value)],
    ]);
    return [
      "figure",
      attributes,
      ["figcaption", data.title],
      ["p", data.description],
      ["table",
        ["thead", ["tr", ["th", { scope: "col" }, "Label"], ["th", { scope: "col" }, data.unit || "Waarde"]]],
        ["tbody", ...rows],
      ],
      ["p", data.source ? `Bron: ${data.source}` : ""],
    ];
  },

  addCommands() {
    return {
      insertChart: (data) => ({ commands }) => {
        if (data) {
          const result = validateChart(data);
          if (result.error) {
            console.warn(`[Chart] ${result.error}`);
            return false;
          }
        }
        return commands.insertContent([
          { type: this.name, attrs: { chart: data ?? createChartData() } },
          { type: "paragraph" },
        ]);
      },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(Chart);
  },
});
