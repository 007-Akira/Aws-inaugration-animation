export function addRevealAnimation(timeline, reveal, timing) {
  timeline.to(reveal, { autoAlpha: 1, duration: timing.revealDuration, ease: 'power1.out' }, 'reveal');
}
