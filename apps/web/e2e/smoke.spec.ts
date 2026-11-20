import { test, expect } from '@playwright/test';

test('login hero renders OpsPilot corporate HQ design & value proposition', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('OpsPilot').first()).toBeVisible();
  await expect(page.getByText('Manage.')).toBeVisible();
  await expect(page.getByText('Welcome Back!')).toBeVisible();
});

test('demo admin signs in and navigates Dashboard, Employees, Inventory, Maintenance, Reports, AI & Settings', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Sign In/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Dashboard Overview')).toBeVisible();
  await expect(page.getByText('Business Performance')).toBeVisible();
  await expect(page.getByText('Department Overview')).toBeVisible();

  await page.goto('/employees');
  await expect(page.getByText('Employee Management')).toBeVisible();

  await page.goto('/inventory');
  await expect(page.getByText('Inventory Management')).toBeVisible();

  await page.goto('/maintenance');
  await expect(page.getByText('Maintenance & Work Orders')).toBeVisible();

  await page.goto('/reports');
  await expect(page.getByText('Reports & Analytics')).toBeVisible();

  await page.goto('/ai-assistant');
  await expect(page.getByText('AI Business Assistant')).toBeVisible();

  await page.goto('/settings');
  await expect(page.getByText('System Settings')).toBeVisible();
  await expect(page.getByText('Company Information')).toBeVisible();
});
