export function bandCardGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hues = [340, 18, 42, 205, 265, 318, 155];
  const hue = hues[Math.abs(hash) % hues.length];
  return `linear-gradient(135deg, hsl(${hue} 68% 42%), hsl(${(hue + 36) % 360} 58% 28%))`;
}
