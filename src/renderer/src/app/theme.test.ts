import { describe, expect, it } from "vitest";
import { darkTheme } from "./theme";

describe("renderer design tokens", () => {
  it("defines the canonical collection and detail geometry", () => {
    expect(darkTheme.design.layout.collectionWidth).toBe(1440);
    expect(darkTheme.design.layout.detailWidth).toBe(1500);
    expect(darkTheme.design.layout.gutters).toEqual({ xs: 2.5, sm: 4, lg: 6 });
  });

  it("keeps active media and focus presentation in the theme", () => {
    expect(darkTheme.design.color.nowPlaying).toBe("#ffd42a");
    expect(darkTheme.design.color.nowPlayingBackground).toContain("255,212,42");
    expect(darkTheme.design.color.accent).toBe(darkTheme.palette.primary.main);
  });

  it("provides card, artwork, control, motion, and typography contracts", () => {
    expect(darkTheme.design.radius.card).toBeGreaterThan(0);
    expect(darkTheme.design.color.frostedGlassSurface).toContain("linear-gradient(0deg");
    expect(darkTheme.design.radius.control).toBe("999px");
    expect(darkTheme.design.shadow.cardHover).not.toBe(darkTheme.design.shadow.card);
    expect(darkTheme.design.motion.lift).toContain("transform");
    expect(darkTheme.design.typography.pageTitle.fontWeight).toBe(700);
    expect(darkTheme.design.typography.detailTitle.fontWeight).toBe(700);
    expect(darkTheme.design.typography.sectionTitle.fontSize).toBe(19);
    expect(darkTheme.design.typography.sectionTitle.fontWeight).toBe(700);
    expect(darkTheme.design.typography.overline.fontWeight).toBe(700);
    expect(darkTheme.typography.fontFamily).toBe(
      '"Square Sans Display VF", "Square Sans Display", Helvetica, Arial, sans-serif'
    );
    expect(darkTheme.typography.fontWeightRegular).toBe(600);
    expect(darkTheme.typography.fontWeightMedium).toBe(600);
    expect(darkTheme.typography.fontWeightBold).toBe(700);
    expect(darkTheme.typography.h1.fontWeight).toBe(700);
    expect(darkTheme.typography.h6.fontWeight).toBe(700);
  });
});
