import { test, expect } from '@playwright/test';

test('landing page renders OpsPilot enterprise pillars', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('OpsPilot').first()).toBeVisible();
  await expect(page.getByText('Multi-Tenant Isolation & RBAC')).toBeVisible();
});

test('demo admin signs in, views Executive Dashboard KPIs, and queries AI Assistant', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Executive Operations Dashboard')).toBeVisible();
  await expect(page.getByText('Industrial Assets')).toBeVisible();

  await page.goto('/ai-assistant');
  await page.getByRole('button', { name: /Ask OpsPilot AI/i }).click();
  await expect(page.getByText('OpsPilot Intelligence Response')).toBeVisible();
});
