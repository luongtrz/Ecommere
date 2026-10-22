import { expect, test } from '@playwright/test';

// Seeded customer (prisma/seed.ts). The password must match SEED_USER_PASSWORD used when seeding.
const phone = '0912345678';
const password = process.env.E2E_USER_PASSWORD ?? '';

test('customer can log in with phone and password', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('0912345678').fill(phone);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Đăng Nhập Ngay' }).click();

  await expect(page).not.toHaveURL(/\/login/);
});
