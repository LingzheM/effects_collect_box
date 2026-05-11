/* global React, ReactDOM, d3, topojson, COUNTRIES */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- helpers ----------
const fmtNum = (n) => n.toLocaleString("en-US");
const fmtArea = (n) => n.toLocaleString("en-US") + " km²";
const fmtPop = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
};
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

const ITEM_HEIGHT = 56;
const REVOLUTIONS = 7; // full passes through the country list
const SPIN_MS = 6000;

// ---------- map ----------
function WorldMap({ activeId }) {
  const ref = useRef(null);
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (cancelled) return;
        const fc = topojson.feature(topo, topo.objects.countries);
        setGeo(fc);
      })
      .catch((e) => console.error("map load failed", e));
    return () => { cancelled = true; };
  }, []);

  // graticule lines
  const graticule = useMemo(() => d3.geoGraticule().step([20, 20])(), []);

  const W = 1100, H = 720;
  const projection = useMemo(
    () => d3.geoNaturalEarth1().scale(210).translate([W / 2, H / 2 + 10]),
    []
  );
  const path = useMemo(() => d3.geoPath(projection), [projection]);

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="map-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="map-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1a2030" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0a0c10" stopOpacity="0" />
        </radialGradient>
        <filter id="active-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="url(#map-glow)" />

      {/* graticule */}
      <path d={path(graticule)} fill="none" stroke="#171b23" strokeWidth="0.6" />

      {/* sphere outline */}
      <path d={path({ type: "Sphere" })} fill="none" stroke="#1f2530" strokeWidth="1" />

      {/* countries */}
      {geo &&
        geo.features.map((f, i) => {
          const isActive = String(f.id).padStart(3, "0") === activeId;
          return (
            <path
              key={i}
              d={path(f)}
              fill={isActive ? "#ff2d55" : "#1a1e26"}
              stroke={isActive ? "#ff5c7a" : "#0a0c10"}
              strokeWidth={isActive ? 0.8 : 0.5}
              filter={isActive ? "url(#active-glow)" : undefined}
              style={{ transition: isActive ? "none" : "fill 120ms" }}
            />
          );
        })}

      {/* crosshair on active country centroid */}
      {geo && activeId && (() => {
        const f = geo.features.find((x) => String(x.id).padStart(3, "0") === activeId);
        if (!f) return null;
        const c = projection(d3.geoCentroid(f));
        if (!c || isNaN(c[0])) return null;
        return (
          <g className="map-crosshair">
            <circle cx={c[0]} cy={c[1]} r="22" fill="none" stroke="#ff2d55" strokeWidth="1" opacity="0.7" />
            <circle cx={c[0]} cy={c[1]} r="42" fill="none" stroke="#ff2d55" strokeWidth="0.6" opacity="0.4" />
            <line x1={c[0] - 60} y1={c[1]} x2={c[0] - 26} y2={c[1]} stroke="#ff2d55" strokeWidth="1" />
            <line x1={c[0] + 26} y1={c[1]} x2={c[0] + 60} y2={c[1]} stroke="#ff2d55" strokeWidth="1" />
            <line x1={c[0]} y1={c[1] - 60} x2={c[0]} y2={c[1] - 26} stroke="#ff2d55" strokeWidth="1" />
            <line x1={c[0]} y1={c[1] + 26} x2={c[0]} y2={c[1] + 60} stroke="#ff2d55" strokeWidth="1" />
          </g>
        );
      })()}
    </svg>
  );
}

