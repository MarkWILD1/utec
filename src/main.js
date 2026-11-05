import gsap from "../node_modules/gsap/index.js";

void import("./orbs.ts").catch(() => {});

const slides = Array.from(document.querySelectorAll(".slide"));
const deck = document.getElementById("deck");
const rail = document.getElementById("rail");
const slideNum = document.getElementById("slide-num");
const hint = document.getElementById("hint");

let current = 0;
let busy = false;
let touchStartY = 0;
let touchStartX = 0;

slides.forEach((slide, i) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "rail__dot";
  btn.setAttribute("aria-label", `Diapositiva ${i + 1}`);
  if (slide.classList.contains("slide--peak")) btn.classList.add("is-peak");
  if (i === 0) btn.classList.add("is-active");
  btn.addEventListener("click", () => goTo(i));
  rail.appendChild(btn);
});

const dots = Array.from(rail.querySelectorAll(".rail__dot"));

function setTheme(index) {
  const theme = slides[index].dataset.theme || "light";
  document.body.dataset.theme = theme;
}

function markAnimTargets(slide) {
  const selectors = [
    ".eyebrow",
    ".display",
    ".headline",
    ".lead",
    ".hero-meta",
    ".punch",
    ".zero-error",
    ".quote",
    ".manifesto",
    ".note",
    ".logo-reveal",
    ".hero-logo",
    ".strip li",
    ".list li",
    ".grid-4 li",
    ".grid-5 li",
    ".lessons li",
    ".arch__col",
    ".duo > div",
    ".flow__step",
    ".flow__arrow",
    ".codeblock",
  ];

  selectors.forEach((sel) => {
    slide.querySelectorAll(sel).forEach((el) => {
      el.classList.add("anim");
    });
  });
}

slides.forEach(markAnimTargets);

function getTargets(slide) {
  return slide.querySelectorAll(".anim");
}

function enterSlide(slide, direction) {
  const targets = getTargets(slide);
  const isPeak = slide.classList.contains("slide--peak");
  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
  });

  gsap.set(slide, { autoAlpha: 1, zIndex: 2 });

  const isBirth = slide.dataset.theme === "birth";
  const logo = slide.querySelector(".logo-reveal");

  if (isPeak) {
    const bg = slide.querySelector(".slide__bg");
    gsap.set(targets, { autoAlpha: 0, y: 48 });
    if (bg) {
      gsap.fromTo(
        bg,
        { scale: 1.08, autoAlpha: 0.6 },
        { scale: 1, autoAlpha: 1, duration: 1.4, ease: "power2.out" }
      );
    }
    tl.to(targets, {
      autoAlpha: 1,
      y: 0,
      duration: 0.95,
      stagger: 0.14,
      ease: "power4.out",
    });
  } else if (isBirth && logo) {
    const copyTargets = Array.from(targets).filter((el) => el !== logo);
    const yFrom = direction >= 0 ? 48 : -48;
    gsap.set(logo, { autoAlpha: 0, scale: 0.86, y: 24 });
    gsap.set(copyTargets, { autoAlpha: 0, y: yFrom });
    tl.to(
      logo,
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 1.05,
        ease: "power4.out",
      },
      0
    ).to(
      copyTargets,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        stagger: 0.06,
      },
      0.22
    );
  } else {
    const yFrom = direction >= 0 ? 56 : -56;
    gsap.set(targets, { autoAlpha: 0, y: yFrom });
    tl.to(targets, {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.055,
    });
  }

  return tl;
}

function exitSlide(slide, direction) {
  const targets = getTargets(slide);
  const yTo = direction >= 0 ? -36 : 36;
  const tl = gsap.timeline({
    defaults: { ease: "power2.in" },
    onComplete: () => {
      gsap.set(slide, { autoAlpha: 0, zIndex: 1 });
      slide.classList.remove("is-active");
    },
  });

  tl.to(targets, {
    autoAlpha: 0,
    y: yTo,
    duration: 0.35,
    stagger: 0.02,
  });

  return tl;
}

function goTo(index) {
  if (busy || index === current || index < 0 || index >= slides.length) return;

  busy = true;
  const prev = current;
  const direction = index > prev ? 1 : -1;
  current = index;

  const outgoing = slides[prev];
  const incoming = slides[current];

  incoming.classList.add("is-active");
  setTheme(current);
  slideNum.textContent = String(current + 1).padStart(2, "0");

  dots.forEach((d, i) => d.classList.toggle("is-active", i === current));

  if (current > 0) hint.classList.add("is-hidden");

  const master = gsap.timeline({
    onComplete: () => {
      busy = false;
    },
  });

  master.add(exitSlide(outgoing, direction), 0);
  master.add(enterSlide(incoming, direction), 0.15);
}

function next() {
  goTo(current + 1);
}

function prev() {
  goTo(current - 1);
}

window.addEventListener("keydown", (e) => {
  if (
    e.key === "ArrowRight" ||
    e.key === "ArrowDown" ||
    e.key === " " ||
    e.key === "PageDown"
  ) {
    e.preventDefault();
    next();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault();
    prev();
  } else if (e.key === "Home") {
    e.preventDefault();
    goTo(0);
  } else if (e.key === "End") {
    e.preventDefault();
    goTo(slides.length - 1);
  }
});

let wheelLock = false;
window.addEventListener(
  "wheel",
  (e) => {
    if (wheelLock || busy) return;
    if (Math.abs(e.deltaY) < 18) return;
    wheelLock = true;
    if (e.deltaY > 0) next();
    else prev();
    window.setTimeout(() => {
      wheelLock = false;
    }, 700);
  },
  { passive: true }
);

deck.addEventListener(
  "touchstart",
  (e) => {
    touchStartY = e.changedTouches[0].clientY;
    touchStartX = e.changedTouches[0].clientX;
  },
  { passive: true }
);

deck.addEventListener(
  "touchend",
  (e) => {
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dy) < 40 && Math.abs(dx) < 40) return;
    if (Math.abs(dy) >= Math.abs(dx)) {
      if (dy < 0) next();
      else prev();
    } else {
      if (dx < 0) next();
      else prev();
    }
  },
  { passive: true }
);

deck.addEventListener("click", (e) => {
  const target = e.target instanceof Element ? e.target : null;
  if (!target || target.closest(".rail") || target.closest("a, button")) return;
  const x = e.clientX;
  const w = window.innerWidth;
  if (x > w * 0.72) next();
  else if (x < w * 0.28) prev();
});

setTheme(0);
gsap.set(slides, { autoAlpha: 0 });
gsap.set(slides[0], { autoAlpha: 1, zIndex: 2 });
enterSlide(slides[0], 1);
deck.focus();
