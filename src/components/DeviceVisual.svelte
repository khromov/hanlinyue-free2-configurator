<script lang="ts" module>
  import type { DeviceId } from '../lib/devices';

  export type Glow = string | 'rainbow' | 'lucky' | null;

  interface KeyShape {
    n: number;
    x: number;
    y: number;
    w: number;
    h: number;
    r: number;
    /** Optional glyph drawn on the cap (presenter-style remotes). */
    glyph?: 'prev' | 'next' | 'back' | 'dot';
  }

  interface Geometry {
    w: number;
    h: number;
    body: { x: number; y: number; w: number; h: number; r: number };
    keys: KeyShape[];
    loop?: { cx: number; cy: number };
    led?: { cx: number; cy: number };
    side?: { x: number; y: number; h: number }[];
    /** Rendered width in px at full size. */
    px: number;
  }

  const GEOMETRY: Record<DeviceId, Geometry> = {
    Free2: {
      w: 160,
      h: 262,
      px: 150,
      body: { x: 10, y: 10, w: 140, h: 222, r: 34 },
      keys: [
        { n: 1, x: 28, y: 28, w: 104, h: 90, r: 18 },
        { n: 2, x: 28, y: 124, w: 104, h: 90, r: 18 },
      ],
      loop: { cx: 80, cy: 244 },
    },
    Free2_2026: {
      w: 160,
      h: 262,
      px: 150,
      body: { x: 10, y: 10, w: 140, h: 222, r: 34 },
      keys: [
        { n: 1, x: 28, y: 28, w: 104, h: 90, r: 18 },
        { n: 2, x: 28, y: 124, w: 104, h: 90, r: 18 },
      ],
      loop: { cx: 80, cy: 244 },
    },
    Free3: {
      w: 124,
      h: 330,
      px: 112,
      body: { x: 8, y: 8, w: 108, h: 296, r: 28 },
      keys: [
        { n: 1, x: 20, y: 24, w: 84, h: 84, r: 16 },
        { n: 2, x: 20, y: 114, w: 84, h: 84, r: 16 },
        { n: 3, x: 20, y: 204, w: 84, h: 84, r: 16 },
      ],
      loop: { cx: 62, cy: 316 },
    },
    E1Pro: {
      w: 96,
      h: 340,
      px: 84,
      body: { x: 12, y: 4, w: 72, h: 332, r: 36 },
      led: { cx: 48, cy: 22 },
      keys: [
        { n: 1, x: 25, y: 38, w: 46, h: 46, r: 14, glyph: 'prev' },
        { n: 2, x: 25, y: 94, w: 46, h: 46, r: 14, glyph: 'next' },
        { n: 3, x: 26, y: 166, w: 44, h: 44, r: 22, glyph: 'dot' },
      ],
      side: [
        { x: 84, y: 110, h: 30 },
        { x: 84, y: 146, h: 30 },
      ],
    },
    E3Control: {
      w: 96,
      h: 340,
      px: 84,
      body: { x: 12, y: 4, w: 72, h: 332, r: 36 },
      led: { cx: 48, cy: 22 },
      keys: [
        { n: 1, x: 26, y: 40, w: 44, h: 44, r: 14, glyph: 'prev' },
        { n: 2, x: 22, y: 94, w: 52, h: 52, r: 16, glyph: 'next' },
        { n: 3, x: 26, y: 156, w: 44, h: 44, r: 14, glyph: 'back' },
      ],
    },
  };
</script>

<script lang="ts">
  import type { ButtonSlot } from '../lib/devices';

  interface Props {
    deviceId: DeviceId;
    /** Text shown next to each button, keyed by button number. */
    labels?: Partial<Record<number, string>>;
    placeholder?: string;
    selected?: number | null;
    onselect?: (n: number) => void;
    glows?: Partial<Record<number, Glow>>;
    /** Extra mapping notes (side keys etc.) shown under the device. */
    extras?: { slot: ButtonSlot; text: string }[];
    dim?: boolean;
    /** Brief highlight after a successful save. */
    flash?: boolean;
    ariaLabelFor?: (n: number) => string;
  }

  let {
    deviceId,
    labels = {},
    placeholder = '',
    selected = null,
    onselect,
    glows = {},
    extras = [],
    dim = false,
    flash = false,
    ariaLabelFor = (n) => `Button ${n}`,
  }: Props = $props();

  const g = $derived(GEOMETRY[deviceId]);
  const uid = $props.id();
  const showLabels = $derived(Object.keys(labels).length > 0 || placeholder !== '');

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  function glowFill(glow: Glow): string {
    if (glow === 'rainbow' || glow === 'lucky') return '#ff3b3b';
    return glow ?? 'transparent';
  }
</script>

