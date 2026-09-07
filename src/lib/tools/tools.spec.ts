import { describe, expect, it } from "vitest";
import { CalculatorTool } from "@/lib/tools/calculator.tool";
import { CountLettersTool } from "@/lib/tools/letter-count.tool";
import { CurrentTimeTool } from "@/lib/tools/current-time.tool";
import { getTools } from "@/lib/tools";

describe("tools", () => {
  it("evaluates calculator expressions", () => {
    const tool = new CalculatorTool();
    expect(tool.handler({ expr: "2 + 2" })).toContain("4");
  });

  it("counts letters case-insensitively", () => {
    const tool = new CountLettersTool();
    expect(tool.handler({ word: "Mississippi", letter: "s" })).toContain("4");
  });

  it("returns a current time string", () => {
    const tool = new CurrentTimeTool();
    expect(tool.handler()).toMatch(/The current time is /);
  });

  it("exposes three tools via getTools", () => {
    expect(getTools()).toHaveLength(3);
  });

  it("validates calculator input via BaseTool.handle", async () => {
    const tool = new CalculatorTool();
    await expect(
      tool.handle({ expr: "3 * 3" }, {} as never),
    ).resolves.toContain("9");
    await expect(tool.handle({ expr: 1 }, {} as never)).rejects.toThrow(
      /Invalid parameters/,
    );
  });
});
