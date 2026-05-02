"use client";

import { useEffect, useState } from "react";

/**
 * Decorative live clock for the landing hero.
 * Counts up from page-load mount time so the digits visibly tick — the
 * page IS the product demo.
 */
export function LiveClock() {
  const [elapsed, setElapsed] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(id);
  }, []);

  const total = Math.floor(elapsed / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const display = mounted ? `${pad(h)}:${pad(m)}:${pad(s)}` : "00:00:00";

  return (
    <div
      aria-hidden="true"
      className="font-mono tabular-nums tracking-tight"
    >
      {display}
    </div>
  );
}