// ---------- country list (the slot machine) ----------
function CountryReel({ visibleIndex, scrollY, isSpinning, spinSpeed }) {
  // Repeat country list to give the reel "infinite" feel.
  const REPEATS = REVOLUTIONS + 2;
  const items = [];
  for (let r = 0; r < REPEATS; r++) {
    for (let i = 0; i < COUNTRIES.length; i++) {
      items.push({ ...COUNTRIES[i], _key: `${r}-${i}`, _absIndex: r * COUNTRIES.length + i });
    }
  }

  // Motion blur intensity scales with current speed (px/frame).
  const blur = Math.min(8, spinSpeed / 10);

  return (
    <div className="reel-window">
      {/* center selector line */}
      <div className="reel-selector" aria-hidden="true">
        <span className="reel-selector-tag">▸</span>
        <span className="reel-selector-tag right">◂</span>
      </div>
      <div className="reel-edge top" />
      <div className="reel-edge bottom" />

      <div
        className="reel-track"
        style={{
          transform: `translateY(${-scrollY}px)`,
          filter: isSpinning && blur > 0.5 ? `blur(${blur}px)` : "none",
        }}
      >
        {items.map((c) => {
          const isActive = c._absIndex === visibleIndex;
          return (
            <div
              key={c._key}
              className={`reel-row ${isActive ? "active" : ""}`}
              style={{ height: ITEM_HEIGHT }}
            >
              <span className="reel-code">{c.code}</span>
              <span className="reel-name">{c.name}</span>
              <span className="reel-cont">{c.continent}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- detail panel ----------
function DetailPanel({ country, locked, spinCount }) {
  if (!country) return <div className="detail empty">— SELECT A TARGET —</div>;
  return (
    <div className={`detail ${locked ? "locked" : "live"}`}>
      <div className="detail-header">
        <div className="flag-wrap">
          <img
            src={`https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
            alt=""
            className="flag"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div className="flag-frame" />
        </div>
        <div className="detail-title">
          <div className="detail-code">
            <span className="dot" /> {country.code} · ISO {country.id}
          </div>
          <div className="detail-name">{country.name}</div>
          <div className="detail-cont">{country.continent.toUpperCase()}</div>
        </div>
        <div className="detail-status">
          {locked ? (
            <>
              <div className="status-pill locked-pill">LOCKED</div>
              <div className="status-sub">RUN #{String(spinCount).padStart(3, "0")}</div>
            </>
          ) : (
            <>
              <div className="status-pill scan-pill">SCANNING</div>
              <div className="status-sub blink">live feed</div>
            </>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <Stat label="CAPITAL" value={country.capital} mono />
        <Stat label="POPULATION" value={fmtPop(country.pop)} sub={fmtNum(country.pop)} />
        <Stat label="AREA" value={fmtArea(country.area)} />
        <Stat label="DENSITY" value={`${(country.pop / country.area).toFixed(1)} /km²`} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, mono }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${mono ? "mono" : ""}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ---------- main app ----------
function App() {
  const [scrollY, setScrollY] = useState(0);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [locked, setLocked] = useState(true);
  const [spinCount, setSpinCount] = useState(0);
  const [history, setHistory] = useState([]);

  // Initial: pinpoint a default country (e.g., US) under the selector
  useEffect(() => {
    const initialIdx = 0; // United States
    setScrollY(initialIdx * ITEM_HEIGHT);
    setVisibleIndex(initialIdx);
  }, []);

  const visibleCountry = COUNTRIES[((visibleIndex % COUNTRIES.length) + COUNTRIES.length) % COUNTRIES.length];

  const spin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setLocked(false);

    const startScrollY = scrollY;
    // pick a random target country (avoid landing on same)
    let targetIdx = Math.floor(Math.random() * COUNTRIES.length);
    const currentIdx = ((visibleIndex % COUNTRIES.length) + COUNTRIES.length) % COUNTRIES.length;
    if (targetIdx === currentIdx) targetIdx = (targetIdx + 7) % COUNTRIES.length;

    // total absolute item index we want to land on
    const finalAbsIndex =
      Math.floor(startScrollY / ITEM_HEIGHT) +
      REVOLUTIONS * COUNTRIES.length +
      ((targetIdx - currentIdx + COUNTRIES.length) % COUNTRIES.length);

    const finalScrollY = finalAbsIndex * ITEM_HEIGHT;
    const totalDist = finalScrollY - startScrollY;

    const t0 = performance.now();
    let lastY = startScrollY;
    let lastT = t0;

    const tick = (now) => {
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / SPIN_MS);
      const eased = easeOutQuart(t);
      const y = startScrollY + totalDist * eased;

      // speed in px / 16ms for blur
      const dt = Math.max(1, now - lastT);
      const speed = ((y - lastY) / dt) * 16;
      lastY = y;
      lastT = now;

      setScrollY(y);
      setSpinSpeed(speed);
      const idxNow = Math.round(y / ITEM_HEIGHT);
      setVisibleIndex(idxNow);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setScrollY(finalScrollY);
        setVisibleIndex(finalAbsIndex);
        setSpinSpeed(0);
        setIsSpinning(false);
        setLocked(true);
        setSpinCount((c) => c + 1);
        setHistory((h) => [COUNTRIES[targetIdx], ...h].slice(0, 5));
      }
    };
    requestAnimationFrame(tick);
  }, [isSpinning, scrollY, visibleIndex]);

  // Allow Space to spin
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") { e.preventDefault(); spin(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spin]);

  return (
    <div className="app">
      {/* HUD overlay frame */}
      <div className="hud-corners">
        <span className="c tl" /><span className="c tr" /><span className="c bl" /><span className="c br" />
      </div>

      <header className="topbar">
        <button
          className={`spin-btn ${isSpinning ? "spinning" : ""}`}
          onClick={spin}
          disabled={isSpinning}
        >
          <span className="spin-glyph">◉</span>
          <span className="spin-label">{isSpinning ? "SPINNING" : "SPIN"}</span>
          <span className="spin-hint">[ space ]</span>
        </button>

        <div className="title-block">
          <div className="title-eyebrow">SYSTEM A · RANDOM-RETRIEVAL</div>
          <div className="title-main">MAP&nbsp;ROULETTE</div>
        </div>

        <div className="meta">
          <div className="meta-row"><span className="k">RUNS</span><span className="v">{String(spinCount).padStart(3, "0")}</span></div>
          <div className="meta-row"><span className="k">POOL</span><span className="v">{COUNTRIES.length} ⌁</span></div>
          <div className="meta-row"><span className="k">SEED</span><span className="v">0x{(Date.now() % 0xffff).toString(16).toUpperCase().padStart(4, "0")}</span></div>
        </div>
      </header>

      <main className="grid">
        <section className="left">
          <div className="panel reel-panel">
            <div className="panel-head">
              <span className="panel-tag">01 · INDEX</span>
              <span className="panel-sub">{isSpinning ? "// SCANNING POOL" : "// AT REST"}</span>
            </div>
            <CountryReel
              visibleIndex={visibleIndex}
              scrollY={scrollY}
              isSpinning={isSpinning}
              spinSpeed={spinSpeed}
            />
            <div className="panel-foot">
              <div className="ticker">
                <span className="ticker-dot" />
                <span className="ticker-text">
                  IDX&nbsp;{String(((visibleIndex % COUNTRIES.length) + COUNTRIES.length) % COUNTRIES.length).padStart(2, "0")}
                  &nbsp;/&nbsp;{String(COUNTRIES.length - 1).padStart(2, "0")}
                </span>
              </div>
              <div className="ticker-right">
                Δ {Math.abs(spinSpeed).toFixed(0)} px/f
              </div>
            </div>
          </div>

          <div className="panel detail-panel">
            <div className="panel-head">
              <span className="panel-tag">03 · DOSSIER</span>
              <span className="panel-sub">{locked ? "// FOCUS LOCKED" : "// STREAMING"}</span>
            </div>
            <DetailPanel country={visibleCountry} locked={locked} spinCount={spinCount} />
          </div>
        </section>

        <section className="right">
          <div className="panel map-panel">
            <div className="panel-head">
              <span className="panel-tag">02 · ATLAS</span>
              <span className="panel-sub">// NATURAL EARTH · 1:110M</span>
              <span className="coords mono">
                {visibleCountry?.id ? `ISO_NUM ${visibleCountry.id}` : ""}
              </span>
            </div>
            <div className="map-wrap">
              <WorldMap activeId={visibleCountry?.id} />
              <div className="scanline" />
            </div>
            <div className="panel-foot">
              <div className="legend">
                <span className="sw active" /> active
                <span className="sw inactive" /> dormant
              </div>
              <div className="history">
                <span className="hist-label">RECENT</span>
                {history.length === 0 ? (
                  <span className="hist-empty">—</span>
                ) : (
                  history.map((h, i) => (
                    <span key={i} className="hist-chip">{h.code}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
