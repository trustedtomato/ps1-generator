import { derived } from 'svelte/store'
import { boardItems, getBoardItemData } from './board-items'

export const ps1Variable = derived(
  boardItems,
  $boardItems => {
    const str = $boardItems
      .map(item => typeof item.result === 'function'
        ? item.result(...getBoardItemData(item).customText)
        : item.result
      )
      .join('')
    return str ? `"${str}"` : ''
  }
)