# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: xps.test.js >> XPS Control Plane >> Electric gold accent is present in the DOM
- Location: e2e/xps.test.js:382:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - img "XPS" [ref=e7]
      - generic [ref=e8]:
        - generic [ref=e9]: XPS INTELLIGENCE
        - generic [ref=e10]: COMMAND CENTER
    - navigation [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: MAIN
        - button "Dashboard" [ref=e14] [cursor=pointer]:
          - img [ref=e15]
          - generic [ref=e20]: Dashboard
        - button "CRM" [ref=e22] [cursor=pointer]:
          - img [ref=e23]
          - generic [ref=e28]: CRM
        - button "Leads" [ref=e29] [cursor=pointer]:
          - img [ref=e30]
          - generic [ref=e34]: Leads
        - button "ByteBot" [ref=e35] [cursor=pointer]:
          - img [ref=e36]
          - generic [ref=e39]: ByteBot
        - button "Research Lab" [ref=e40] [cursor=pointer]:
          - img [ref=e41]
          - generic [ref=e43]: Research Lab
        - button "Outreach" [ref=e44] [cursor=pointer]:
          - img [ref=e45]
          - generic [ref=e48]: Outreach
        - button "Proposals" [ref=e49] [cursor=pointer]:
          - img [ref=e50]
          - generic [ref=e53]: Proposals
        - button "Analytics" [ref=e54] [cursor=pointer]:
          - img [ref=e55]
          - generic [ref=e56]: Analytics
      - generic [ref=e57]:
        - generic [ref=e58]: INTELLIGENCE
        - button "Knowledge Base" [ref=e59] [cursor=pointer]:
          - img [ref=e60]
          - generic [ref=e62]: Knowledge Base
        - button "Competition" [ref=e63] [cursor=pointer]:
          - img [ref=e64]
          - generic [ref=e66]: Competition
        - button "Connectors" [ref=e67] [cursor=pointer]:
          - img [ref=e68]
          - generic [ref=e70]: Connectors
      - generic [ref=e71]:
        - generic [ref=e72]: OPERATOR
        - button "Editor / Workspace" [ref=e73] [cursor=pointer]:
          - img [ref=e74]
          - generic [ref=e78]: Editor / Workspace
        - button "Scraper Control" [ref=e79] [cursor=pointer]:
          - img [ref=e80]
          - generic [ref=e83]: Scraper Control
        - button "Workflow Builder" [ref=e84] [cursor=pointer]:
          - img [ref=e85]
          - generic [ref=e89]: Workflow Builder
        - button "Job Logs" [ref=e90] [cursor=pointer]:
          - img [ref=e91]
          - generic [ref=e94]: Job Logs
        - button "Artifacts" [ref=e95] [cursor=pointer]:
          - img [ref=e96]
          - generic [ref=e100]: Artifacts
      - generic [ref=e101]:
        - generic [ref=e102]: XPS SYSTEMS
        - button "Admin Control Plane" [ref=e103] [cursor=pointer]:
          - img [ref=e104]
          - generic [ref=e106]: Admin Control Plane
        - button "Vision Cortex" [ref=e107] [cursor=pointer]:
          - img [ref=e108]
          - generic [ref=e111]: Vision Cortex
        - button "Auto Builder" [ref=e112] [cursor=pointer]:
          - img [ref=e113]
          - generic [ref=e115]: Auto Builder
        - button "Intel Core" [ref=e116] [cursor=pointer]:
          - img [ref=e117]
          - generic [ref=e125]: Intel Core
        - button "Sandbox" [ref=e126] [cursor=pointer]:
          - img [ref=e127]
          - generic [ref=e129]: Sandbox
        - button "Quarantine" [ref=e130] [cursor=pointer]:
          - img [ref=e131]
          - generic [ref=e134]: Quarantine
      - generic [ref=e135]:
        - generic [ref=e136]: SYSTEM
        - button "Admin" [ref=e137] [cursor=pointer]:
          - img [ref=e138]
          - generic [ref=e140]: Admin
        - button "Settings" [ref=e141] [cursor=pointer]:
          - img [ref=e142]
          - generic [ref=e145]: Settings
    - button "Collapse sidebar" [ref=e146] [cursor=pointer]:
      - img [ref=e147]
  - generic [ref=e149]:
    - banner [ref=e150]:
      - generic [ref=e151]:
        - img "XPS" [ref=e153]
        - generic [ref=e154]: XPS
      - generic [ref=e156]:
        - button "Workspace" [ref=e157] [cursor=pointer]:
          - img [ref=e158]
          - generic [ref=e163]: Workspace
        - button "Admin" [ref=e164] [cursor=pointer]:
          - img [ref=e165]
          - generic [ref=e167]: Admin
      - button "Toggle sidebar" [ref=e169] [cursor=pointer]:
        - img [ref=e170]
      - generic [ref=e172]: Dashboard
      - generic [ref=e173]:
        - img
        - textbox "Search leads, companies, proposals…" [ref=e174]
      - generic [ref=e175]: synthetic
      - button [ref=e177] [cursor=pointer]:
        - img [ref=e178]
      - generic [ref=e184]: XP
    - main [ref=e185]:
      - generic [ref=e187]:
        - generic [ref=e188]:
          - heading "Command Center" [level=1] [ref=e189]
          - paragraph [ref=e190]: Awaiting configuration — connect data sources to activate your intelligence briefing
        - generic [ref=e191]:
          - generic [ref=e192]:
            - generic [ref=e193]:
              - img [ref=e194]
              - generic [ref=e199]: NO LIVE DATA
            - generic [ref=e200]: —
            - generic [ref=e201]: Active Leads
            - generic [ref=e202]: awaiting sync
          - generic [ref=e203]:
            - generic [ref=e204]:
              - img [ref=e205]
              - generic [ref=e207]: NO LIVE DATA
            - generic [ref=e208]: —
            - generic [ref=e209]: Pipeline Value
            - generic [ref=e210]: awaiting sync
          - generic [ref=e211]:
            - generic [ref=e212]:
              - img [ref=e213]
              - generic [ref=e216]: NO LIVE DATA
            - generic [ref=e217]: —
            - generic [ref=e218]: Proposals Sent
            - generic [ref=e219]: awaiting sync
          - generic [ref=e220]:
            - generic [ref=e221]:
              - img [ref=e222]
              - generic [ref=e226]: NO LIVE DATA
            - generic [ref=e227]: —
            - generic [ref=e228]: Close Rate
            - generic [ref=e229]: awaiting sync
        - generic [ref=e230]:
          - generic [ref=e231]:
            - generic [ref=e232]:
              - generic [ref=e233]: Revenue Pipeline
              - generic [ref=e234]: Monthly pipeline value trend
            - generic [ref=e235]:
              - img [ref=e236]
              - generic [ref=e238]: AWAITING DATA SYNC
          - generic [ref=e239]:
            - generic [ref=e240]:
              - generic [ref=e241]: Pipeline Stages
              - generic [ref=e242]: Lead distribution by stage
            - generic [ref=e243]:
              - img [ref=e244]
              - generic [ref=e246]: AWAITING DATA SYNC
        - generic [ref=e247]:
          - generic [ref=e248]:
            - generic [ref=e249]: Top Leads
            - generic [ref=e250]:
              - generic [ref=e251]: Company
              - generic [ref=e252]: Score
              - generic [ref=e253]: Stage
              - generic [ref=e254]: Value
            - generic [ref=e255]:
              - img [ref=e256]
              - generic [ref=e259]: NO LIVE DATA
          - generic [ref=e260]:
            - generic [ref=e261]: Recent Activity
            - generic [ref=e262]:
              - img [ref=e263]
              - generic [ref=e265]: AWAITING SYNC
              - generic [ref=e266]: Connect data sources to see activity
  - generic [ref=e267]:
    - generic [ref=e268]:
      - generic [ref=e269]:
        - generic [ref=e270]: AGENT RAIL
        - generic [ref=e271]: 1 messages
      - button "XPS Orchestrator" [ref=e273] [cursor=pointer]:
        - generic [ref=e274]:
          - img [ref=e275]
          - generic [ref=e277]: XPS Orchestrator
        - img [ref=e278]
      - button "Agent Mode" [ref=e281] [cursor=pointer]:
        - generic [ref=e282]:
          - img [ref=e283]
          - generic [ref=e286]: Agent Mode
        - img [ref=e287]
      - generic [ref=e289]:
        - generic [ref=e291]: Synthetic
        - generic [ref=e292]: SYNTHETIC
    - generic [ref=e294]:
      - generic [ref=e295]:
        - img [ref=e296]
        - text: XPS Orchestrator
      - generic [ref=e298]: — awaiting configuration — Select an agent and configure your API key to begin live orchestration. Running in synthetic mode.
    - generic [ref=e301]:
      - textbox "Message XPS Orchestrator…" [ref=e302]
      - generic [ref=e303]:
        - button "Attach file" [ref=e304] [cursor=pointer]:
          - img [ref=e305]
        - generic [ref=e307]: ↵ Send ⇧↵ Newline
        - button "Send" [disabled] [ref=e308]:
          - text: Send
          - img [ref=e309]
```

# Test source

```ts
  285 |     await agentSelector.click();
  286 |     await page.waitForTimeout(200);
  287 | 
  288 |     // Should show agent options
  289 |     const agentBtns = await page.locator('[data-testid="chat-rail"] button').count();
  290 |     expect(agentBtns).toBeGreaterThan(2);
  291 | 
  292 |     await screenshot(page, 'agent-selector-open');
  293 | 
  294 |     // Close by clicking elsewhere
  295 |     await page.keyboard.press('Escape');
  296 |   });
  297 | 
  298 |   test('Paperclip / attachment — opens attachment panel', async ({ page }) => {
  299 |     const attachBtn = page.locator('[data-testid="attach-btn"]');
  300 |     await expect(attachBtn).toBeVisible();
  301 | 
  302 |     // Click paperclip
  303 |     await attachBtn.click();
  304 |     await page.waitForTimeout(200);
  305 | 
  306 |     // Attachment panel should appear
  307 |     const panel = page.locator('[data-testid="attachment-panel"]');
  308 |     await expect(panel).toBeVisible();
  309 | 
  310 |     await screenshot(page, 'attachment-ui-open');
  311 |   });
  312 | 
  313 |   test('Attachment UI — shows all sources including blocked Google Drive', async ({ page }) => {
  314 |     await page.locator('[data-testid="attach-btn"]').click();
  315 |     await page.waitForTimeout(200);
  316 | 
  317 |     // Local file should be present
  318 |     await expect(page.locator('[data-testid="attach-source-local"]')).toBeVisible();
  319 |     await expect(page.locator('[data-testid="attach-source-image"]')).toBeVisible();
  320 |     await expect(page.locator('[data-testid="attach-source-doc"]')).toBeVisible();
  321 | 
  322 |     // Google Drive should be present (blocked state)
  323 |     await expect(page.locator('[data-testid="attach-source-drive"]')).toBeVisible();
  324 |     await screenshot(page, 'attachment-sources');
  325 |   });
  326 | 
  327 |   test('Google Drive attachment — shows blocked state', async ({ page }) => {
  328 |     await page.locator('[data-testid="attach-btn"]').click();
  329 |     await page.waitForTimeout(200);
  330 | 
  331 |     const driveBtn = page.locator('[data-testid="attach-source-drive"]');
  332 |     await expect(driveBtn).toBeVisible();
  333 | 
  334 |     // Should show blocked indicator (cursor: not-allowed or disabled)
  335 |     const disabled = await driveBtn.getAttribute('disabled');
  336 |     // blocked = !GOOGLE_DRIVE_CONFIGURED, so drive button should be disabled when not configured
  337 |     await screenshot(page, 'google-drive-blocked-state');
  338 |   });
  339 | 
  340 |   test('No emoji in primary UI surfaces', async ({ page }) => {
  341 |     // Check the visible text content for emoji patterns
  342 |     const bodyText = await page.locator('header').innerText();
  343 |     // Common emoji should not appear in header
  344 |     const emojiPattern = /[\u{1F300}-\u{1F9FF}]/u;
  345 |     expect(emojiPattern.test(bodyText)).toBe(false);
  346 | 
  347 |     // Check sidebar
  348 |     const sidebarText = await page.locator('aside').innerText();
  349 |     expect(emojiPattern.test(sidebarText)).toBe(false);
  350 | 
  351 |     // Check chat rail
  352 |     const chatText = await page.locator('[data-testid="chat-rail"]').innerText();
  353 |     expect(emojiPattern.test(chatText)).toBe(false);
  354 | 
  355 |     // Check workspace/editor panel (no emoji in workspace chrome or empty state)
  356 |     await page.locator('aside nav button', { hasText: 'Editor' }).click();
  357 |     await page.waitForTimeout(200);
  358 |     const workspaceText = await page.locator('main').innerText();
  359 |     expect(emojiPattern.test(workspaceText)).toBe(false);
  360 |   });
  361 | 
  362 |   test('No emoji in active workspace object renderer', async ({ page }) => {
  363 |     // Navigate to editor and create a code object to trigger the workspace renderer
  364 |     await page.locator('aside nav button', { hasText: 'Editor' }).click();
  365 |     await page.waitForTimeout(200);
  366 | 
  367 |     const emptyState = page.locator('[data-testid="workspace-empty-state"]');
  368 |     if (await emptyState.isVisible()) {
  369 |       // Create an object via quick-create
  370 |       await page.locator('[data-testid^="quick-create-"]').first().click();
  371 |       await page.waitForTimeout(300);
  372 |     }
  373 | 
  374 |     // Check center workspace active state has no emoji
  375 |     const emojiPattern = /[\u{1F300}-\u{1F9FF}]/u;
  376 |     const mainText = await page.locator('main').innerText();
  377 |     expect(emojiPattern.test(mainText)).toBe(false);
  378 | 
  379 |     await screenshot(page, 'center-workspace-renderer');
  380 |   });
  381 | 
  382 |   test('Electric gold accent is present in the DOM', async ({ page }) => {
  383 |     // Check that elements with the animated gradient class exist
  384 |     const goldElements = await page.locator('.xps-gold-accent, .xps-gold-text').count();
> 385 |     expect(goldElements).toBeGreaterThan(0);
      |                          ^ Error: expect(received).toBeGreaterThan(expected)
  386 |   });
  387 | 
  388 |   test('Text contrast — primary text is light on dark background', async ({ page }) => {
  389 |     // Check header text color is light
  390 |     const headerColor = await page.evaluate(() => {
  391 |       const h = document.querySelector('header');
  392 |       if (!h) return null;
  393 |       const spans = h.querySelectorAll('span');
  394 |       for (const span of spans) {
  395 |         const color = window.getComputedStyle(span).color;
  396 |         if (color && color !== 'rgba(0, 0, 0, 0)') return color;
  397 |       }
  398 |       return null;
  399 |     });
  400 |     // If we got a color, ensure it's not dark text (pure black = rgb(0,0,0))
  401 |     if (headerColor) {
  402 |       expect(headerColor).not.toBe('rgb(0, 0, 0)');
  403 |     }
  404 |   });
  405 | 
  406 |   test('Full workspace overview screenshot', async ({ page }) => {
  407 |     await screenshot(page, 'workspace-full-overview');
  408 |     // Just need no crash
  409 |     expect(true).toBe(true);
  410 |   });
  411 | 
  412 |   test('Workspace connectors panel icon surface', async ({ page }) => {
  413 |     await page.locator('aside nav button', { hasText: 'Connectors' }).click();
  414 |     await page.waitForTimeout(200);
  415 |     await screenshot(page, 'connectors-icon-surface');
  416 |   });
  417 | 
  418 |   test('Admin full overview screenshot', async ({ page }) => {
  419 |     await page.click('[data-testid="page-tab-admin"]');
  420 |     await page.waitForSelector('[data-testid="admin-nav-integrations"]', { timeout: 5000 });
  421 |     await screenshot(page, 'admin-full-overview');
  422 |     expect(true).toBe(true);
  423 |   });
  424 | });
  425 | 
```