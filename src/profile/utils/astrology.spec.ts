import { getHoroscope, getZodiac } from "./astrology";

describe("Astrology utilities", () => {
  describe("getHoroscope", () => {
    it("returns Virgo for 1995-08-28 (matches Figma example)", () => {
      expect(getHoroscope(new Date("1995-08-28"))).toBe("Virgo");
    });

    it("handles Capricorn wrapping across year boundary", () => {
      expect(getHoroscope(new Date("2024-01-05"))).toBe("Capricorn");
      expect(getHoroscope(new Date("2023-12-25"))).toBe("Capricorn");
    });

    it("returns Aries for the boundary day March 21", () => {
      expect(getHoroscope(new Date("2024-03-21"))).toBe("Aries");
    });

    it("returns Pisces on March 20 (one day before Aries)", () => {
      expect(getHoroscope(new Date("2024-03-20"))).toBe("Pisces");
    });
  });

  describe("getZodiac", () => {
    it("returns Pig for 1995 (matches Figma example)", () => {
      expect(getZodiac(new Date("1995-08-28"))).toBe("Pig");
    });

    it("returns Rat for 2020", () => {
      expect(getZodiac(new Date("2020-06-15"))).toBe("Rat");
    });

    it("returns Dragon for 2024", () => {
      expect(getZodiac(new Date("2024-01-15"))).toBe("Dragon");
    });
  });
});
