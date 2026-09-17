import { describe, expect, it } from "vitest";
import {
  EXAMPLE_MCP_CONFIG,
  normalizeMcpConfigJson,
  parseHttpMcpConfig,
} from "./mcp-config";

describe("parseHttpMcpConfig", () => {
  it("returns no servers for empty input", () => {
    expect(parseHttpMcpConfig("")).toEqual([]);
    expect(parseHttpMcpConfig("   ")).toEqual([]);
  });

  it("parses the example HTTP config", () => {
    expect(parseHttpMcpConfig(EXAMPLE_MCP_CONFIG)).toEqual([
      {
        name: "example_mcp",
        toolNamePrefix: undefined,
        transport: {
          type: "http",
          url: "http://127.0.0.1:8787/mcp",
          headers: undefined,
        },
      },
    ]);
  });

  it("rejects stdio command configs", () => {
    expect(() =>
      parseHttpMcpConfig(
        JSON.stringify({
          mcpServers: { files: { command: "npx", args: ["-y", "foo"] } },
        }),
      ),
    ).toThrow(/stdio/);
  });

  it("rejects malformed JSON", () => {
    expect(() => parseHttpMcpConfig("{")).toThrow(/malformed/);
  });
});

describe("normalizeMcpConfigJson", () => {
  it("trims valid JSON", () => {
    expect(normalizeMcpConfigJson(`  ${EXAMPLE_MCP_CONFIG}  `)).toBe(
      EXAMPLE_MCP_CONFIG,
    );
  });
});
