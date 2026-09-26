import { seededRandom } from '../scene/objects';

// A sparse, deterministic foreground dust layer; 28 white / 10 violet / 2 warm.
// Canvas uses design coordinates and inherits the shared responsive stage transform.
export function createTheatreAtmosphere(canvas) {
  canvas.width = 1920; canvas.height = 1080;
  const context = canvas.getContext('2d');
  const random = seededRandom(15903);
  const colors = ['220,232,255', '149,103,232', '226,180,137'];
  const particles = Array.from({ length: 40 }, (_, index) => ({
    x: 230 + random() * 1460, y: 180 + random() * 760,
    radius: 0.6 + random() * 1.1, opacity: 0.08 + random() * 0.14,
    speed: 1 + random() * 2, color: colors[index < 28 ? 0 : index < 38 ? 1 : 2],
  }));
  function render(time = 0) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const particle of particles) {
      context.beginPath();
      context.arc(particle.x + Math.sin(time * 0.15 + particle.y) * 2, particle.y - time * particle.speed, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${particle.color},${particle.opacity})`;
      context.fill();
    }
  }
  render();
  return { render, reset: () => render(0) };
}
