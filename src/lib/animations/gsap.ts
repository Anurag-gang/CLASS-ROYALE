import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isScrollTriggerRegistered = false;

export function getGSAP() {
  if (typeof window !== "undefined" && !isScrollTriggerRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    isScrollTriggerRegistered = true;
  }
  return { gsap, ScrollTrigger };
}

export function isReducedMotionPreferred(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Split and reveal text word by word with subtle blur and upward displacement
 */
export function animateTextReveal(
  element: HTMLElement | null,
  options?: {
    delay?: number;
    stagger?: number;
    duration?: number;
    scrollTrigger?: boolean | ScrollTrigger.Vars;
  }
) {
  if (!element || isReducedMotionPreferred()) return;

  const { gsap, ScrollTrigger } = getGSAP();

  const words = element.innerText.split(/\s+/);
  element.innerHTML = words
    .map(
      (word) =>
        `<span class="inline-block overflow-hidden pb-1"><span class="reveal-word inline-block will-change-transform">${word}&nbsp;</span></span>`
    )
    .join("");

  const wordSpans = element.querySelectorAll(".reveal-word");

  const tl = gsap.timeline({
    delay: options?.delay ?? 0.2,
    scrollTrigger: options?.scrollTrigger
      ? typeof options.scrollTrigger === "boolean"
        ? {
            trigger: element,
            start: "top 85%",
            toggleActions: "play none none none",
          }
        : options.scrollTrigger
      : undefined,
  });

  tl.fromTo(
    wordSpans,
    {
      y: "115%",
      opacity: 0,
      filter: "blur(8px)",
    },
    {
      y: "0%",
      opacity: 1,
      filter: "blur(0px)",
      duration: options?.duration ?? 0.85,
      stagger: options?.stagger ?? 0.04,
      ease: "power3.out",
    }
  );

  return tl;
}

/**
 * Magnetic button hover effect
 */
export function applyMagneticEffect(element: HTMLElement | null, strength = 0.35) {
  if (!element || isReducedMotionPreferred()) return () => {};

  const { gsap } = getGSAP();

  const xTo = gsap.quickTo(element, "x", { duration: 0.3, ease: "power2.out" });
  const yTo = gsap.quickTo(element, "y", { duration: 0.3, ease: "power2.out" });

  const onMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    xTo(deltaX);
    yTo(deltaY);
  };

  const onMouseLeave = () => {
    xTo(0);
    yTo(0);
  };

  element.addEventListener("mousemove", onMouseMove);
  element.addEventListener("mouseleave", onMouseLeave);

  return () => {
    element.removeEventListener("mousemove", onMouseMove);
    element.removeEventListener("mouseleave", onMouseLeave);
  };
}

/**
 * 3D Card tilt on mouse hover
 */
export function applyCard3DTilt(element: HTMLElement | null, maxTilt = 10) {
  if (!element || isReducedMotionPreferred()) return () => {};

  const { gsap } = getGSAP();

  const rotXTo = gsap.quickTo(element, "rotateX", { duration: 0.4, ease: "power2.out" });
  const rotYTo = gsap.quickTo(element, "rotateY", { duration: 0.4, ease: "power2.out" });

  element.style.transformStyle = "preserve-3d";

  const onMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    rotXTo(-y * maxTilt);
    rotYTo(x * maxTilt);
  };

  const onMouseLeave = () => {
    rotXTo(0);
    rotYTo(0);
  };

  element.addEventListener("mousemove", onMouseMove);
  element.addEventListener("mouseleave", onMouseLeave);

  return () => {
    element.removeEventListener("mousemove", onMouseMove);
    element.removeEventListener("mouseleave", onMouseLeave);
  };
}

/**
 * Spotlight character reveal from center with blur to sharp
 */
export function animateSpotlightReveal(
  element: HTMLElement | null,
  options?: { duration?: number; stagger?: number }
) {
  if (!element || isReducedMotionPreferred()) return;
  const { gsap } = getGSAP();

  const text = element.innerText;
  element.innerHTML = text
    .split("")
    .map(
      (char) =>
        `<span class="spotlight-char inline-block will-change-transform">${
          char === " " ? "&nbsp;" : char
        }</span>`
    )
    .join("");

  const chars = element.querySelectorAll(".spotlight-char");
  return gsap.from(chars, {
    opacity: 0.1,
    scale: 0.8,
    filter: "blur(4px)",
    stagger: { each: options?.stagger ?? 0.06, from: "center" },
    duration: options?.duration ?? 0.8,
    ease: "power2.out",
  });
}

/**
 * ScrollTrigger scrubbed numerical counter
 */
export function animateCounter(
  element: HTMLElement | null,
  targetVal: number,
  options?: { trigger?: HTMLElement | string; prefix?: string; suffix?: string }
) {
  if (!element || isReducedMotionPreferred()) return;
  const { gsap, ScrollTrigger } = getGSAP();

  const obj = { val: 0 };
  return gsap.to(obj, {
    val: targetVal,
    ease: "none",
    scrollTrigger: {
      trigger: options?.trigger || element,
      start: "top 90%",
      end: "bottom 60%",
      scrub: true,
    },
    onUpdate: () => {
      const formatted = Math.round(obj.val).toLocaleString();
      element.textContent = `${options?.prefix ?? ""}${formatted}${options?.suffix ?? ""}`;
    },
  });
}

/**
 * Scroll-driven word-by-word light-up
 */
export function animateWordLightUp(
  element: HTMLElement | null,
  options?: { trigger?: HTMLElement | string }
) {
  if (!element || isReducedMotionPreferred()) return;
  const { gsap, ScrollTrigger } = getGSAP();

  const words = element.innerText.split(/\s+/);
  element.innerHTML = words
    .map(
      (word) =>
        `<span class="lightup-word inline-block will-change-transform" style="color: rgba(255, 255, 255, 0.18); transition: color 0.15s ease;">${word}&nbsp;</span>`
    )
    .join("");

  const wordEls = element.querySelectorAll(".lightup-word");
  return gsap.to(wordEls, {
    color: "#ffffff",
    stagger: 0.1,
    scrollTrigger: {
      trigger: options?.trigger || element,
      start: "top 75%",
      end: "bottom 45%",
      scrub: true,
    },
  });
}

