import { extend } from '@pixi/react'
import { Container, Graphics, Sprite, Text } from 'pixi.js'

let extended = false

/** Register Pixi display objects for @pixi/react JSX (call once). */
export function ensurePixiExtended() {
  if (extended) return
  extend({ Container, Graphics, Sprite, Text })
  extended = true
}
