import { VENUES } from "../../src/content";
import { test, expect, type Page } from "@playwright/test";
import {
  fresh,
  SAVE_KEY,
  serialize,
  startGig,
  type State,
} from "../../src/engine";
async function seed(page: Page, s: State) {
  await page.addInitScript(
    ({ key, raw }) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem(key, raw);
        sessionStorage.setItem("seeded", "1");
      }
    },
    { key: SAVE_KEY, raw: serialize(s) },
  );
  await page.goto("/");
}
async function saved(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
}
test("opening loop, keyboard, purchase, settings and reload persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const riff = page.getByRole("button", { name: "PLAY RIFF MAKE SOME NOISE" });
  await riff.focus();
  await page.keyboard.press("Space");
  for (let i = 0; i < 14; i++) await riff.click();
  await page
    .getByRole("button", {
      name: "Buy Junkyard strings for 15 credits",
      exact: true,
    })
    .click();
  await expect(page.locator(".stats")).toContainText("0.3");
  await page
    .getByRole("button", { name: "Enable sound effects", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mute sound effects", exact: true }),
  ).toBeVisible();
  await riff.click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("BAND NAME", { exact: true }).fill("Iron Ghost");
  await page.getByRole("button", { name: "SAVE", exact: true }).click();
  await page.getByRole("button", { name: "Reduce motion OFF" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(page.locator(".stage-stamp")).toContainText("IRON GHOST");
  expect((await saved(page)).gear.guitar).toBe(1);
  expect((await saved(page)).reducedMotion).toBe(true);
  expect(errors).toEqual([]);
});
test("band, concurrent gig and album, offline completion and safe reload", async ({
  page,
}) => {
  const now = Date.now();
  const s = { ...fresh(now), credits: 10000 };
  await seed(page, s);
  await page.getByRole("button", { name: "Band 0/4", exact: true }).click();
  await page
    .locator(".musician")
    .filter({ hasText: "Hex" })
    .getByRole("button")
    .click();
  await expect(
    page.locator(".musician").filter({ hasText: "Hex" }),
  ).toContainText("ON STAGE");
  await page.getByRole("button", { name: "Albums", exact: true }).click();
  await page
    .getByRole("button", { name: "RECORD · 500 ₡", exact: true })
    .click();
  await page.getByRole("button", { name: "Gigs", exact: true }).click();
  await page
    .getByRole("button", { name: "BOOK SHOW", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Band 1/4", exact: true }).click();
  await expect(
    page.locator(".musician").filter({ hasText: "Crash" }).getByRole("button"),
  ).toBeDisabled();
  // Seed an elapsed save in a fresh document to exercise load-time recovery.
  const progress = await saved(page);
  progress.lastSeen = Date.now() - 700000;
  progress.created = progress.lastSeen;
  progress.gig.started = progress.lastSeen;
  progress.gig.ends = progress.lastSeen + 60000;
  progress.recording.started = progress.lastSeen;
  progress.recording.ends = progress.lastSeen + 600000;
  await page.goto("about:blank");
  await page.goto("/"); // Existing game settles before replacement.
  await page.evaluate(
    ({ key, raw }) => {
      localStorage.setItem(key, raw);
    },
    { key: SAVE_KEY, raw: serialize(progress) },
  );
  // Avoid pagehide overwriting our fixture: navigate via a second page in the same isolated test context.
  const second = await page.context().newPage();
  await second.goto("/");
  await expect(second.getByRole("dialog")).toContainText(
    "The noise never stopped.",
  );
  await expect(second.locator(".return-summary")).toContainText(
    "Static in the Wires released",
  );
  await expect(second.locator(".return-summary")).toContainText(
    "Open-door rehearsal completed",
  );
  await second.getByRole("button", { name: "BACK TO THE NOISE" }).click();
  await second
    .getByRole("button", { name: "PLAY RIFF MAKE SOME NOISE" })
    .click();
  const result = await saved(second);
  expect(result.shows).toBe(1);
  expect(result.albums).toEqual([0]);
  expect(result.gig).toBeNull();
  expect(result.recording).toBeNull();
  await second.reload();
  await expect(second.getByRole("dialog")).not.toBeVisible();
  expect((await saved(second)).shows).toBe(1);
});
test("save download, invalid import, confirmed valid restore and reset", async ({
  page,
}) => {
  await seed(page, { ...fresh(), name: "Backup Band", credits: 1234 });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "EXPORT SAVE", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("neon-riot-era-1.json");
  await page.locator("input[type=file]").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken"),
  });
  await expect(page.getByRole("status")).toContainText("not a valid JSON save");
  expect((await saved(page)).name).toBe("Backup Band");
  await page.locator("input[type=file]").setInputFiles({
    name: "restore.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      serialize({ ...fresh(), name: "Restored Band", credits: 5000 }),
    ),
  });
  await expect(page.getByRole("dialog")).toContainText(
    "Restore this transmission?",
  );
  await page.getByRole("button", { name: "REPLACE & RESTORE" }).click();
  await expect(page.locator(".stage-stamp")).toContainText("RESTORED BAND");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Erase all progress" }).click();
  await expect(page.getByRole("dialog")).toContainText("Pull the plug?");
  await page.getByRole("button", { name: "ERASE & RESTART" }).click();
  expect((await saved(page)).credits).toBe(0);
  expect((await saved(page)).name).toBe("Neon Riot");
});
test("orbital completion unlocks prestige and preserves achievements", async ({
  page,
}) => {
  const now = Date.now();
  let s: State = {
    ...fresh(now - 65000000),
    credits: 1e9,
    fans: 200000,
    gear: { guitar: 30, amp: 30, automation: 30, merch: 30, distribution: 30 },
    name: "Orbit Band",
  };
  s = startGig(s, 5, s.lastSeen);
  await seed(page, s);
  await page.getByRole("button", { name: "BACK TO THE NOISE" }).click();
  await page.locator(".legend-stat").click();
  await expect(page.getByRole("dialog")).toContainText("NEXT ERA REWARD");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "START A NEW ERA", exact: true })
    .click();
  await expect(page.locator(".era-label")).toContainText("ERA 02");
  const result = await saved(page);
  expect(result.legend).toBeGreaterThan(0);
  expect(result.credits).toBe(0);
  expect(result.fans).toBe(0);
  expect(result.achievements).toContain("orbital");
  expect(result.name).toBe("Orbit Band");
});
test("corrupt saves remain untouched until explicit recovery", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{"version":99}'),
    SAVE_KEY,
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Save protection");
  await page.getByRole("button", { name: "PLAY RIFF MAKE SOME NOISE" }).click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
  ).toBe('{"version":99}');
});
test("storage failure stays playable and offers export", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value() {
        throw new Error("Storage denied");
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "PLAY RIFF MAKE SOME NOISE" }).click();
  await expect(page.getByRole("alert")).toContainText("storage is unavailable");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "EXPORT SAVE", exact: true }),
  ).toBeEnabled();
});
for (const width of [390, 768, 1440])
  test(`responsive layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("heading", { name: "MAKE THE CITY SCREAM." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    for (const tab of ["Band 0/4", "Gigs", "Albums", "Gear"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: `test-results/neon-riot-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  });
