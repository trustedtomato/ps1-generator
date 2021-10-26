/*--- Colors ---*/
export const ansiColors = ['000', 'A00', '0A0', 'AA0', '00A', 'A0A', '0AA', 'AAA']

export const boldenAnsiColor = (color: string): string => color
  .replace(/0/g, '5')
  .replace(/A/g, 'F')
export const boldAnsiColors = ansiColors.map(boldenAnsiColor)

export const ansiColorCodes = new Map([
  ...ansiColors.map((color, i): [string, number] => [color, i]),
  ...boldAnsiColors.map((color, i): [string, number] => [color, i])
])

function getFgColorEscapeCode (color: string): string {
  if(ansiColorCodes.has(color)) {
    const colorCode = `3${ansiColorCodes.get(color)}`
    const isBold = boldAnsiColors.includes(color)
    if (isBold) {
      return `1;${colorCode}`
    } else {
      return colorCode
    }
  }
  throw new Error('Coloring currently only supports ANSI colors!')
}

function getBgColorEscapeCode (color: string): string {
  if(ansiColorCodes.has(color)) {
    return `4${ansiColorCodes.get(color)}`
  }
  throw new Error('Coloring currently only supports ANSI colors!')
}

/*--- Text decoration ---*/
export interface Decoration {
  className: string
  escapeCode: string
  text: string
}

export const decorations: Decoration[] = [
  { className: 'text-decoration--underline', escapeCode: '4', text: 'underline' },
  { className: 'text-decoration--double-underline', escapeCode: '21', text: 'double underline' },
  { className: 'text-decoration--italic', escapeCode: '3', text: 'italic' },
  { className: 'text-decoration--line-through', escapeCode: '9', text: 'strikethrough' }
]

/*--- Put everything together ---*/
const resetStylingEscapeCode = '0;10'

const getFullEscapeCode = (parts: string[]) => `\\e[${parts.join(';')}m`

export function styleBashText (text: string, fgColor: string, bgColor: string, decorations: Iterable<Decoration>): string {
  const escapeCodeParts = [resetStylingEscapeCode]
  escapeCodeParts.push(getFgColorEscapeCode(fgColor))
  escapeCodeParts.push(getBgColorEscapeCode(bgColor))
  for (const decoration of decorations) {
    escapeCodeParts.push(decoration.escapeCode)
  }
  return `${getFullEscapeCode(escapeCodeParts)}${text}`
}
