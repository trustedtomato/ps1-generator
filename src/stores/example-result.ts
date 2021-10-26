import { derived } from 'svelte/store'
import { boardItems, getBoardItemData } from './board-items'

export const exampleResult = derived(
  boardItems,
  $boardItems =>
    $boardItems
      .map(item => ({
        format: getBoardItemData(item).format,
        text: typeof item.example === 'function'
          ? item.example(...getBoardItemData(item).customText)
          : item.example
      }))
)