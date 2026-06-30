import { isAdminEmail } from "../lib/admin-access";

describe("isAdminEmail", () => {
  const prev = process.env.CARDSNAP_ADMIN_EMAILS;

  afterEach(() => {
    process.env.CARDSNAP_ADMIN_EMAILS = prev;
  });

  it("matches allowlisted email case-insensitively", () => {
    process.env.CARDSNAP_ADMIN_EMAILS = "Owner@Example.com, other@test.com";
    expect(isAdminEmail("owner@example.com")).toBe(true);
    expect(isAdminEmail("nope@example.com")).toBe(false);
  });

  it("returns false when env is empty", () => {
    process.env.CARDSNAP_ADMIN_EMAILS = "";
    expect(isAdminEmail("owner@example.com")).toBe(false);
  });
});
