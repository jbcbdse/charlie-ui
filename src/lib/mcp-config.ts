export type HttpMcpServerConfig = {
  name: string;
  toolNamePrefix?: string;
  transport: {
    type: "http";
    url: string;
    headers?: Record<string, string>;
  };
};

export const MAX_MCP_CONFIG_LENGTH = 16000;
export const MAX_MCP_SERVERS = 8;

export const EXAMPLE_MCP_CONFIG = `{
  "mcpServers": {
    "example_mcp": {
      "url": "http://127.0.0.1:8787/mcp"
    }
  }
}`;

export function normalizeMcpConfigJson(json: string): string {
  const trimmed = json.trim();
  parseHttpMcpConfig(trimmed);
  return trimmed;
}

export function parseHttpMcpConfig(json: string): HttpMcpServerConfig[] {
  const trimmed = json.trim();
  if (!trimmed) {
    return [];
  }
  if (trimmed.length > MAX_MCP_CONFIG_LENGTH) {
    throw new Error("Invalid MCP config");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Invalid MCP config: JSON is malformed");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error('Invalid MCP config: expected { "mcpServers": { ... } }');
  }
  const mcpServers = (parsed as { mcpServers?: unknown }).mcpServers;
  if (!mcpServers || typeof mcpServers !== "object" || Array.isArray(mcpServers)) {
    throw new Error('Invalid MCP config: expected { "mcpServers": { ... } }');
  }
  const entries = Object.entries(mcpServers as Record<string, unknown>);
  if (entries.length > MAX_MCP_SERVERS) {
    throw new Error("Invalid MCP config: too many servers");
  }
  return entries.map(([name, server]) => parseServer(name, server));
}

function parseServer(name: string, server: unknown): HttpMcpServerConfig {
  if (!name.trim()) {
    throw new Error("Invalid MCP config: server name is required");
  }
  if (!server || typeof server !== "object" || Array.isArray(server)) {
    throw new Error(`Invalid MCP config: server "${name}" is invalid`);
  }
  const config = server as Record<string, unknown>;
  if (typeof config.command === "string") {
    throw new Error(
      `Invalid MCP config: "${name}" uses stdio; HTTP url is required`,
    );
  }
  if (typeof config.url !== "string" || !config.url.trim()) {
    throw new Error(`Invalid MCP config: "${name}" needs an HTTP url`);
  }
  const url = parseHttpUrl(config.url.trim(), name);
  return {
    name,
    toolNamePrefix:
      config.toolNamePrefix === undefined
        ? undefined
        : parseString(config.toolNamePrefix, name, "toolNamePrefix"),
    transport: {
      type: "http",
      url,
      headers:
        config.headers === undefined
          ? undefined
          : parseHeaders(config.headers, name),
    },
  };
}

function parseHttpUrl(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid MCP config: "${name}" url is invalid`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Invalid MCP config: "${name}" url must be http or https`);
  }
  return value;
}

function parseHeaders(
  value: unknown,
  name: string,
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid MCP config: "${name}" headers must be an object`);
  }
  const headers: Record<string, string> = {};
  for (const [key, header] of Object.entries(value as Record<string, unknown>)) {
    if (typeof header !== "string") {
      throw new Error(
        `Invalid MCP config: "${name}" header "${key}" must be a string`,
      );
    }
    headers[key] = header;
  }
  return headers;
}

function parseString(value: unknown, name: string, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid MCP config: "${name}" ${field} must be a string`);
  }
  return value;
}
