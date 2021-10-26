import type { Decoration } from '../utils/format-bash'
import { writable } from 'svelte/store'
import type { SourceItem } from './source-items'

interface BoardItemData {
  format: {
    color: string,
    backgroundColor: string,
    textStyles: Set<Decoration>
  },
  customText: string[]
}

export interface BoardItem extends SourceItem {
  id: string
  data?: BoardItemData
}

export function getBoardItemData (boardItem: BoardItem): BoardItemData {
  if (!boardItem.data) {
    boardItem.data = {
      format: {
        color: 'AAA',
        backgroundColor: '000',
        textStyles: new Set()
      },
      customText: typeof boardItem.result === 'function'
        ? Array.from({ length: boardItem.result.length }, () => '')
        : []
    }
  }
  return boardItem.data
}

export const boardItems = writable([] as BoardItem[])