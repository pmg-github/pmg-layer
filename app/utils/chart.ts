export type ChartType = "bar" | "line" | "pie" | "donut";
export type ChartPalette = "blue" | "green" | "categorical";

export interface ChartData {
  type: ChartType;
  title: string;
  description: string;
  unit: string;
  source: string;
  palette: ChartPalette;
  points: { label: string; value: number }[];
}

export const chartTypes: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Staafdiagram" },
  { value: "line", label: "Lijndiagram" },
  { value: "pie", label: "Taartdiagram" },
  { value: "donut", label: "Donutdiagram" },
];

export const chartPalettes: { value: ChartPalette; label: string; colors: string[] }[] = [
  { value: "blue", label: "Blauw", colors: ["#1e40af", "#2563eb", "#0284c7", "#0891b2", "#4338ca", "#6366f1"] },
  { value: "green", label: "Groen", colors: ["#065f46", "#059669", "#0d9488", "#15803d", "#4d7c0f", "#047857"] },
  { value: "categorical", label: "Meerdere kleuren", colors: ["#2563eb", "#c2410c", "#047857", "#7e22ce", "#be185d", "#0e7490"] },
];

export const maxChartPoints = 30;

export function createChartData(): ChartData {
  return {
    type: "bar",
    title: "",
    description: "",
    unit: "",
    source: "",
    palette: "categorical",
    points: [],
  };
}

type ChartValidation = { data: ChartData; error: null } | { data: null; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateChart(value: unknown): ChartValidation {
  const invalid = (error: string): ChartValidation => ({ data: null, error });
  if (!isRecord(value)) return invalid("De grafiekgegevens ontbreken of zijn ongeldig.");
  if (!chartTypes.some((type) => type.value === value.type)) {
    return invalid("Kies een geldig grafiektype.");
  }
  if (!chartPalettes.some((palette) => palette.value === value.palette)) {
    return invalid("Kies een geldig kleurenpalet.");
  }
  for (const field of ["title", "description", "unit", "source"]) {
    if (typeof value[field] !== "string") return invalid("De tekstvelden van de grafiek zijn ongeldig.");
  }
  if (typeof value.title !== "string" || !value.title.trim()) {
    return invalid("Vul een titel in.");
  }
  if (!Array.isArray(value.points) || value.points.length < 1 || value.points.length > maxChartPoints) {
    return invalid(`Voeg 1 tot ${maxChartPoints} gegevensrijen toe.`);
  }
  const points: ChartData["points"] = [];
  for (const [index, point] of value.points.entries()) {
    if (!isRecord(point) || typeof point.label !== "string" || !point.label.trim()) {
      return invalid(`Vul een label in voor rij ${index + 1}.`);
    }
    if (typeof point.value !== "number" || !Number.isFinite(point.value)) {
      return invalid(`Vul een geldig getal in voor rij ${index + 1}.`);
    }
    points.push({ label: point.label, value: point.value });
  }
  const values = points.map((point) => point.value);
  if (!Number.isFinite(Math.max(0, ...values) - Math.min(0, ...values))) {
    return invalid("Het verschil tussen de waarden is te groot.");
  }
  if (value.type === "pie" || value.type === "donut") {
    if (values.some((number) => number < 0)) {
      return invalid("Een taart- of donutdiagram kan geen negatieve waarden bevatten.");
    }
    const total = values.reduce((sum, number) => sum + number, 0);
    if (!Number.isFinite(total) || total <= 0) {
      return invalid("Een taart- of donutdiagram heeft een positief, eindig totaal nodig.");
    }
  }
  // Every property has been checked above; keep only the supported persisted fields.
  return {
    data: {
      type: value.type as ChartType,
      palette: value.palette as ChartPalette,
      title: value.title,
      description: value.description as string,
      unit: value.unit as string,
      source: value.source as string,
      points,
    },
    error: null,
  };
}

export function chartCoordinates(points: ChartData["points"]) {
  const values = points.map((point) => point.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const y = (value: number) => 300 - ((value - min) / range) * 260;
  return {
    baseline: y(0),
    ticks: Array.from({ length: 5 }, (_, i) => {
      const value = min + range * (i / 4);
      return { value, y: y(value) };
    }),
    points: points.map((point, index) => ({
      ...point,
      x: 90 + ((index + 0.5) / points.length) * 520,
      y: y(point.value),
    })),
  };
}

export function chartSlicePath(start: number, fraction: number, donut: boolean): string {
  const outer = 130;
  const inner = donut ? 76 : 0;
  const coordinate = (turn: number, radius: number) => {
    const angle = turn * 2 * Math.PI - Math.PI / 2;
    return `${320 + Math.cos(angle) * radius} ${170 + Math.sin(angle) * radius}`;
  };
  const middle = start + fraction / 2;
  const end = start + fraction;
  // Two arcs also handle a single slice covering the entire circle.
  const outside = `M ${coordinate(start, outer)} A ${outer} ${outer} 0 0 1 ${coordinate(middle, outer)} A ${outer} ${outer} 0 0 1 ${coordinate(end, outer)}`;
  return donut
    ? `${outside} L ${coordinate(end, inner)} A ${inner} ${inner} 0 0 0 ${coordinate(middle, inner)} A ${inner} ${inner} 0 0 0 ${coordinate(start, inner)} Z`
    : `${outside} L 320 170 Z`;
}
