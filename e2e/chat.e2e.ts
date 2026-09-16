import { expect, test } from "@playwright/test";

const CHAT_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const CHAT = {
  id: CHAT_ID,
  title: "New chat",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function apiPath(url: string): string {
  return new URL(url, "http://localhost").pathname.replace(/\/$/, "");
}

async function enterEmail(page: import("@playwright/test").Page) {
  await page.locator("#email").fill("e2e@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
}

test("chat page shows provider-grouped model select", async ({ page }) => {
  await page.route("**/api/chats**", async (route) => {
    const path = apiPath(route.request().url());
    const method = route.request().method();
    if (path === "/api/chats" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
      return;
    }
    if (path === "/api/chats" && method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(CHAT),
      });
      return;
    }
    if (path === `/api/chats/${CHAT_ID}` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...CHAT, messages: [] }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/chat");
  await enterEmail(page);
  await page.getByRole("button", { name: "New chat" }).click();

  const select = page.locator("#agentId");
  await expect(select).toBeVisible();

  const groups = page.locator("#agentId optgroup");
  await expect(groups).toHaveCount(5);
  await expect(groups.nth(0)).toHaveAttribute("label", "Amazon Bedrock");
  await expect(groups.nth(1)).toHaveAttribute("label", "OpenAI");
  await expect(groups.nth(2)).toHaveAttribute("label", "xAI");
  await expect(groups.nth(3)).toHaveAttribute("label", "Google");
  await expect(groups.nth(4)).toHaveAttribute("label", "Ollama");

  await expect(select.locator('option[value="gpt4o"]')).toHaveCount(1);
  await expect(select.locator('option[value="ollama"]')).toHaveCount(1);
});

test("sending a message streams tokens then replaces with the complete reply", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const origFetch = window.fetch.bind(window);
    const chat = {
      id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      title: "New chat",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input instanceof Request
              ? input.url
              : String(input);
      const path = new URL(url, "http://localhost").pathname.replace(/\/$/, "");
      const method =
        init?.method ||
        (input instanceof Request ? input.method : "GET");
      if (!path.startsWith("/api/chats")) {
        return origFetch(input, init);
      }
      if (path === "/api/chats" && method === "GET") {
        return new Response(JSON.stringify([chat]), {
          headers: { "content-type": "application/json" },
        });
      }
      if (path === "/api/chats" && method === "POST") {
        return new Response(JSON.stringify(chat), {
          status: 201,
          headers: { "content-type": "application/json" },
        });
      }
      if (path === `/api/chats/${chat.id}` && method === "GET") {
        return new Response(JSON.stringify({ ...chat, messages: [] }), {
          headers: { "content-type": "application/json" },
        });
      }
      if (path.endsWith("/messages") && method === "GET") {
        return new Response("[]", {
          headers: { "content-type": "application/json" },
        });
      }
      if (path.endsWith("/messages") && method === "POST") {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const write = (event) => {
              controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            };
            write({
              type: "chunk",
              chunk: { type: "thinking", text: "ponder this" },
            });
            await new Promise((resolve) => setTimeout(resolve, 200));
            write({
              type: "chunk",
              chunk: { type: "text", text: "partial-STREAM-ONLY" },
            });
            await new Promise((resolve) => setTimeout(resolve, 200));
            write({
              type: "done",
              messages: [
                {
                  role: "assistant",
                  name: "gpt4o",
                  content: "Mocked assistant reply 😼",
                },
              ],
            });
            controller.close();
          },
        });
        return new Response(stream, {
          headers: { "content-type": "application/x-ndjson" },
        });
      }
      return origFetch(input, init);
    };
  });

  await page.goto("/chat");
  await enterEmail(page);
  await page.getByRole("button", { name: "New chat" }).click();
  await page.locator("textarea").fill("hello there");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("hello there")).toBeVisible();
  await expect(page.getByText("partial-STREAM-ONLY")).toBeVisible();
  await expect(page.getByText("Mocked assistant reply")).toBeVisible();
  await expect(page.getByText("partial-STREAM-ONLY")).toHaveCount(0);
  await page.getByText("Thoughts").click();
  await expect(page.getByText("ponder this")).toBeVisible();
});

test("unknown agent shows an error instead of crashing", async ({ page }) => {
  await page.route("**/api/chats**", async (route) => {
    const path = apiPath(route.request().url());
    const method = route.request().method();
    if (path === "/api/chats" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
      return;
    }
    if (path === "/api/chats" && method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(CHAT),
      });
      return;
    }
    if (path === `/api/chats/${CHAT_ID}` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...CHAT, messages: [] }),
      });
      return;
    }
    if (path.endsWith("/messages") && method === "POST") {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unknown agent: nope" }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/chat");
  await enterEmail(page);
  await page.getByRole("button", { name: "New chat" }).click();
  await page.locator("textarea").fill("hello");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Unknown agent: nope")).toBeVisible();
});