<div class="device" class:dim class:flash style:--device-w="{g.px}px">
  <div class="figure">
    <div class="art" style:aspect-ratio="{g.w} / {g.h}">
      <svg viewBox="0 0 {g.w} {g.h}" aria-hidden="true">
        <defs>
          <linearGradient id="{uid}-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#3a3a42" />
            <stop offset="1" stop-color="#1e1e23" />
          </linearGradient>
          <linearGradient id="{uid}-cap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#5c5c66" />
            <stop offset="1" stop-color="#42424a" />
          </linearGradient>
          <radialGradient id="{uid}-face" cx="0.5" cy="0.35" r="0.75">
            <stop offset="0" stop-color="#686872" />
            <stop offset="1" stop-color="#4c4c55" />
          </radialGradient>
          <filter id="{uid}-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="{uid}-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <!-- ground shadow -->
        <ellipse
          cx={g.w / 2}
          cy={g.body.y + g.body.h - 2}
          rx={g.body.w * 0.48}
          ry="8"
          fill="rgba(0,0,0,0.35)"
          filter="url(#{uid}-shadow)"
        />

        {#if g.loop}
          <circle cx={g.loop.cx} cy={g.loop.cy} r="11" fill="none" stroke="#2a2a30" stroke-width="7" />
        {/if}

        {#if g.side}
          {#each g.side as s, i (i)}
            <rect x={s.x - 2} y={s.y} width="6" height={s.h} rx="3" fill="#3a3a42" />
          {/each}
        {/if}

        <rect
          x={g.body.x}
          y={g.body.y}
          width={g.body.w}
          height={g.body.h}
          rx={g.body.r}
          fill="url(#{uid}-body)"
        />
        <rect
          x={g.body.x + 0.5}
          y={g.body.y + 0.5}
          width={g.body.w - 1}
          height={g.body.h - 1}
          rx={g.body.r - 0.5}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
        />

        {#if g.led}
          <rect x={g.led.cx - 2} y={g.led.cy - 6} width="4" height="12" rx="2" class="led" />
        {/if}

        {#each g.keys as key (key.n)}
          {@const glow = glows[key.n] ?? null}
          {#if glow}
            <rect
              x={key.x - 6}
              y={key.y - 6}
              width={key.w + 12}
              height={key.h + 12}
              rx={key.r + 6}
              fill={glowFill(glow)}
              filter="url(#{uid}-blur)"
              class="glow"
              class:rainbow={glow === 'rainbow'}
              class:lucky={glow === 'lucky'}
            />
          {/if}
          <g class="cap" class:selected={selected === key.n}>
            <rect x={key.x} y={key.y} width={key.w} height={key.h} rx={key.r} fill="url(#{uid}-cap)" />
            <rect
              x={key.x + key.w * 0.09}
              y={key.y + key.h * 0.07}
              width={key.w * 0.82}
              height={key.h * 0.76}
              rx={Math.max(key.r - 4, 6)}
              fill="url(#{uid}-face)"
              class="face"
            />
            <rect
              x={key.x + 0.5}
              y={key.y + 0.5}
              width={key.w - 1}
              height={key.h - 1}
              rx={key.r}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
            />
            {#if key.glyph === 'prev' || key.glyph === 'next'}
              {@const cx = key.x + key.w / 2}
              {@const cy = key.y + key.h * 0.45}
              {@const d = key.glyph === 'prev' ? 1 : -1}
              <path
                d="M {cx + 5 * d} {cy - 9} L {cx - 5 * d} {cy} L {cx + 5 * d} {cy + 9}"
                fill="none"
                stroke="#9a9aa3"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            {:else if key.glyph === 'back'}
              {@const cx = key.x + key.w / 2}
              {@const cy = key.y + key.h * 0.45}
              <path
                d="M {cx - 8} {cy - 2} L {cx - 2} {cy - 8} M {cx - 8} {cy - 2} L {cx - 2} {cy + 4} M {cx - 8} {cy - 2} H {cx + 3} Q {cx + 9} {cy - 2} {cx + 9} {cy + 6}"
                fill="none"
                stroke="#9a9aa3"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            {:else if key.glyph === 'dot'}
              <circle cx={key.x + key.w / 2} cy={key.y + key.h * 0.45} r="3" fill="none" stroke="#9a9aa3" stroke-width="1.6" />
            {/if}
          </g>
        {/each}
      </svg>

      {#each g.keys as key (key.n)}
        {#if onselect}
          <button
            type="button"
            class="hotspot"
            class:selected={selected === key.n}
            style:left={pct(key.x, g.w)}
            style:top={pct(key.y, g.h)}
            style:width={pct(key.w, g.w)}
            style:height={pct(key.h, g.h)}
            style:border-radius="{(key.r / key.w) * 100}% / {(key.r / key.h) * 100}%"
            aria-label={ariaLabelFor(key.n)}
            aria-pressed={selected === key.n}
            onclick={() => onselect?.(key.n)}
          ></button>
        {/if}
      {/each}
    </div>

    {#if showLabels}
      <div class="labels">
        {#each g.keys as key (key.n)}
          {@const text = labels[key.n]}
          <svelte:element
            this={onselect ? 'button' : 'div'}
            type={onselect ? 'button' : undefined}
            class="pill"
            class:empty={!text}
            class:selected={selected === key.n}
            class:interactive={!!onselect}
            style:top={pct(key.y + key.h / 2, g.h)}
            onclick={onselect ? () => onselect?.(key.n) : undefined}
            role={onselect ? undefined : 'note'}
          >
            <span class="num mono">{key.n}</span>
            {#key text}
              <span class="text">{text || placeholder}</span>
            {/key}
          </svelte:element>
        {/each}
      </div>
    {/if}
  </div>

  {#if extras.length}
    <ul class="extras">
      {#each extras as extra (extra.slot)}
        <li>{extra.text}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .device {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
  }

  .figure {
    display: flex;
    align-items: stretch;
    gap: 28px;
    max-width: 100%;
  }

  .art {
    position: relative;
    width: var(--device-w);
    flex: none;
    transition: opacity 200ms var(--ease);
  }

  .dim .art {
    opacity: 0.35;
    filter: saturate(0.4);
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .cap {
    transition: transform 150ms var(--ease);
  }

  .cap .face {
    transition: filter 150ms var(--ease);
  }

  .cap.selected rect:first-child {
    stroke: var(--accent);
    stroke-width: 3;
    filter: drop-shadow(0 0 6px var(--accent-ring));
  }

  .led {
    fill: #3fcf7f;
    filter: drop-shadow(0 0 3px #3fcf7f);
  }

  .glow {
    opacity: 0.85;
  }

  .glow.rainbow {
    animation: spectrum 4s linear infinite;
  }

  .glow.lucky {
    animation:
      spectrum 9s steps(6) infinite,
      pulse 1.5s ease-in-out infinite alternate;
  }

  @keyframes spectrum {
    0%,
    100% {
      fill: #ff3b3b;
    }
    16% {
      fill: #ffa53b;
    }
    33% {
      fill: #f2e83b;
    }
    50% {
      fill: #3bdc6a;
    }
    66% {
      fill: #3bb4ff;
    }
    83% {
      fill: #9b5bff;
    }
  }

  @keyframes pulse {
    from {
      opacity: 0.45;
    }
    to {
      opacity: 0.9;
    }
  }

  .hotspot {
    position: absolute;
    padding: 0;
    border: 0;
    background: transparent;
    transition: background 150ms var(--ease);
  }

  .hotspot:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .hotspot:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }

  .labels {
    position: relative;
    width: 200px;
    flex: 0 1 200px;
    min-width: 120px;
  }

  .pill {
    position: absolute;
    left: 0;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
    padding: 6px 12px 6px 6px;
    border-radius: var(--r-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: var(--shadow-elevated);
    font-size: 13px;
    line-height: 1.35;
    text-align: left;
    color: var(--text);
    transition:
      border-color 150ms var(--ease),
      background 150ms var(--ease);
  }

  .pill::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    width: 28px;
    height: 1px;
    background: var(--border-strong);
  }

  .pill::after {
    content: '';
    position: absolute;
    right: calc(100% + 24px);
    top: calc(50% - 3px);
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--border-strong);
    border: 2px solid var(--stage);
  }

  .pill.interactive {
    cursor: pointer;
  }

  .pill.interactive:hover {
    border-color: var(--border-strong);
  }

  .pill.selected {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--surface));
  }

  .pill.selected::before,
  .pill.selected::after {
    background: var(--accent);
  }

  .pill.empty .text {
    color: var(--subtle);
  }

  .num {
    flex: none;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--stage);
    font-size: 11px;
    color: var(--muted);
  }

  .pill.selected .num {
    background: var(--accent);
    color: var(--accent-contrast);
  }

  .text {
    white-space: pre-line;
    overflow-wrap: anywhere;
    animation: fade-in 180ms var(--ease);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(3px);
    }
  }

  .extras {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }

  .extras li {
    font-size: 12px;
    color: var(--muted);
    padding: 3px 10px;
    border-radius: var(--r-pill);
    border: 1px dashed var(--border-strong);
  }

  .flash .art::after {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: 40px;
    border: 2px solid var(--accent);
    opacity: 0;
    animation: ring 900ms var(--ease);
    pointer-events: none;
  }

  @keyframes ring {
    0% {
      opacity: 0.9;
      transform: scale(0.96);
    }
    100% {
      opacity: 0;
      transform: scale(1.08);
    }
  }

  @media (max-width: 520px) {
    .figure {
      gap: 20px;
    }
    .art {
      width: calc(var(--device-w) * 0.78);
    }
    .labels {
      width: auto;
      flex: 1 1 auto;
    }
    .pill::before {
      width: 20px;
    }
    .pill::after {
      right: calc(100% + 16px);
    }
  }
</style>
