import { useMemo, useState } from 'react'
import './App.css'

type Preset = {
  name: string
  foreground: string
  background: string
}

const presets: Preset[] = [
  { name: 'Slate', foreground: '#e2e8f0', background: '#0f172a' },
  { name: 'Terminal', foreground: '#d1fae5', background: '#022c22' },
  { name: 'Classic', foreground: '#111111', background: '#ffffff' },
  { name: 'Warm', foreground: '#fff7ed', background: '#7c2d12' },
  { name: 'Ocean', foreground: '#e0f2fe', background: '#0c4a6e' },
  { name: 'Rose', foreground: '#ffe4e6', background: '#881337' },
]

function normalizeHexInput(value: string): string {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return '#'
  }

  if (trimmed.startsWith('#')) {
    return trimmed
  }

  return `#${trimmed}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '')

  if (!/^[\da-fA-F]{6}$/.test(normalized)) {
    return null
  }

  return {
    b: Number.parseInt(normalized.slice(4, 6), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    r: Number.parseInt(normalized.slice(0, 2), 16),
  }
}

function srgbToLinear(value: number): number {
  const normalized = value / 255

  if (normalized <= 0.03928) {
    return normalized / 12.92
  }

  return ((normalized + 0.055) / 1.055) ** 2.4
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

function getContrastRatio(a: string, b: string): number | null {
  const rgbA = hexToRgb(a)
  const rgbB = hexToRgb(b)

  if (!rgbA || !rgbB) {
    return null
  }

  const lumA = getLuminance(rgbA.r, rgbA.g, rgbA.b)
  const lumB = getLuminance(rgbB.r, rgbB.g, rgbB.b)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)

  return (lighter + 0.05) / (darker + 0.05)
}

function getRating(ratio: number): string {
  if (ratio >= 7) {
    return 'AAA (normal text)'
  }

  if (ratio >= 4.5) {
    return 'AA (normal text)'
  }

  if (ratio >= 3) {
    return 'AA (large text only)'
  }

  return 'Fail'
}

function pickBestForeground(background: string): string {
  const black = '#000000'
  const white = '#ffffff'
  const blackContrast = getContrastRatio(black, background) ?? 0
  const whiteContrast = getContrastRatio(white, background) ?? 0

  if (whiteContrast >= blackContrast) {
    return white
  }

  return black
}

function App() {
  const [foreground, setForeground] = useState('#e2e8f0')
  const [background, setBackground] = useState('#0f172a')

  const contrast = useMemo(() => getContrastRatio(foreground, background), [foreground, background])

  const matrix = useMemo(() => {
    if (!contrast) {
      return null
    }

    return {
      largeAa: contrast >= 3,
      largeAaa: contrast >= 4.5,
      normalAa: contrast >= 4.5,
      normalAaa: contrast >= 7,
    }
  }, [contrast])

  function swapColors(): void {
    setForeground(background)
    setBackground(foreground)
  }

  function applyBestForeground(): void {
    setForeground(pickBestForeground(background))
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>Contrast Check</h1>
          <p className="subtitle">WCAG checker for foreground/background pairs with AA & AAA matrix.</p>
        </div>
        <span className="theme-pill">dark</span>
      </header>

      <section className="preset-grid">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => {
              setForeground(preset.foreground)
              setBackground(preset.background)
            }}
            type="button"
          >
            {preset.name}
          </button>
        ))}
      </section>

      <section className="controls">
        <label>
          Foreground
          <div className="control-row">
            <input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} />
            <input
              type="text"
              value={foreground}
              onChange={(event) => setForeground(normalizeHexInput(event.target.value))}
              placeholder="#e2e8f0"
            />
          </div>
        </label>

        <label>
          Background
          <div className="control-row">
            <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
            <input
              type="text"
              value={background}
              onChange={(event) => setBackground(normalizeHexInput(event.target.value))}
              placeholder="#0f172a"
            />
          </div>
        </label>
      </section>

      <section className="action-row">
        <button onClick={swapColors} type="button">
          Swap colors
        </button>
        <button onClick={applyBestForeground} type="button">
          Pick best text for bg
        </button>
      </section>

      <section className="preview" style={{ backgroundColor: background, color: foreground }}>
        <p>The quick brown fox jumps over the lazy dog.</p>
        <p className="preview-large">Large text sample — 24px equivalent.</p>
        <p>1234567890 — Sample readability text.</p>
      </section>

      <section className="result">
        {contrast && matrix ? (
          <>
            <p className="ratio">Contrast ratio: {contrast.toFixed(2)}:1</p>
            <p className="rating">Rating: {getRating(contrast)}</p>

            <ul className="matrix">
              <li>
                Normal text AA: <strong>{matrix.normalAa ? 'pass' : 'fail'}</strong>
              </li>
              <li>
                Normal text AAA: <strong>{matrix.normalAaa ? 'pass' : 'fail'}</strong>
              </li>
              <li>
                Large text AA: <strong>{matrix.largeAa ? 'pass' : 'fail'}</strong>
              </li>
              <li>
                Large text AAA: <strong>{matrix.largeAaa ? 'pass' : 'fail'}</strong>
              </li>
            </ul>
          </>
        ) : (
          <p>Use 6-digit hex colors (example: #1a2b3c)</p>
        )}
      </section>
    </main>
  )
}

export default App
