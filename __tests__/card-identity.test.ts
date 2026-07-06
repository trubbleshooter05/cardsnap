import {
  buildEbaySearchQuery,
  parseSetNumber,
  resolveKnownAnchor,
  validateCardPricing,
} from "../lib/card-identity";

describe("parseSetNumber", () => {
  it("parses hash and slash forms", () => {
    expect(parseSetNumber("Umbreon VMAX AA #215")).toBe("215");
    expect(parseSetNumber("Evolving Skies 215/203")).toBe("215");
  });
});

describe("resolveKnownAnchor", () => {
  it("resolves Moonbreon from #215", () => {
    const anchor = resolveKnownAnchor("Umbreon VMAX Alternate Art Evolving Skies #215");
    expect(anchor?.id).toBe("moonbreon-215");
  });

  it("resolves #189 alt", () => {
    const anchor = resolveKnownAnchor("Umbreon V Alt #189");
    expect(anchor?.id).toBe("umbreon-v-189");
  });
});

describe("buildEbaySearchQuery", () => {
  it("uses tight Moonbreon query", () => {
    expect(buildEbaySearchQuery("Umbreon VMAX AA #215")).toContain("215");
    expect(buildEbaySearchQuery("Umbreon VMAX AA #215")).toContain("VMAX");
  });

  it("builds structured sports query with year and card number", () => {
    const q = buildEbaySearchQuery("2020 Prizm Joe Burrow PSA 10 #307");
    expect(q).toMatch(/2020/);
    expect(q).toContain("307");
    expect(q.toLowerCase()).toContain("prizm");
    expect(q.toLowerCase()).not.toContain("psa");
  });
});

describe("validateCardPricing", () => {
  it("warns when Moonbreon raw is alt-tier", () => {
    const result = validateCardPricing(
      "Umbreon VMAX AA #215",
      {
        confirmedName: "Umbreon V Alt Art #189",
        rawValueLow: 400,
        rawValueMid: 450,
        rawValueHigh: 500,
        gradedPSA9Value: 600,
        gradedPSA10Value: 1000,
      },
      1274
    );
    expect(result.ok).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
