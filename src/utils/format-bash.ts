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

export function fgColorBash (color: string): string {
  if(ansiColorCodes.has(color)) {
    const setaf = `\\[$(setaf ${ansiColorCodes.get(color)})\\]`
    const isBold = boldAnsiColors.includes(color)
    if (isBold) {
      return `\\[$(tput bold)\\]${setaf}`
    } else {
      return setaf
    }
  }
  throw new Error('Coloring currently only supports ANSI colors!')
}

export function bgColorBash (color: string): string {
  if(ansiColorCodes.has(color)) {
    return `\\[$(setab ${ansiColorCodes.get(color)})\\]`
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
