import { useMemo, useState } from 'react'
import './App.css'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '')

  if (!/^[\da-fA-F]{6}$/.test(normalized)) {
    return null
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
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

function App() {
  const [foreground, setForeground] = useState('#111111')
  const [background, setBackground] = useState('#ffffff')

  const contrast = useMemo(() => getContrastRatio(foreground, background), [foreground, background])

  return (
    <main className="app">
      <h1>Contrast Check</h1>
      <p className="subtitle">Quick WCAG contrast checker for foreground/background color pairs.</p>

      <section className="controls">
        <label>
          Foreground
          <div className="control-row">
            <input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} />
            <input
              type="text"
              value={foreground}
              onChange={(event) => setForeground(event.target.value)}
              placeholder="#111111"
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
              onChange={(event) => setBackground(event.target.value)}
              placeholder="#ffffff"
            />
          </div>
        </label>
      </section>

      <section className="preview" style={{ color: foreground, backgroundColor: background }}>
        <p>The quick brown fox jumps over the lazy dog.</p>
        <p>1234567890 — Sample readability text.</p>
      </section>

      <section className="result">
        {contrast ? (
          <>
            <p className="ratio">Contrast ratio: {contrast.toFixed(2)}:1</p>
            <p>Rating: {getRating(contrast)}</p>
          </>
        ) : (
          <p>Use 6-digit hex colors (example: #1a2b3c)</p>
        )}
      </section>
    </main>
  )
}

export default App
