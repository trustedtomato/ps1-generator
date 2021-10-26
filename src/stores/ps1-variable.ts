import { styleBashText } from '../utils/format-bash'
import { derived } from 'svelte/store'
import { boardItems, getBoardItemData } from './board-items'

export const ps1Variable = derived(
  boardItems,
  $boardItems => {
    const str = $boardItems
      .map(item => styleBashText(
        typeof item.result === 'function'
          ? item.result(...getBoardItemData(item).customText)
          : item.result,
        getBoardItemData(item).format.color,
        getBoardItemData(item).format.backgroundColor,
        getBoardItemData(item).format.textStyles
      ))
      .join('')
    return str ? `"${str}\\e[0;10m"` : ''
  }
)