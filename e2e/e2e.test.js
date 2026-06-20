import { test, expect } from '@playwright/test';

test.describe('EcoTrack Personal Carbon Footprint Tracker - E2E Flow', () => {
  
  test('Complete User Lifecycle Flow', async ({ page }) => {
    // 1. Visit the home page (unauthenticated state redirects to login)
    await page.goto('/');
    await expect(page).toHaveTitle(/EcoTrack/);
    await expect(page.locator('text=Log in to track your personal carbon footprint')).toBeVisible();

    // 2. Toggle to Signup view
    await page.click('button:has-text("Sign up here")');
    await expect(page.locator('text=Create an account to start tracking emissions')).toBeVisible();

    // 3. Register a new user
    const randomEmail = `e2e-user-${Date.now()}@example.com`;
    await page.fill('#signup-email', randomEmail);
    await page.fill('#signup-pass', 'e2etest123');
    await page.fill('#signup-confirm', 'e2etest123');
    await page.click('button:has-text("Create Account")');

    // 4. Onboarding Quiz Step 1: Diet Selection
    await expect(page.locator('text=What is your primary diet?')).toBeVisible();
    await page.click('button:has-text("Vegan")');
    await page.click('button:has-text("Next")');

    // Onboarding Step 2: Commute Mode & Distance
    await expect(page.locator('text=Tell us about your commute')).toBeVisible();
    await page.click('button:has-text("Electric Vehicle")');
    // Adjust commute slider if visible
    const slider = page.locator('input[type="range"]');
    if (await slider.isVisible()) {
      await slider.fill('80'); // 80 km/week
    }
    await page.click('button:has-text("Next")');

    // Onboarding Step 3: Home Energy
    await expect(page.locator('text=Home energy utilities')).toBeVisible();
    await page.click('button:has-text("Green Energy")');
    await page.click('button:has-text("Next")');

    // Onboarding Step 4: Household Size
    await expect(page.locator('text=Household details')).toBeVisible();
    // Default size is 2. Click '+' to increment size to 3
    await page.click('button:has-text("+")');
    await page.click('button:has-text("Next")');

    // Onboarding Step 5: Footprint Summary & transparent calculations
    await expect(page.locator('text=Your Estimated Monthly Footprint')).toBeVisible();
    
    // Baseline math check:
    // Diet (Vegan) = 50 kg CO2e
    // Transport (EV) = 80 km * 4.345 weeks * 0.05 factor = 17.38 kg CO2e -> 17.4 kg
    // Home Energy (Green) = 70 kg shared / 3 members = 23.3 kg CO2e
    // Waste = 22.5 kg CO2e
    // Total baseline expected = 50 + 17.4 + 23.3 + 22.5 = 113.2 kg CO2e
    await expect(page.locator('text=113.2 kg CO2e')).toBeVisible();
    
    // Check transparent formula output is shown
    await expect(page.locator('text=80 km/wk × 4.345 wks × 0.05 kg/km = 17.4 kg CO2e')).toBeVisible();

    // Submit baseline
    await page.click('button:has-text("Complete Onboarding & Enter Dashboard")');

    // 5. Verify Dashboard load & baseline card matches
    await expect(page.locator('text=This Month\'s Footprint')).toBeVisible();
    
    const baselineCardValue = page.locator('text=113.2').first();
    await expect(baselineCardValue).toBeVisible();

    const monthlyFootprintCard = page.locator('text=0.0').first();
    await expect(monthlyFootprintCard).toBeVisible();

    // 6. Switch to Activity Logger page
    await page.click('button:has-text("Activity Logger")');
    await expect(page.locator('text=Log Daily Activity')).toBeVisible();

    // Log a transport activity (Electric car commute)
    await page.selectOption('#activity-type', 'car_electric');
    await page.fill('#amount-input', '100');
    await page.fill('#notes-input', 'E2E test drive');
    
    // Verify live calculation box shows correct calculations before submitting
    await expect(page.locator('text=100 km × 0.05 kg CO2e/km = 5 kg CO2e')).toBeVisible();
    
    // Submit activity
    await page.click('button:has-text("Log Carbon Activity")');

    // Verify activity logged in the table
    await expect(page.locator('table')).toContainText('Car Electric');
    await expect(page.locator('table')).toContainText('100 km');
    await expect(page.locator('table')).toContainText('5.00 kg');
    await expect(page.locator('table')).toContainText('E2E test drive');

    // 7. Verify Dashboard update
    await page.click('button:has-text("Dashboard")');
    
    // Monthly footprint card should update from 0.0 to 5.0
    await expect(page.locator('text=5.0').first()).toBeVisible();

    // Savings card should show: 113.2 - 5.0 = 108.2
    await expect(page.locator('text=108.2').first()).toBeVisible();
  });
});
