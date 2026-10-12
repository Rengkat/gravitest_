export function getEventCoords(
  e: React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
  return {
    x: Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX)),
    y: Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY)),
  };
}
