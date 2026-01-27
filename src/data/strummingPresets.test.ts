import { describe, it, expect } from "vitest";
import { applyPresetToBeats, strummingPresets, StrummingPreset } from "./strummingPresets";
import { getSlotsPerBar } from "@/types/strumming";

describe("strummingPresets", () => {
  describe("preset definitions", () => {
    it("should have correct slot counts for time signatures", () => {
      strummingPresets.forEach(preset => {
        const expectedSlots = getSlotsPerBar(preset.timeSignature, preset.subdivision) * preset.bars;
        expect(preset.pattern).toHaveLength(expectedSlots);
      });
    });

    it("should have unique preset names", () => {
      const names = strummingPresets.map(p => p.name);
      const uniqueNames = new Set(names);
      expect(names).toHaveLength(uniqueNames.size);
    });

    it("should have valid time signatures", () => {
      strummingPresets.forEach(preset => {
        expect(["4/4", "3/4", "6/8"]).toContain(preset.timeSignature);
      });
    });
  });

  describe("applyPresetToBeats", () => {
    describe("1-bar 4/4 presets", () => {
      const basicDownPreset: StrummingPreset = {
        name: "Test Basic",
        bars: 1,
        timeSignature: "4/4",
        subdivision: 2,
        pattern: ["down", null, "down", null, "down", null, "down", null],
      };

      it("should apply 1-bar preset to 1 bar correctly", () => {
        const beats = applyPresetToBeats(basicDownPreset, 1, "4/4", 2);
        
        expect(beats).toHaveLength(8);
        expect(beats[0].stroke).toBe("down");
        expect(beats[0].beatType).toBe("on");
        expect(beats[1].stroke).toBe(null);
        expect(beats[1].beatType).toBe("&");
      });

      it("should repeat 1-bar preset for 2 bars", () => {
        const beats = applyPresetToBeats(basicDownPreset, 2, "4/4", 2);
        
        expect(beats).toHaveLength(16);
        // First bar
        expect(beats[0].stroke).toBe("down");
        expect(beats[2].stroke).toBe("down");
        // Second bar (should repeat pattern)
        expect(beats[8].stroke).toBe("down");
        expect(beats[10].stroke).toBe("down");
      });

      it("should set noteValue to 'full' for all beats", () => {
        const beats = applyPresetToBeats(basicDownPreset, 1, "4/4", 2);
        beats.forEach(beat => {
          expect(beat.noteValue).toBe("full");
        });
      });

      it("should use correct beatType labels for subdivision 2", () => {
        const beats = applyPresetToBeats(basicDownPreset, 1, "4/4", 2);
        beats.forEach((beat, index) => {
          if (index % 2 === 0) {
            expect(beat.beatType).toBe("on");
          } else {
            expect(beat.beatType).toBe("&");
          }
        });
      });
    });

    describe("2-bar 4/4 presets", () => {
      const twoBarPreset: StrummingPreset = {
        name: "Test 2-Bar",
        bars: 2,
        timeSignature: "4/4",
        subdivision: 2,
        pattern: [
          "down", null, "down", "up", null, "up", "down", "up",
          "down", null, "down", null, "down", "up", "down", null,
        ],
      };

      it("should apply 2-bar preset to 2 bars correctly", () => {
        const beats = applyPresetToBeats(twoBarPreset, 2, "4/4", 2);
        
        expect(beats).toHaveLength(16);
        // Check first bar pattern
        expect(beats[0].stroke).toBe("down");
        expect(beats[3].stroke).toBe("up");
        // Check second bar pattern
        expect(beats[8].stroke).toBe("down");
        expect(beats[14].stroke).toBe("down");
      });

      it("should apply 2-bar preset to 1 bar by truncating", () => {
        const beats = applyPresetToBeats(twoBarPreset, 1, "4/4", 2);
        
        expect(beats).toHaveLength(8);
        // Should only contain first 8 beats of the pattern
        expect(beats[0].stroke).toBe("down");
        expect(beats[7].stroke).toBe("up");
      });

      it("should repeat 2-bar preset for 4 bars", () => {
        const beats = applyPresetToBeats(twoBarPreset, 4, "4/4", 2);
        
        expect(beats).toHaveLength(32);
        // First repetition (bars 1-2)
        expect(beats[0].stroke).toBe("down");
        expect(beats[15].stroke).toBe(null);
        // Second repetition (bars 3-4)
        expect(beats[16].stroke).toBe("down");
        expect(beats[31].stroke).toBe(null);
      });

      it("should handle odd number of bars (3 bars) correctly", () => {
        const beats = applyPresetToBeats(twoBarPreset, 3);
        
        expect(beats).toHaveLength(24); // 3 bars * 8 slots
        // First 2 bars: full pattern
        expect(beats[0].stroke).toBe("down");
        expect(beats[15].stroke).toBe(null);
        // Third bar: truncated repeat
        expect(beats[16].stroke).toBe("down");
        expect(beats[23].stroke).toBe("up");
      });
    });

    describe("3/4 presets", () => {
      const waltzPreset: StrummingPreset = {
        name: "Test Waltz",
        bars: 1,
        timeSignature: "3/4",
        subdivision: 2,
        pattern: ["down", null, "down", null, "down", null],
      };

      it("should apply 3/4 preset correctly", () => {
        const beats = applyPresetToBeats(waltzPreset, 1, "3/4", 2);
        
        expect(beats).toHaveLength(6); // 3 beats × 2 subdivision
        expect(beats[0].stroke).toBe("down");
        expect(beats[2].stroke).toBe("down");
        expect(beats[4].stroke).toBe("down");
      });

      it("should repeat 3/4 preset for 2 bars", () => {
        const beats = applyPresetToBeats(waltzPreset, 2, "3/4", 2);
        
        expect(beats).toHaveLength(12); // 2 bars × 6 slots
      });
    });

    describe("6/8 presets", () => {
      const sixEightPreset: StrummingPreset = {
        name: "Test 6/8",
        bars: 1,
        timeSignature: "6/8",
        subdivision: 3,
        pattern: ["down", null, null, null, null, null, null, null, null, "down", null, null, null, null, null, null, null, null],
      };

      it("should apply 6/8 preset correctly", () => {
        const beats = applyPresetToBeats(sixEightPreset, 1, "6/8", 3);
        
        expect(beats).toHaveLength(18); // 6 beats × 3 subdivision
        expect(beats[0].stroke).toBe("down");
        expect(beats[9].stroke).toBe("down");
      });
    });

    describe("edge cases", () => {
      it("should handle preset with mixed strokes", () => {
        const mixedPreset: StrummingPreset = {
          name: "Mixed",
          bars: 1,
          timeSignature: "4/4",
          subdivision: 2,
          pattern: ["down", "up", null, "down", "up", null, "down", "up"],
        };

        const beats = applyPresetToBeats(mixedPreset, 1, "4/4", 2);
        
        expect(beats[0].stroke).toBe("down");
        expect(beats[1].stroke).toBe("up");
        expect(beats[2].stroke).toBe(null);
      });

      it("should handle preset with all nulls", () => {
        const emptyPreset: StrummingPreset = {
          name: "Empty",
          bars: 1,
          timeSignature: "4/4",
          subdivision: 2,
          pattern: [null, null, null, null, null, null, null, null],
        };

        const beats = applyPresetToBeats(emptyPreset, 1, "4/4", 2);
        
        expect(beats).toHaveLength(8);
        beats.forEach(beat => {
          expect(beat.stroke).toBe(null);
        });
      });
    });

    describe("real presets from configuration", () => {
      it("should apply 4/4 presets correctly", () => {
        const preset = strummingPresets.find(p => p.name === "Basic Down (4/4)")!;
        expect(preset).toBeDefined();
        const beats = applyPresetToBeats(preset, 1, preset.timeSignature, preset.subdivision);
        
        expect(beats).toHaveLength(8);
        // Should have down strokes on beats 1, 2, 3, 4
        expect(beats[0].stroke).toBe("down");
        expect(beats[2].stroke).toBe("down");
        expect(beats[4].stroke).toBe("down");
        expect(beats[6].stroke).toBe("down");
      });

      it("should apply 3/4 presets correctly", () => {
        const preset = strummingPresets.find(p => p.name === "Basic Down (3/4)")!;
        expect(preset).toBeDefined();
        const beats = applyPresetToBeats(preset, 1, preset.timeSignature, preset.subdivision);
        
        expect(beats).toHaveLength(6); // 3 beats × 2 subdivision
      });

      it("should apply 6/8 presets correctly", () => {
        const preset = strummingPresets.find(p => p.name === "Basic Down (6/8)")!;
        expect(preset).toBeDefined();
        const beats = applyPresetToBeats(preset, 1, preset.timeSignature, preset.subdivision);
        
        expect(beats).toHaveLength(18); // 6 beats × 3 subdivision
      });

      it("should apply all presets without errors", () => {
        strummingPresets.forEach(preset => {
          expect(() => {
            applyPresetToBeats(preset, 1, preset.timeSignature, preset.subdivision);
            applyPresetToBeats(preset, 2, preset.timeSignature, preset.subdivision);
          }).not.toThrow();
        });
      });
    });
  });
});
