/**
 * Two-phase neumorphic transition callbacks for solid-transition-group's
 * <Transition> component.
 *
 * EXIT  (old view leaving):
 *   Phase 1 (0→PHASE_MS):   children opacity 1→0   [content fades, shadow stays]
 *   Phase 2 (PHASE_MS→2×):  box-shadow raised→none [boundary flattens]
 *
 * ENTER (new view arriving):
 *   Phase 1 (0→PHASE_MS):   box-shadow none→raised [boundary raises, no content]
 *   Phase 2 (PHASE_MS→2×):  children opacity 0→1   [content fades in]
 *
 * The box-shadow lives on the root element (the .neu-raised article).
 * The "content" is the element's direct children — opacity is set on them,
 * not on the root, so the shadow remains visible while content fades.
 */

export const PHASE_MS = 200;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function neuOnExit(el: Element, done: () => void): void {
  if (prefersReducedMotion()) { done(); return; }

  const htmlEl = el as HTMLElement;
  const children = [...el.children] as HTMLElement[];

  // Phase 1: fade content
  children.forEach((c) => {
    c.style.transition = `opacity ${PHASE_MS}ms ease-out`;
    c.style.opacity = '0';
  });

  // Phase 2: flatten shadow
  setTimeout(() => {
    htmlEl.style.transition = `box-shadow ${PHASE_MS}ms ease-out`;
    htmlEl.style.boxShadow = 'none';
    setTimeout(done, PHASE_MS);
  }, PHASE_MS);
}

export function neuOnEnter(el: Element, done: () => void): void {
  if (prefersReducedMotion()) { done(); return; }

  const htmlEl = el as HTMLElement;
  const children = [...el.children] as HTMLElement[];

  // Initial state: flat shadow, invisible content
  htmlEl.style.transition = `box-shadow ${PHASE_MS}ms ease-out`;
  htmlEl.style.boxShadow = 'none';
  children.forEach((c) => { c.style.opacity = '0'; });

  // Force reflow so the browser registers 'none' before the transition target
  void htmlEl.offsetHeight;

  // Phase 1: raise shadow (clear inline → .neu-raised CSS takes over)
  htmlEl.style.boxShadow = '';

  // Phase 2: fade in content
  setTimeout(() => {
    children.forEach((c) => {
      c.style.transition = `opacity ${PHASE_MS}ms ease-out`;
      c.style.opacity = '';
    });
    // Clean up inline transitions after the fade completes
    setTimeout(() => {
      htmlEl.style.transition = '';
      children.forEach((c) => { c.style.transition = ''; });
      done();
    }, PHASE_MS);
  }, PHASE_MS);
}
