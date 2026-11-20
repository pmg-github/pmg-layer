import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseChartCsv } from "../app/utils/chart.ts";

test("imports CSV headers, quoted labels and decimal commas", () => {
  assert.deepEqual(parseChartCsv('\uFEFFNaam;Waarde\r\n"Fiets; elektrisch";1,5\r\n"De ""bus""";2'), {
    points: [{ label: "Fiets; elektrisch", value: 1.5 }, { label: 'De "bus"', value: 2 }],
    error: null,
  });
  assert.deepEqual(parseChartCsv('"New York, NY",3\nAntwerp,-2'), {
    points: [{ label: "New York, NY", value: 3 }, { label: "Antwerp", value: -2 }],
    error: null,
  });
  assert.deepEqual(parseChartCsv('"Regel\nnaam";1,5'), {
    points: [{ label: "Regel\nnaam", value: 1.5 }],
    error: null,
  });
});

test("rejects malformed or oversized CSV rather than importing partial data", () => {
  for (const csv of [
    "",
    "Naam,Waarde\nFiets,",
    "Fiets,2,3",
    '"Fiets,2',
    "Fiets,Infinity",
    Array.from({ length: 31 }, (_, i) => `Rij ${i},1`).join("\n"),
  ]) {
    const result = parseChartCsv(csv);
    assert.equal(result.points, null, csv);
    assert.ok(result.error, csv);
  }
});
