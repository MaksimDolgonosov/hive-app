type Point = {
  x: number;
  y: number;
};

function hexagonVertices(cx: number, cy: number, radius: number): Point[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 3;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}

export function getRoundedHexagonPath(size: number, cornerRadius: number, inset = 0): string {
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(size / 2 - inset, 1);
  const vertices = hexagonVertices(cx, cy, radius);
  const maxCorner = radius * Math.sin(Math.PI / 6);
  const rounding = Math.min(cornerRadius, maxCorner * 0.9);

  const commands = vertices.map((curr, index) => {
    const prev = vertices[(index + vertices.length - 1) % vertices.length];
    const next = vertices[(index + 1) % vertices.length];
    const toPrevX = prev.x - curr.x;
    const toPrevY = prev.y - curr.y;
    const toNextX = next.x - curr.x;
    const toNextY = next.y - curr.y;
    const lenPrev = Math.hypot(toPrevX, toPrevY);
    const lenNext = Math.hypot(toNextX, toNextY);
    const start = {
      x: curr.x + (toPrevX / lenPrev) * rounding,
      y: curr.y + (toPrevY / lenPrev) * rounding,
    };
    const end = {
      x: curr.x + (toNextX / lenNext) * rounding,
      y: curr.y + (toNextY / lenNext) * rounding,
    };

    const prefix = index === 0 ? `M ${start.x} ${start.y}` : `L ${start.x} ${start.y}`;
    return `${prefix} Q ${curr.x} ${curr.y} ${end.x} ${end.y}`;
  });

  return `${commands.join(' ')} Z`;
}
