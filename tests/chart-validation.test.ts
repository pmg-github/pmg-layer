import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createChartData, validateChart } from "../app/utils/chart.ts";

test("validates charts with or without a title", () => {
  const chart = { ...createChartData(), points: [{ label: "Fiets", value: 38 }] };
  for (const title of ["", "   ", "Vervoer"]) {
    assert.equal(validateChart({ ...chart, title }).data?.title, title);
  }
  assert.equal(validateChart({ ...chart, title: null }).data, null);
  assert.equal(validateChart({ ...chart, points: [] }).data, null);
});
