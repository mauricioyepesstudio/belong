import { expect, test } from "@playwright/test";

test("landing page renders the hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Build your future");
});

test("login page shows the email form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test("register page renders", async ({ page }) => {
  const response = await page.goto("/register");
  expect(response?.status()).toBe(200);
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

for (const path of ["/dashboard", "/projects", "/settings"]) {
  test(`${path} redirects signed-out users to login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}`));
  });
}
