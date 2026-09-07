import { describe, expect, it } from "vitest";
import {
  assertSafeUserId,
  getMessages,
  saveMesssages,
  clearMessages,
} from "@/lib/file-memory";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

describe("assertSafeUserId", () => {
  it("accepts alphanumeric ids", () => {
    expect(assertSafeUserId("abc-123_XYZ")).toBe("abc-123_XYZ");
  });

  it("rejects path traversal", () => {
    expect(() => assertSafeUserId("../../../secret")).toThrow("Invalid user id");
    expect(() => assertSafeUserId("..%2F..%2Fsecret")).toThrow("Invalid user id");
  });
});

describe("file-memory isolation", () => {
  it("reads and writes only under tmp for safe ids", async () => {
    const userId = `unit-${Date.now()}`;
    await clearMessages(userId);
    await saveMesssages(userId, [
      { role: "user", name: "User", content: "hi" },
    ]);
    const messages = await getMessages(userId);
    expect(messages).toHaveLength(1);
    await clearMessages(userId);
    expect(await getMessages(userId)).toEqual([]);
  });

  it("does not allow escaping tmp via user id", async () => {
    const outside = mkdtempSync(path.join(tmpdir(), "charlie-ui-"));
    const target = path.join(outside, "leak.json");
    writeFileSync(target, JSON.stringify([{ content: "secret" }]));
    await expect(getMessages(`../../../${path.basename(outside)}/leak`)).rejects.toThrow(
      "Invalid user id",
    );
    rmSync(outside, { recursive: true, force: true });
  });
});
