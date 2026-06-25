import { useEffect } from "react";
import { animate, stagger } from "animejs";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stop(animation) {
  if (!animation) return;
  if (typeof animation.cancel === "function") animation.cancel();
  else if (typeof animation.pause === "function") animation.pause();
}

export function useMotionEffects({ activeTab, analysisKey, pageId, rootRef, scanning, spinning }) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;

    const targets = root.querySelectorAll(
      ".app-header, .assistant-card, .face-card, .scan-state, .wheel-button, .fortune-card, .quick-grid button, .flow-step, .panel-card, .tab-hero, .tab-card, .ai-analysis, .phone-actions button",
    );
    if (!targets.length) return undefined;

    const entrance = animate(targets, {
      opacity: [0, 1],
      y: [12, 0],
      duration: 560,
      delay: stagger(36),
      ease: "outCubic",
    });

    return () => stop(entrance);
  }, [activeTab, pageId, rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;

    const onPointerDown = (event) => {
      animate(event.currentTarget, {
        scale: [1, 0.975, 1],
        duration: 240,
        ease: "outCubic",
      });
    };

    const buttons = root.querySelectorAll("button");
    buttons.forEach((button) => button.addEventListener("pointerdown", onPointerDown));
    return () => buttons.forEach((button) => button.removeEventListener("pointerdown", onPointerDown));
  }, [activeTab, pageId, rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || !analysisKey) return undefined;

    const targets = root.querySelectorAll(".ai-analysis, .network-analysis, .report-result-card");
    const reveal = animate(targets, {
      opacity: [0, 1],
      y: [14, 0],
      duration: 620,
      delay: stagger(48),
      ease: "outCubic",
    });
    return () => stop(reveal);
  }, [analysisKey, rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || !scanning) return undefined;

    const scanTargets = root.querySelectorAll(".beauty-scan-visual, .progress-row span");
    const scan = animate(scanTargets, {
      scale: [1, 1.012, 1],
      duration: 920,
      loop: true,
      alternate: true,
      ease: "inOutSine",
    });
    return () => stop(scan);
  }, [rootRef, scanning]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || !spinning) return undefined;

    const wheel = root.querySelector(".wheel-button");
    const pointer = root.querySelector(".wheel-result-pointer");
    const feedback = animate([wheel, pointer].filter(Boolean), {
      scale: [1, 1.018, 1],
      duration: 880,
      ease: "outCubic",
    });
    return () => stop(feedback);
  }, [rootRef, spinning]);
}
