import { expect, test } from "@playwright/test";

test("chat page shows provider-grouped model select", async ({ page }) => {
  await page.goto("/chat");

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

test("sending a message renders the assistant reply", async ({ page }) => {
  await page.route("**/api/message/**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
      return;
    }
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            role: "assistant",
            name: "gpt4o",
            content: "Mocked assistant reply 😼",
          },
        ]),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/chat");
  await page.locator("textarea").fill("hello there");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("hello there")).toBeVisible();
  await expect(page.getByText("Mocked assistant reply")).toBeVisible();
});
