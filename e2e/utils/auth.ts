import { expect, type Page } from "@playwright/test";

export async function loginFromUserMenu(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  const loginButton = page.getByRole("button", { name: "Login" }).first();
  if (!(await loginButton.isVisible())) {
    return;
  }

  await loginButton.click();
  const login = page.getByRole("dialog", { name: "Login" });
  await login.getByLabel("Username").fill(username);
  await login.getByLabel("Password").fill(password);
  await login.getByRole("button", { name: "Log In" }).click();
  await expect(login).not.toBeVisible();
}
