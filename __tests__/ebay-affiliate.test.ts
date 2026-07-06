import {
  buildEbaySoldSearchAffiliateUrl,
  isEbayAffiliateEnabled,
} from "@/lib/ebay-affiliate";

describe("ebay-affiliate", () => {
  const prev = process.env.NEXT_PUBLIC_EBAY_EPN_CAMPID;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_EBAY_EPN_CAMPID = "5339123456";
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_EBAY_EPN_CAMPID = prev;
  });

  it("builds sold search affiliate url", () => {
    expect(isEbayAffiliateEnabled()).toBe(true);
    const url = buildEbaySoldSearchAffiliateUrl("2020 Prizm Joe Burrow", {
      customId: "scan-test",
    });
    expect(url).toContain("campid=5339123456");
    expect(url).toContain("LH_Sold=1");
    expect(url).toContain("_nkw=");
  });
});
