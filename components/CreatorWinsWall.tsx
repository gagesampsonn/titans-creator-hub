import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export type CreatorWinItem = {
  src: string;
  alt?: string;
};

const GAP_PX = 8;
const OVERSCAN_ROWS = 4;
/** Portrait phone screenshots (GMV / TikTok wins) */
const ASPECT = 9 / 16;

function useColumnCount() {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640) setCols(2);
      else if (w < 1024) setCols(3);
      else setCols(4);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  return cols;
}

type LayoutTick = number;

export function CreatorWinsWall({ items }: { items: CreatorWinItem[] }) {
  const cols = useColumnCount();
  const shellRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState<LayoutTick>(0);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const onScroll = () => bump();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', bump);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', bump);
    };
  }, [bump]);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => bump());
    ro.observe(el);
    return () => ro.disconnect();
  }, [bump]);

  useLayoutEffect(() => {
    bump();
  }, [items.length, cols, bump]);

  const slice = useMemo(() => {
    if (items.length === 0) {
      return { startRow: 0, endRow: 0, paddingTop: 0, bottomPad: 0, visible: [] as CreatorWinItem[] };
    }

    const shell = shellRef.current;
    if (!shell) {
      return { startRow: 0, endRow: 0, paddingTop: 0, bottomPad: 0, visible: [] as CreatorWinItem[] };
    }

    const width = shell.clientWidth;
    const colW = (width - (cols - 1) * GAP_PX) / cols;
    const rowH = colW / ASPECT + GAP_PX;
    const totalRows = Math.ceil(items.length / cols);
    const totalHeight = totalRows * rowH;

    const rect = shell.getBoundingClientRect();
    const gridDocTop = rect.top + window.scrollY;
    const scrollTop = window.scrollY;
    const vh = window.innerHeight;

    const firstRow = Math.floor((scrollTop - gridDocTop) / rowH);
    const lastRow = Math.ceil((scrollTop + vh - gridDocTop) / rowH);

    const startRow = Math.max(0, firstRow - OVERSCAN_ROWS);
    const endRow = Math.min(totalRows, lastRow + OVERSCAN_ROWS);

    const startIdx = startRow * cols;
    const endIdx = Math.min(items.length, endRow * cols);
    const visible = items.slice(startIdx, endIdx);

    return {
      startRow,
      endRow,
      paddingTop: startRow * rowH,
      bottomPad: Math.max(0, totalHeight - endRow * rowH),
      visible,
    };
  }, [items, cols, tick]);

  if (items.length === 0) return null;

  return (
    <div ref={shellRef} className="w-full">
      <div style={{ height: slice.paddingTop }} aria-hidden className="pointer-events-none" />
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {slice.visible.map((item, i) => (
          <figure
            key={`${slice.startRow * cols + i}-${item.src}`}
            className="relative m-0 rounded-lg overflow-hidden border border-titan-border bg-titan-elevated"
            style={{
              aspectRatio: '9 / 16',
              contentVisibility: 'auto',
              containIntrinsicSize: 'auto 360px',
            }}
          >
            <img
              src={item.src}
              alt={item.alt ?? 'Titans creator win'}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </figure>
        ))}
      </div>
      <div style={{ height: slice.bottomPad }} aria-hidden className="pointer-events-none" />
    </div>
  );
}
