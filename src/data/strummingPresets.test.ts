import { describe, it, expect } from "vitest";
import { applyPresetToBeats, strummingPresets, StrummingPreset } from "./strummingPresets";

describe("strummingPresets", () => {
  describe("preset definitions", () => {
    it("should have all 1-bar presets with 8 slots", () => {
      const oneBarPresets = strummingPresets.filter(p => p.bars === 1);
      oneBarPresets.forEach(preset => {
        expect(preset.pattern).toHaveLength(8);
      });
    });

    it("should have all 2-bar presets with 16 slots", () => {
      const twoBarPresets = strummingPresets.filter(p => p.bars === 2);
      twoBarPresets.forEach(preset => {
        expect(preset.pattern).toHaveLength(16);
      });
    });

    it("should have unique preset names", () => {
      const names = strummingPresets.map(p => p.name);
      const uniqueNames = new Set(names);
      expect(names).toHaveLength(uniqueNames.size);
    });
  });

  describe("applyPresetToBeats", () => {
    describe("1-bar presets", () => {
      const basicDownPreset: StrummingPreset = {
        name: "Test Basic",
        bars: 1,
        pattern: ["down", null, "down", null, "down", null, "down", null],
      };

      it("should apply 1-bar preset to 1 bar correctly", () => {
        const beats = applyPresetToBeats(basicDownPreset, 1);
        
        expect(beats).toHaveLength(8);
        expect(beats[0].stroke).toBe("down");
        expect(beats[0].beatType).toBe("on");
        expect(beats[1].stroke).toBe(null);
        expect(beats[1].beatType).toBe("off");
      });

      it("should repeat 1-bar preset for 2 bars", () => {
        const beats = applyPresetToBeats(basicDownPreset, 2);
        
        expect(beats).toHaveLength(16);
        // First bar
        expect(beats[0].stroke).toBe("down");
        expect(beats[2].stroke).toBe("down");
        // Second bar (should repeat pattern)
        expect(beats[8].stroke).toBe("down");
        expect(beats[10].stroke).toBe("down");
      });

      it("should set noteValue to 'full' for all beats", () => {
        const beats = applyPresetToBeats(basicDownPreset, 1);
        beats.forEach(beat => {
          expect(beat.noteValue).toBe("full");
        });
      });

      it("should alternate beatType between 'on' and 'off'", () => {
        const beats = applyPresetToBeats(basicDownPreset, 1);
        beats.forEach((beat, index) => {
          if (index % 2 === 0) {
            expect(beat.beatType).toBe("on");
          } else {
            expect(beat.beatType).toBe("off");
          }
        });
      });
    });

    describe("2-bar presets", () => {
      const twoBarPreset: StrummingPreset = {
        name: "Test 2-Bar",
        bars: 2,
        pattern: [
          "down", null, "down", "up", null, "up", "down", "up",
          "down", null, "down", null, "down", "up", "down", null,
        ],
      };

      it("should apply 2-bar preset to 2 bars correctly", () => {
        const beats = applyPresetToBeats(twoBarPreset, 2);
        
        expect(beats).toHaveLength(16);
        // Check first bar pattern
        expect(beats[0].stroke).toBe("down");
        expect(beats[3].stroke).toBe("up");
        // Check second bar pattern
        expect(beats[8].stroke).toBe("down");
        expect(beats[14].stroke).toBe("down");
      });

      it("should apply 2-bar preset to 1 bar by truncating", () => {
        const beats = applyPresetToBeats(twoBarPreset, 1);
        
        expect(beats).toHaveLength(8);
        // Should only contain first 8 beats of the pattern
        expect(beats[0].stroke).toBe("down");
        expect(beats[7].stroke).toBe("up");
      });

      it("should repeat 2-bar preset for 4 bars", () => {
        const beats = applyPresetToBeats(twoBarPreset, 4);
        
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

    describe("edge cases", () => {
      it("should handle preset with mixed strokes", () => {
        const mixedPreset: StrummingPreset = {
          name: "Mixed",
          bars: 1,
          pattern: ["down", "up", null, "down", "up", null, "down", "up"],
        };

        const beats = applyPresetToBeats(mixedPreset, 1);
        
        expect(beats[0].stroke).toBe("down");
        expect(beats[1].stroke).toBe("up");
        expect(beats[2].stroke).toBe(null);
      });

      it("should handle preset with all nulls", () => {
        const emptyPreset: StrummingPreset = {
          name: "Empty",
          bars: 1,
          pattern: [null, null, null, null, null, null, null, null],
        };

        const beats = applyPresetToBeats(emptyPreset, 1);
        
        expect(beats).toHaveLength(8);
        beats.forEach(beat => {
          expect(beat.stroke).toBe(null);
        });
      });
    });

    describe("real presets from configuration", () => {
      it("should apply 'Basic Down' preset correctly", () => {
        const preset = strummingPresets.find(p => p.name === "Basic Down")!;
        const beats = applyPresetToBeats(preset, 1);
        
        expect(beats).toHaveLength(8);
        // Should have down strokes on beats 1, 2, 3, 4
        expect(beats[0].stroke).toBe("down");
        expect(beats[2].stroke).toBe("down");
        expect(beats[4].stroke).toBe("down");
        expect(beats[6].stroke).toBe("down");
      });

      it("should apply 'Old Faithful' preset correctly", () => {
        const preset = strummingPresets.find(p => p.name === "Old Faithful")!;
        const beats = applyPresetToBeats(preset, 1);
        
        expect(beats).toHaveLength(8);
        expect(beats[0].stroke).toBe("down"); // 1
        expect(beats[2].stroke).toBe("down"); // 2
        expect(beats[3].stroke).toBe("up");   // &
        expect(beats[5].stroke).toBe("up");   // &
        expect(beats[6].stroke).toBe("down"); // 4
      });

      it("should apply 2-bar preset 'The Push' correctly", () => {
        const preset = strummingPresets.find(p => p.name === "The Push");
        if (!preset) {
          // Skip if preset doesn't exist
          return;
        }
        
        expect(preset.bars).toBe(2);
        const beats = applyPresetToBeats(preset, 2);
        
        expect(beats).toHaveLength(16);
      });

      it("should apply all presets without errors", () => {
        strummingPresets.forEach(preset => {
          expect(() => {
            applyPresetToBeats(preset, 1);
            applyPresetToBeats(preset, 2);
          }).not.toThrow();
        });
      });
    });
  });
});
