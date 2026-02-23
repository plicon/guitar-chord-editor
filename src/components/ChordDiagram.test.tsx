import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChordDiagramComponent } from "./ChordDiagram";
import { createEmptyChord } from "@/types/chord";

// A chord that is "edited" (has open strings + a finger) so the full SVG renders.
// md size: startY=30, open string circles at cy=18, first finger dot at cy≥40.
const chordWithOpenStrings = {
  ...createEmptyChord("test-open"),
  name: "A",
  fingers: [{ string: 3, fret: 2 }],
  openStrings: [1, 2],
};

// Open string circles sit above the fretboard (cy = startY - 12 = 18).
// Finger dots start at cy ≥ 40. Filtering by cy < 25 isolates open-string circles.
const getOpenStringCircles = (container: HTMLElement) => {
  const svg = container.querySelector("svg");
  return Array.from(svg?.querySelectorAll("circle") ?? []).filter(
    (c) => parseFloat(c.getAttribute("cy") ?? "0") < 25
  );
};

describe("ChordDiagramComponent — open string indicator", () => {
  describe("normal (non-print) mode", () => {
    it("renders one circle per open string", () => {
      const { container } = render(
        <ChordDiagramComponent chord={chordWithOpenStrings} printMode={false} />
      );
      expect(getOpenStringCircles(container)).toHaveLength(2);
    });

    it("applies fill-none via CSS class (no explicit fill attribute)", () => {
      const { container } = render(
        <ChordDiagramComponent chord={chordWithOpenStrings} printMode={false} />
      );
      getOpenStringCircles(container).forEach((circle) => {
        expect(circle).toHaveClass("fill-none");
        // No inline fill attribute — the CSS class does the work
        expect(circle.getAttribute("fill")).toBeNull();
      });
    });

    it("applies stroke via CSS class (no explicit stroke attribute)", () => {
      const { container } = render(
        <ChordDiagramComponent chord={chordWithOpenStrings} printMode={false} />
      );
      getOpenStringCircles(container).forEach((circle) => {
        expect(circle).toHaveClass("stroke-muted-foreground");
        expect(circle.getAttribute("stroke")).toBeNull();
      });
    });
  });

  describe("print mode", () => {
    it("renders one circle per open string", () => {
      const { container } = render(
        <ChordDiagramComponent
          chord={chordWithOpenStrings}
          printMode={true}
          showPlaceholder={false}
        />
      );
      expect(getOpenStringCircles(container)).toHaveLength(2);
    });

    it("has explicit fill='none' SVG attribute so html2canvas renders it hollow", () => {
      const { container } = render(
        <ChordDiagramComponent
          chord={chordWithOpenStrings}
          printMode={true}
          showPlaceholder={false}
        />
      );
      getOpenStringCircles(container).forEach((circle) => {
        // html2canvas reads SVG attributes, not CSS classes.
        // Without this attribute the browser default fill (black) makes the circle solid.
        expect(circle.getAttribute("fill")).toBe("none");
      });
    });

    it("has an explicit stroke attribute for the circle outline colour", () => {
      const { container } = render(
        <ChordDiagramComponent
          chord={chordWithOpenStrings}
          printMode={true}
          showPlaceholder={false}
        />
      );
      getOpenStringCircles(container).forEach((circle) => {
        expect(circle.getAttribute("stroke")).toBeTruthy();
      });
    });

    it("does not use the fill-none CSS class (relies solely on the attribute)", () => {
      const { container } = render(
        <ChordDiagramComponent
          chord={chordWithOpenStrings}
          printMode={true}
          showPlaceholder={false}
        />
      );
      getOpenStringCircles(container).forEach((circle) => {
        expect(circle).not.toHaveClass("fill-none");
      });
    });
  });
});
