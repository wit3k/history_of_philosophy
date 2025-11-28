const tamedPalette = [
  '#b1ecc6ff',
  '#d7eaf0ff',
  '#dec5e9ff',
  '#cac5e5ff',
  '#d0aca6ff',
  '#cde2c0ff',
  '#bbe3d5ff',
  '#e8d3c6ff',
  '#d7c5bbff',
  '#ead0e5ff',
]
const palette = [
  '#2CAA58',
  '#3f9db9ff',
  '#b159ddff',
  '#3d1fd5ff',
  '#8C3226',
  '#678A51',
  '#16835bff',
  '#E78140',
  '#b15a24ff',
  '#962281ff',
]
class RGB {
  constructor(
    public r: number,
    public g: number,
    public b: number,
  ) {}
}
export default {
  getTamedColor: (number: number) => {
    return tamedPalette[number % tamedPalette.length]
  },
  getFixedColor: (number: number) => {
    return palette[number % tamedPalette.length]
  },
  getAccentColor: (name: string | null) => {
    if (name == null) {
      return 'rgba(27, 100, 27, 1)'
    }
    let fixedColors = new Map<string, string>()
    fixedColors.set('Amerykanin', '#0379dfff')
    fixedColors.set('Austryjak', '#EF3340')
    fixedColors.set('Brytyjczyk', '#aa4400')
    fixedColors.set('Chińczyk', '#c71717ff')
    fixedColors.set('Holender', '#f49d07ff')
    fixedColors.set('Francuz', '#318CE7')
    fixedColors.set('Niemiec', '#000000')
    fixedColors.set('Węgier', '#477050')

    if (fixedColors.get(name) != undefined) {
      return fixedColors.get(name)
    }

    const random = name
      .split('')
      .map(char => char.charCodeAt(0))
      .reduce((current, previous) => Math.min(previous, 1000) + current)

    return palette[Math.floor(((random % 1000) / 1000) * palette.length)]
  },

  hexToRgb: (hex: string): RGB => {
    const r = parseInt(hex.substring(1, 3), 16)
    const g = parseInt(hex.substring(3, 5), 16)
    const b = parseInt(hex.substring(5, 7), 16)
    return { r, g, b }
  },
  blendColors: (rgbA: RGB, rgbB: RGB, amountToMix: number) => {
    const r = Math.round(rgbA.r * (1 - amountToMix) + rgbB.r * amountToMix)
    const g = Math.round(rgbA.g * (1 - amountToMix) + rgbB.g * amountToMix)
    const b = Math.round(rgbA.b * (1 - amountToMix) + rgbB.b * amountToMix)
    return { r, g, b }
  },
  rgbToHex: (rgb: RGB) => {
    const toHex = (c: number) => {
      const hex = Math.round(c).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
  },

  rgbToCssString: (rgb: RGB) => {
    return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`
  },
}
