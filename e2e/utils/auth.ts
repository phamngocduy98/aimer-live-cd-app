import { expect, type Page } from "@playwright/test";

export async function loginFromUserMenu(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.getByRole("button", { name: "User menu" }).click();
  const loginMenu = page.getByRole("menuitem", { name: "Login" });
  if (!(await loginMenu.isVisible())) {
    await page.keyboard.press("Escape");
    return;
  }

  await loginMenu.click();
  const login = page.getByRole("dialog", { name: "Login" });
  await login.getByLabel("Username").fill(username);
  await login.getByLabel("Password").fill(password);
  await login.getByRole("button", { name: "Login" }).click();
  await expect(login).not.toBeVisible();
}
