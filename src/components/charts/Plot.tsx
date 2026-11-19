import React from 'react';
import { useWidth } from './useWidth';
import { usePalette, type Palette } from './palette';

export interface Axis {
  domain: [number, number];
  label?: string;
  ticks?: number[];
  format?: (v: number) => string;
  log?: boolean;
}

export interface Scales {
  x: (v: number) => number;
  y: (v: number) => number;
  w: number;
  h: number;
  pal: Palette;
  /** invert pixel → data (x only) */
  ix: (px: number) => number;
}

function niceTicks([a, b]: [number, number], n = 5) {
  const span = b - a;
  if (span <= 0) return [a];
  const step0 = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const err = step0 / mag;
  const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(a / step) * step; v <= b + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

const defaultFmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(0) : +v.toFixed(2) + '');

export function Plot({
  x,
  y,
  height = 280,
  aspect,
  children,
  title,
  onPointer,
  square,
}: {
  x: Axis;
  y: Axis;
  height?: number;
  aspect?: number;
  square?: boolean;
  title: string;
  children: (s: Scales) => React.ReactNode;
  onPointer?: (dataX: number, dataY: number) => void;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const pal = usePalette();
  const m = { t: 10, r: 14, b: x.label ? 42 : 26, l: y.label ? 52 : 40 };
  let h = aspect ? width / aspect : height;
  if (square) h = Math.min(width - m.l - m.r, 380) + m.t + m.b;
  const w = square ? h - m.t - m.b + m.l + m.r : width;
  const iw = Math.max(10, w - m.l - m.r);
  const ih = Math.max(10, h - m.t - m.b);
  const tx = (v: number) => (x.log ? Math.log10(v) : v);
  const ty = (v: number) => (y.log ? Math.log10(v) : v);
  const [x0, x1] = [tx(x.domain[0]), tx(x.domain[1])];
  const [y0, y1] = [ty(y.domain[0]), ty(y.domain[1])];
  const sx = (v: number) => m.l + ((tx(v) - x0) / (x1 - x0)) * iw;
  const sy = (v: number) => m.t + ih - ((ty(v) - y0) / (y1 - y0)) * ih;
  const ix = (px: number) => {
    const t = x0 + ((px - m.l) / iw) * (x1 - x0);
    return x.log ? 10 ** t : t;
  };
  const xt = x.ticks ?? niceTicks(x.domain, Math.max(3, Math.min(8, Math.round(iw / 80))));
  const yt = y.ticks ?? niceTicks(y.domain, Math.max(3, Math.min(7, Math.round(ih / 50))));
  const fx = x.format ?? defaultFmt;
  const fy = y.format ?? defaultFmt;
  const handle = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!onPointer) return;
    const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const dx = ix(px);
    const dy = y0 + ((m.t + ih - py) / ih) * (y1 - y0);
    onPointer(Math.min(x.domain[1], Math.max(x.domain[0], dx)), dy);
  };
  return (
    <div ref={ref} className="w-full">
      <svg
        role="img"
        aria-label={title}
        width={w}
        height={h}
        className="mx-auto block touch-none select-none overflow-visible"
        onPointerDown={handle}
        onPointerMove={(e) => e.buttons && handle(e)}
      >
        <title>{title}</title>
        <g fontSize={11} fill={pal.muted}>
          {yt.map((v) => (
            <g key={'y' + v}>
              <line x1={m.l} x2={m.l + iw} y1={sy(v)} y2={sy(v)} stroke={pal.grid} />
              <text x={m.l - 6} y={sy(v)} dy="0.32em" textAnchor="end">
                {fy(v)}
              </text>
            </g>
          ))}
          {xt.map((v) => (
            <g key={'x' + v}>
              <line x1={sx(v)} x2={sx(v)} y1={m.t} y2={m.t + ih} stroke={pal.grid} />
              <text x={sx(v)} y={m.t + ih + 16} textAnchor="middle">
                {fx(v)}
              </text>
            </g>
          ))}
          {x.label && (
            <text x={m.l + iw / 2} y={h - 6} textAnchor="middle" fill={pal.fg} fontSize={12} fontWeight={500}>
              {x.label}
            </text>
          )}
          {y.label && (
            <text transform={`translate(13 ${m.t + ih / 2}) rotate(-90)`} textAnchor="middle" fill={pal.fg} fontSize={12} fontWeight={500}>
              {y.label}
            </text>
          )}
        </g>
        <rect x={m.l} y={m.t} width={iw} height={ih} fill="none" stroke={pal.grid} />
        <svg x={0} y={0} width={w} height={h} overflow="visible">
          <defs>
            <clipPath id={`clip-${iw}-${ih}`}>
              <rect x={m.l} y={m.t - 2} width={iw} height={ih + 4} />
            </clipPath>
          </defs>
          <g clipPath={`url(#clip-${iw}-${ih})`}>{children({ x: sx, y: sy, w: iw, h: ih, pal, ix })}</g>
        </svg>
      </svg>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dash?: boolean }[] }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <svg width="18" height="8" aria-hidden>
            <line x1="0" x2="18" y1="4" y2="4" stroke={i.color} strokeWidth="2.5" strokeDasharray={i.dash ? '4 3' : undefined} />
          </svg>
          {i.label}
        </span>
      ))}
    </div>
  );
}
