/**
 * Deck orbs — same power-user canvas pattern as pm-land.
 * resolvePreset(state, 64) + native CSS px (no canvas upscale).
 * Docs: https://orbs.jakubantalik.com/
 */
import {
  MODE_DRAWS,
  resolvePreset,
  type OrbState,
} from "thinking-orbs";

const STATES = new Set<OrbState>([
  "working",
  "searching",
  "solving",
  "listening",
  "connecting",
  "weaving",
  "composing",
  "breathing",
  "shaping",
]);

const BRAND_SIZE = 36;

type OrbKind = "brand" | "hero";

interface Orb {
  mount: HTMLElement;
  canvas: HTMLCanvasElement;
  kind: OrbKind;
  draw: (typeof MODE_DRAWS)[keyof typeof MODE_DRAWS];
  opts: Record<string, number | undefined>;
  baseSpeed: number;
  size: number;
  dpr: number;
}

function asState(value: string | undefined): OrbState {
  if (value && STATES.has(value as OrbState)) return value as OrbState;
  return "solving";
}

function heroSize(): number {
  const w = window.innerWidth;
  if (w <= 575) return 220;
  if (w <= 991) return 280;
  return 340;
}

function kindOf(mount: HTMLElement): OrbKind {
  return mount.dataset.orbKind === "brand" ? "brand" : "hero";
}

function displaySize(kind: OrbKind): number {
  return kind === "brand" ? BRAND_SIZE : heroSize();
}

/** thinking-orbs: dark=true → light ink on dark backgrounds. */
function inkDark(mount: HTMLElement): boolean {
  const slide = mount.closest<HTMLElement>("[data-theme]");
  const theme = slide?.dataset.theme || document.body.dataset.theme || "hero";
  return theme !== "light";
}

function onstage(mount: HTMLElement): boolean {
  const slide = mount.closest(".slide");
  if (!slide) return true;
  return slide.classList.contains("is-active");
}

const mounts = document.querySelectorAll<HTMLElement>(".orb-mount");

if (mounts.length) {
  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  const orbs: Orb[] = [];

  mounts.forEach((mount) => {
    const kind = kindOf(mount);
    const state = asState(mount.dataset.orb);
    const { mode, speed: baseSpeed, opts } = resolvePreset(state, 64);
    const draw = MODE_DRAWS[mode];
    if (!draw) return;

    const size = displaySize(kind);
    const dpr = Math.min(
      2,
      (typeof devicePixelRatio !== "undefined" && devicePixelRatio) || 1
    );

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    mount.appendChild(canvas);

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    orbs.push({ mount, canvas, kind, draw, opts, baseSpeed, size, dpr });
  });

  const paintOne = (orb: Orb, tSec: number) => {
    const ctx = orb.canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(orb.dpr, 0, 0, orb.dpr, 0, 0);
    ctx.clearRect(0, 0, orb.size, orb.size);
    orb.draw(ctx, orb.size, tSec, inkDark(orb.mount), orb.opts);
  };

  const resizeAll = () => {
    const dpr = Math.min(
      2,
      (typeof devicePixelRatio !== "undefined" && devicePixelRatio) || 1
    );
    const t = (performance.now() / 1000) * (orbs[0]?.baseSpeed ?? 1);
    orbs.forEach((orb) => {
      orb.size = displaySize(orb.kind);
      orb.dpr = dpr;
      orb.canvas.width = Math.round(orb.size * dpr);
      orb.canvas.height = Math.round(orb.size * dpr);
      orb.canvas.style.width = `${orb.size}px`;
      orb.canvas.style.height = `${orb.size}px`;
      paintOne(orb, t);
    });
  };

  if (reduced) {
    orbs.forEach((orb) => paintOne(orb, 0.6));
  } else {
    const live = new Set<Orb>();
    let running = false;
    let raf = 0;

    const loop = () => {
      const now = performance.now() / 1000;
      for (const orb of live) paintOne(orb, now * orb.baseSpeed);
      if (running) raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const syncLive = () => {
      live.clear();
      if (document.visibilityState === "hidden") {
        stop();
        return;
      }
      orbs.forEach((orb) => {
        if (onstage(orb.mount)) live.add(orb);
      });
      if (live.size > 0) start();
      else stop();
    };

    syncLive();

    const deck = document.getElementById("deck");
    if (deck && typeof MutationObserver !== "undefined") {
      const io = new MutationObserver(syncLive);
      io.observe(deck, {
        attributes: true,
        attributeFilter: ["class"],
        subtree: true,
      });
    }

    if (typeof MutationObserver !== "undefined") {
      const themeIo = new MutationObserver(() => {
        const t = performance.now() / 1000;
        orbs.forEach((orb) => paintOne(orb, t * orb.baseSpeed));
      });
      themeIo.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }

    document.addEventListener("visibilitychange", syncLive);
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resizeAll, 150);
  });
}
