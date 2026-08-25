import { expect, test } from "@playwright/test";

test.describe("course navigation", () => {
  test("keeps the full desktop sidebar reachable at laptop height", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/#/map");

    const sidebar = page.locator("aside.sidebar");
    const lastNavigationItem = sidebar.getByRole("button", { name: /Problem-solving Lab/ });

    await expect(sidebar).toBeVisible();
    await expect(sidebar).not.toHaveAttribute("aria-hidden");
    await expect(sidebar).not.toHaveAttribute("inert");
    const sidebarMetrics = await sidebar.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(sidebarMetrics.scrollHeight).toBeGreaterThan(sidebarMetrics.clientHeight);

    await sidebar.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(lastNavigationItem).toBeInViewport();

    await lastNavigationItem.click();
    await expect(page).toHaveURL(/#\/problem-solving-lab$/);
  });
});

test.describe("mobile course drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/#/map");
  });

  test("keeps the closed drawer out of the focus order and restores focus after Escape", async ({ page }) => {
    const menuButton = page.locator(`button[aria-controls="mobile-course-navigation"]`);
    const sidebar = page.locator("#mobile-course-navigation");
    const firstSidebarButton = sidebar.locator("button").first();

    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar).toHaveAttribute("aria-hidden", "true");
    await expect(sidebar).toHaveAttribute("inert", "");

    await menuButton.focus();
    await page.keyboard.press("Tab");
    await expect(firstSidebarButton).not.toBeFocused();

    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-label", "關閉課程選單");
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(sidebar).toHaveAttribute("aria-hidden", "false");
    await expect(sidebar).not.toHaveAttribute("inert");

    const lastSidebarButton = sidebar.locator("button").last();
    await expect(firstSidebarButton).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(lastSidebarButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(firstSidebarButton).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar).toHaveAttribute("aria-hidden", "true");
    await expect(sidebar).toHaveAttribute("inert", "");
    await expect(menuButton).toBeFocused();
  });

  test("closes and returns focus when selecting a route", async ({ page }) => {
   const menuButton = page.locator(`button[aria-controls="mobile-course-navigation"]`);
   const sidebar = page.locator("#mobile-course-navigation");
    const scrim = page.getByRole("button", { name: "關閉選單", exact: true });

   await menuButton.click();
    await scrim.click();
    await expect(menuButton).toBeFocused();

    await menuButton.click();
   await sidebar.getByRole("button", { name: /Git Lab/ }).click();

    await expect(page).toHaveURL(/#\/lab$/);
    await expect(menuButton).toBeFocused();
  });
});
