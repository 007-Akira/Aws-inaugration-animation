// Approved Act I timings, in seconds from the inauguration click.
export const timing = Object.freeze({
  interactionFadeDuration: 0.45,
  lightPeak: 0.15,
  resistanceStart: 0.30,
  mainTravelStart: 0.40,
  mainTravelEnd: 2.40,
  settleRebound: 3.10,
  curtainOpenDuration: 3.60,
  seamFadeStart: 0.45,
  seamFadeDuration: 0.65,
  spillFadeStart: 0.70,
  spillFadeDuration: 1.20,
});
export const curtainPhysics = Object.freeze({
  pleatsPerSide: 18,
  gatheredWidth: 0.23, // Fraction of each closed half retained at the side.
  resistanceTravel: 0.008,
  overshoot: 0.006, // Fraction of closed half width; ~4px at 1080p.
  rebound: 0.002,
  foldLag: 0.065, // Seconds: inner hem pulls first, outer folds follow.
  edgeSkew: 0.18, // Degrees, restrained deformation of the leading pleat.
  foldShadow: 0.35,
  foldHighlight: 0.16,
  travelEase: 'M0,0 C0.22,0.02 0.24,0.65 0.48,0.88 C0.65,0.98 0.82,1 1,1',
  impactVolume: 0.18,
  impactDuration: 2.2,
});
