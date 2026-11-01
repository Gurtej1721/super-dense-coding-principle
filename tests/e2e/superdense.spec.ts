import { test, expect } from '@playwright/test';

test.describe('Quantum Superdense Coding Simulator E2E', () => {
  test.beforeEach(async ({ context }) => {
    // Dismiss first-visit tour modal for automated tests
    await context.addInitScript(() => {
      window.localStorage.setItem('tour_seen', 'true');
    });
  });

  test('loads playground workspace with default state and accessible controls', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page.locator('h1')).toContainText(/Quantum Superdense Coding/i);

    // Check message buttons exist
    await expect(page.getByRole('radio', { name: /00/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /01/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /10/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /11/i })).toBeVisible();

    // Check Run and Reset controls
    await expect(page.getByRole('button', { name: /Run Protocol/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reset experiment state/i })).toBeVisible();
  });

  const messages = ['00', '01', '10', '11'] as const;

  for (const msg of messages) {
    test(`correctly encodes, simulates, and decodes message "${msg}" with 100% fidelity`, async ({ page }) => {
      await page.goto('/');

      // Select message
      const msgButton = page.getByRole('radio', { name: new RegExp(`^${msg}`, 'i') });
      await msgButton.click();

      // Click Run Protocol
      const runButton = page.getByRole('button', { name: /Run Protocol/i });
      await runButton.click();

      // Assert What You Are Seeing contains decoded message
      const summaryCallout = page.locator('text=What You Are Seeing').locator('..');
      await expect(summaryCallout).toContainText(`Decoded: '${msg}'`);

      // Assert probability bars show 100.0%
      await expect(page.getByText('100.0%', { exact: true })).toBeVisible();

      // Assert decoded basis state is dominant
      const stateInspectorRow = page.locator(`text=|${msg}⟩`).first().locator('..');
      await expect(stateInspectorRow).toBeVisible();
    });
  }

  test('stepping forward, backwards, and resetting to step 0', async ({ page }) => {
    await page.goto('/');

    const stepForwardBtn = page.getByRole('button', { name: /Step forward/i });
    const stepBackwardBtn = page.getByRole('button', { name: /Step backwards/i });
    const resetBtn = page.getByRole('button', { name: /Reset experiment state/i });

    // Initial step 0
    await expect(page.getByText('Step 0 of 7')).toBeVisible();

    // Step forward twice
    await stepForwardBtn.click();
    await expect(page.getByText('Step 1 of 7')).toBeVisible();

    await stepForwardBtn.click();
    await expect(page.getByText('Step 2 of 7')).toBeVisible();

    // Step backward once
    await stepBackwardBtn.click();
    await expect(page.getByText('Step 1 of 7')).toBeVisible();

    // Reset restores to step 0
    await resetBtn.click();
    await expect(page.getByText('Step 0 of 7')).toBeVisible();
  });

  test('clicking circuit gate opens GateDrawer with expanded matrix and math', async ({ page }) => {
    await page.goto('/');

    // Click Hadamard gate on q0 in the circuit
    const hadamardGate = page.getByRole('button', { name: /Hadamard on q0/i });
    await hadamardGate.click();

    // Drawer opens
    const drawerTitle = page.locator('#gate-drawer-title');
    await expect(drawerTitle).toBeVisible();
    await expect(drawerTitle).toContainText(/Hadamard/i);

    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(drawerTitle).not.toBeVisible();
  });

  test('navigates to compare, learn, and about pages', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.locator('h1')).toContainText(/Four-Message Comparative Matrix/i);
    await expect(page.getByText('All 4 States Proven Orthogonal')).toBeVisible();

    await page.goto('/learn');
    await expect(page.locator('h1')).toContainText(/The Quantum Superdense Coding Protocol/i);

    await page.goto('/about');
    await expect(page.locator('h1')).toContainText(/About Quantum Superdense Simulator/i);
  });

  test('interactive entanglement comparison demonstrates with vs without entanglement', async ({ page }) => {
    await page.goto('/compare');

    // Assert both panels are visible
    await expect(page.getByText(/With Shared Entanglement/i).first()).toBeVisible();
    await expect(page.getByText(/Without Entanglement/i).first()).toBeVisible();

    // Assert Concurrence metrics
    await expect(page.getByText(/C = 1.000/i)).toBeVisible();
    await expect(page.getByText(/C = 0.000/i)).toBeVisible();

    // Assert status indicators
    await expect(page.getByText(/100% Deterministic Decoding/i)).toBeVisible();
    await expect(page.locator('text=Ambiguous Decoding (50% / 50% Indeterminacy)')).toBeVisible();

    // Select message 01 in comparison
    const msg01Btn = page.getByRole('button', { name: /^01/i });
    if (await msg01Btn.isVisible()) {
      await msg01Btn.click();
      await expect(page.getByText(/Target: \|01⟩/i)).toBeVisible();
    }

    // Switch tabs to Four-Message Matrix
    const matrixTab = page.getByRole('button', { name: /Four-Message Matrix/i });
    await matrixTab.click();
    await expect(page.getByText('Alice Gate').first()).toBeVisible();

    // Switch back to Entanglement Comparison
    const comparisonTab = page.getByRole('button', { name: /Entanglement Comparison/i });
    await comparisonTab.click();
    await expect(page.getByText(/With Shared Entanglement/i).first()).toBeVisible();
  });

  test('toggles between circuit workbench and entanglement comparison on home page', async ({ page }) => {
    await page.goto('/');

    // Default is Circuit Workbench
    await expect(page.getByRole('button', { name: /Run Protocol/i })).toBeVisible();

    // Switch to Entanglement Comparison
    const compToggle = page.getByRole('button', { name: /Entanglement Comparison \(With vs Without\)/i });
    await compToggle.click();

    // Verify comparison view is active
    await expect(page.getByText(/With Shared Entanglement/i).first()).toBeVisible();
    await expect(page.getByText(/Without Entanglement/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Run Both Protocols/i })).toBeVisible();

    // Switch back to Circuit Workbench
    const workbenchToggle = page.getByRole('button', { name: /Circuit Workbench/i });
    await workbenchToggle.click();
    await expect(page.getByRole('button', { name: /Run Protocol/i })).toBeVisible();
  });

  test('clicking Run Simulation from learn or compare pages takes user to simulation workbench', async ({ page }) => {
    // 1. Start on /learn
    await page.goto('/learn');
    await expect(page.locator('h1')).toContainText(/The Quantum Superdense Coding Protocol/i);

    // Click Run Simulation link button
    const runSimBtn = page.getByRole('link', { name: /Run Simulation/i }).first();
    await runSimBtn.click();

    // Verify it navigates to the simulation workbench page
    await expect(page).toHaveURL(/\/\?tab=workbench/);
    await expect(page.getByRole('button', { name: /Run Protocol/i })).toBeVisible();
    await expect(page.locator('h1')).toContainText(/Quantum Superdense Coding/i);

    // 2. Start on /compare
    await page.goto('/compare');
    const compareRunSim = page.getByRole('link', { name: /Run Simulation/i }).first();
    await compareRunSim.click();

    await expect(page).toHaveURL(/\/\?tab=workbench/);
    await expect(page.getByRole('button', { name: /Run Protocol/i })).toBeVisible();
  });

  test('selecting Run Simulation Protocol in Command Palette navigates to simulation workbench', async ({ page }) => {
    await page.goto('/about');

    // Open command palette via button or shortcut
    const cmdPaletteBtn = page.getByRole('button', { name: /Command Palette/i });
    if (await cmdPaletteBtn.isVisible()) {
      await cmdPaletteBtn.click();
    } else {
      await page.keyboard.press('Control+k');
    }

    // Click Run Simulation Protocol command
    const runOption = page.getByRole('button', { name: /Run Simulation Protocol/i });
    await expect(runOption).toBeVisible();
    await runOption.click();

    // Should navigate to simulation workbench
    await expect(page).toHaveURL(/\/\?tab=workbench/);
    await expect(page.getByRole('button', { name: /Run Protocol/i })).toBeVisible();
  });
});
