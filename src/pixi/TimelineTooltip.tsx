import type { CSSProperties } from 'react'
import ColorsService from '../services/Colors'

export type TimelineTooltipState =
  | {
      kind: 'publication'
      clientX: number
      clientY: number
      titleLines: string[]
      colorSeed: number
    }
  | {
      kind: 'personHistory'
      clientX: number
      clientY: number
      type: string
      yearLabel: string
      titleLines: string[]
      colorSeed: number
    }

const MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

const TimelineTooltip = ({ tooltip }: { tooltip: TimelineTooltipState | null }) => {
  if (!tooltip) return null

  const fixed = ColorsService.getFixedColor(tooltip.colorSeed)
  const tamed = ColorsService.getTamedColor(tooltip.colorSeed)

  const style: CSSProperties = {
    position: 'fixed',
    left: tooltip.clientX,
    top: tooltip.clientY,
    transform: 'translate(-50%, 0)',
    pointerEvents: 'none',
    zIndex: 40,
    background: tamed,
    border: `2px solid ${fixed}`,
    borderRadius: 3,
    padding: '8px 10px',
    fontFamily: MONO,
    fontWeight: 700,
    color: fixed,
    maxWidth: tooltip.kind === 'publication' ? 220 : 230,
    boxSizing: 'border-box',
  }

  if (tooltip.kind === 'publication') {
    return (
      <div style={{ ...style, fontSize: 14 }}>
        {tooltip.titleLines.map((line, i) => (
          <div key={`${line}-${i}`}>{line}</div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ ...style, fontSize: 12 }}>
      <div>{tooltip.type}</div>
      <div>{tooltip.yearLabel}</div>
      {tooltip.titleLines.map((line, i) => (
        <div key={`${line}-${i}`}>{line}</div>
      ))}
    </div>
  )
}

export default TimelineTooltip