for (let i = 0; i < VENUES.length; i++)
  test(`venue ${i + 1} renders its stage and full lineup`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const s: State = {
      ...fresh(),
      credits: 1e7,
      fans: VENUES[i].fans,
      gear: {
        guitar: VENUES[i].gear,
        amp: 6,
        automation: 1,
        merch: 1,
        distribution: 1,
      },
      recruited: ["hex", "echo", "nyx", "zero"],
      lineup: { drums: "hex", bass: "echo", vocals: "nyx", synth: "zero" },
    };
    await seed(page, s);
    await expect(
      page.getByRole("heading", { name: VENUES[i].name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: `Your band performing in venue ${i + 1}, with 4 recruited musicians`,
      }),
    ).toBeVisible();
    await page.locator(".stage-panel").screenshot({
      path: `test-results/venue-${i + 1}.png`,
      animations: "disabled",
    });
  });

test("generated art, rapid riff feedback and persistent FX controls", async ({
  page,
}) => {
  await page.goto("/");
  const stage = page.locator(".performance-stage");
  const play = page.getByRole("button", { name: "PLAY RIFF MAKE SOME NOISE" });
  await stage.scrollIntoViewIfNeeded();
  await expect(page.locator(".scene-backdrop")).toHaveJSProperty(
    "complete",
    true,
  );
  expect(
    await page
      .locator(".scene-backdrop")
      .evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBe(1536);
  for (let i = 0; i < 20; i++) await play.click();
  expect((await saved(page)).riffs).toBe(20);
  await expect(stage).not.toHaveClass(/is-playing/);
  await expect(page.locator(".signal-bars")).not.toHaveClass(/signal-active/);
  await page
    .getByRole("button", { name: "Pause visual effects", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Resume visual effects", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".scene-backdrop")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume visual effects", exact: true }),
  ).toBeVisible();
  await play.click();
  expect((await saved(page)).riffs).toBe(21);
  await page
    .getByRole("button", { name: "Resume visual effects", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause visual effects", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Albums", exact: true }).click();
  await expect(page.locator(".album-art .generated-cover")).toHaveCount(6);
  await page.screenshot({
    path: "test-results/albums-redesign.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("system reduced motion keeps gameplay functional and effects static", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page
      .locator(".scene-backdrop")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".performer-motion")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: "PLAY RIFF MAKE SOME NOISE" }).click();
  expect((await saved(page)).riffs).toBe(1);
});
test("stage effects pause when scrolled offscreen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto("/");
  const stage = page.locator(".performance-stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).not.toHaveClass(/motion-paused/);
  await page
    .getByRole("button", { name: "FIELD GUIDE", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(stage).toHaveClass(/motion-paused/);
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).not.toHaveClass(/motion-paused/);
});

test("soundtrack plays on request, seeks, and persists across game tabs", async ({
  page,
}) => {
  await seed(page, { ...fresh(), albums: [4] });
  const audio = page.locator(".song-player audio");
  await expect
    .poll(() => audio.evaluate((el: HTMLAudioElement) => el.duration))
    .toBeGreaterThan(0);
  expect(await audio.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
  await page.getByRole("button", { name: "Albums", exact: true }).click();
  await page
    .locator(".album-card")
    .filter({ hasText: "Kill the Algorithm" })
    .getByRole("button", { name: "LISTEN TO SINGLE", exact: true })
    .click();
  await expect
    .poll(() => audio.evaluate((el: HTMLAudioElement) => el.currentTime))
    .toBeGreaterThan(0);
  await expect(page.locator(".song-player")).toContainText("ON AIR");
  await audio.evaluate((el: HTMLAudioElement) => {
    el.currentTime = 30;
  });
  await page.getByRole("button", { name: "Band 0/4", exact: true }).click();
  await expect
    .poll(() => audio.evaluate((el: HTMLAudioElement) => el.currentTime))
    .toBeGreaterThanOrEqual(30);
  expect(await audio.evaluate((el: HTMLAudioElement) => el.paused)).toBe(false);
  await audio.evaluate((el: HTMLAudioElement) => el.pause());
  await expect(page.locator(".song-player")).toContainText("TRACK 05");
  await page.reload();
  expect(
    await page
      .locator(".song-player audio")
      .evaluate((el: HTMLAudioElement) => el.paused),
  ).toBe(true);
});

test("all five singles load and play from albums and the radio selector", async ({
  page,
}) => {
  await seed(page, { ...fresh(), albums: [0, 1, 2, 3, 4] });
  await page.getByRole("button", { name: "Albums", exact: true }).click();
  const audio = page.locator(".song-player audio");
  const titles = [
    "Static in the Wires",
    "Concrete Cathedral",
    "Chrome Is a Disease",
    "No Gods / Only Noise",
    "Kill the Algorithm",
  ];
  await expect(
    page.getByRole("button", { name: "LISTEN TO SINGLE", exact: true }),
  ).toHaveCount(5);
  for (const title of titles) {
    await page
      .locator(".album-card")
      .filter({ hasText: title })
      .getByRole("button", { name: "LISTEN TO SINGLE", exact: true })
      .click();
    await expect(page.locator(".song-player h3")).toHaveText(title);
    await expect
      .poll(() => audio.evaluate((el: HTMLAudioElement) => el.duration))
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        audio.evaluate(
          (el: HTMLAudioElement) => !el.paused && el.currentTime > 0,
        ),
      )
      .toBe(true);
  }
  await page.getByLabel("Choose a song").selectOption("Static in the Wires");
  await expect(audio).toHaveAttribute("src", "/audio/static-in-the-wires.mp3");
  await expect
    .poll(() =>
      audio.evaluate(
        (el: HTMLAudioElement) => !el.paused && el.currentTime > 0,
      ),
    )
    .toBe(true);
  await expect(page.locator(".song-player .song-error")).toHaveCount(0);
});

test("songs stay locked until their albums are released", async ({ page }) => {
  await page.goto("/");
  const radio = page.locator(".song-player");
  await expect(radio).toContainText("SIGNAL LOCKED");
  await expect(radio).toContainText("Release an album to unlock its song");
  await expect(radio.locator("audio")).toHaveCount(0);
  await page.getByRole("button", { name: "Albums", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "LISTEN TO SINGLE", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("RELEASE TO UNLOCK SONG")).toHaveCount(5);
});

test("a released album unlocks only its own song", async ({ page }) => {
  await seed(page, { ...fresh(), albums: [0] });
  const radio = page.locator(".song-player");
  await expect(radio).toContainText("Static in the Wires");
  await expect(page.getByLabel("Choose a song").locator("option")).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Albums", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "LISTEN TO SINGLE", exact: true }),
  ).toHaveCount(1);
});
