import {
  MIN_NET_TO_RECOMMEND_GRADE,
  computeGradingRoi,
  minGradeForNet,
} from "../lib/roi";

const baseCard = {
  rawValueLow: 80,
  rawValueMid: 100,
  rawValueHigh: 120,
  gradedPSA9Value: 110,
  gradedPSA10Value: 200,
};

describe("computeGradingRoi", () => {
  it("flags PSA 9 pain when grade call needs a 10", () => {
    const roi = computeGradingRoi(baseCard);
    expect(roi.headlineVerdict).toBe("grade");
    expect(roi.psa9PainCase).toBe(true);
    expect(roi.minGradeToRecommend).toBe("psa10");
  });

  it("builds lose-money reasons with ebay active comps context", () => {
    const roi = computeGradingRoi(baseCard, undefined, {
      ebay: {
        avgSoldPrice: 100,
        minSoldPrice: 90,
        maxSoldPrice: 110,
        recentSales: [100],
        compSource: "ebay_active_listings",
      },
      psa: null,
      verdictReason: "test",
    });
    expect(roi.loseMoneyReasons.some((r) => r.includes("asking prices"))).toBe(true);
  });
});

describe("minGradeForNet", () => {
  it("returns psa9 when both paths clear threshold", () => {
    expect(minGradeForNet(30, 50, MIN_NET_TO_RECOMMEND_GRADE)).toBe("psa9");
  });
});
