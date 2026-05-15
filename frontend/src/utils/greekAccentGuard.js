/**
 * Global Greek-accent guard.
 *
 * Runs once on app mount and again whenever the DOM mutates. Walks any element
 * that resolves to `text-transform: uppercase` and strips Greek tonos marks from
 * its direct text children. This is a belt-and-braces safety net on top of
 * `<html lang="el">` (which already triggers the browser's Greek casing rule for
 * properly-tagged Greek text).
 *
 * Idempotent — touches only text nodes that still contain tonos marks.
 */
import { stripGreekAccents } from "./greekText";

const ACCENT_RE = /[άέήίόύώΆΈΉΊΌΎΏΐΰ]/;
let observer = null;
let scheduled = false;

const cleanTextNodes = (root) => {
  if (!root || !root.ownerDocument) return;
  // Find all elements whose computed text-transform is uppercase
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        try {
          const tt = window.getComputedStyle(node).textTransform;
          return tt === "uppercase" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        } catch {
          return NodeFilter.FILTER_SKIP;
        }
      },
    }
  );
  let el = walker.nextNode();
  while (el) {
    // Replace tonos marks in direct text children only (preserve elements)
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE && ACCENT_RE.test(child.nodeValue)) {
        child.nodeValue = stripGreekAccents(child.nodeValue);
      }
    }
    el = walker.nextNode();
  }
};

const scheduleScan = () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    if (document.body) cleanTextNodes(document.body);
  });
};

export const installGreekAccentGuard = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (observer) return; // already installed
  // Initial sweep after first paint
  scheduleScan();
  // React re-renders mutate the DOM — re-sweep whenever a subtree changes.
  observer = new MutationObserver(() => scheduleScan());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
};
