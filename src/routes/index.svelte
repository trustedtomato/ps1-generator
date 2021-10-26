<script lang="ts">
  import { removeChildrenOf } from '../utils/remove-children-of'
	import { flip } from 'svelte/animate'
  import { scale } from 'svelte/transition'
  import { waitForAnimFrame } from '../utils/wait-for-anim-frame'
  import ColorPicker from '../components/ColorPicker.svelte'
  import TextFormatPicker from '../components/TextFormatPicker.svelte'
  import { createEventListener } from '../utils/create-event-listener'
  import { browser } from '$app/env'
  import { getBoundingDocumentRect } from '../utils/get-bounding-document-rect'
  import { boardItems, getBoardItemData } from '../stores/board-items'
  import type { BoardItem } from '../stores/board-items'
  import { sourceItems } from '../stores/source-items'
  import { exampleResult } from '../stores/example-result'
  import { ps1Variable } from '../stores/ps1-variable'
  import { createThrottlingWorkplace } from '../utils/create-workplace';

  interface Rect {
    top: number
    right: number
    bottom: number
    left: number
  }

  interface BoardItemRect extends Rect {
    el: HTMLElement
  }

  let draggedContainer: HTMLElement
  
  let board: HTMLElement
  let boardRect: Rect
  let boardItemRects: BoardItemRect[] = []
  let nextBoardItemId = 0
  let formatDialogTargetId: string = null
  let formatDialogSnapToRight = false
  $: if (formatDialogTargetId) {
    const rect = boardItemRects.find(rect => rect.el.dataset.id === formatDialogTargetId)
    if (rect) {
      formatDialogSnapToRight = parseInt(getComputedStyle(rect.el.querySelector('.format-dialog')).minWidth) + rect.left > window.innerWidth
    }
  }

  
  let currentlyRecalculatingBoardRects = false
  async function recalculateBoardRects () {
    if (!board || currentlyRecalculatingBoardRects) return
    currentlyRecalculatingBoardRects = true

    // A hacky way to detect if the flip animations are still running.
    while (true) {
      await waitForAnimFrame()
      if (board.children.length === 0) {
        break
      }
      const style = board.children.item(board.children.length - 1).getAttribute('style')
      if (!style.includes('running') || !style.includes('animation')) {
        break
      }
    }

    boardRect = getBoundingDocumentRect(board)
    boardItemRects = Array.from(
      board.children,
      el => {
        const rect = getBoundingDocumentRect(el)
        return {
          el: el as HTMLElement,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left
        }
      }
    )

    currentlyRecalculatingBoardRects = false
    console.log('recalculated board rects!')
  }

  // Trigger board rect calculation when "board" or "boardItems" change.
  $: {
    board
    $boardItems
    recalculateBoardRects()
  }

  // Trigger board rect calculcation when the window size changes.
  browser && window.addEventListener('resize', () => {
    board = board
  })

  let draggingOverBoard = false
  let draggingTargetElement: HTMLElement
  let draggingTargetSide: 'left' | 'right'
  let draggedData: BoardItem
  const minDistanceOnDrag = 1

  function mayStartDragging (startE: PointerEvent, { onDragStart }: { onDragStart?: () => void } = {}) {
    const target = startE.currentTarget as HTMLElement
    let draggedElRect = null

    const pointermoveListener = createEventListener(
      document,
      'pointermove',
      createThrottlingWorkplace(
        async ({ pageX, pageY }: PointerEvent) => {
          const deltaX = pageX - startE.pageX
          const deltaY = pageY - startE.pageY
          if (
            !draggedElRect && (
              Math.abs(deltaX) > minDistanceOnDrag ||
              Math.abs(deltaY) > minDistanceOnDrag
            )
            ) {
            onDragStart?.()
            draggedElRect = getBoundingDocumentRect(target)

            // Clone target and put it into a fixed container
            // so that it can float everywhere.
            const cloned = target.cloneNode(true) as HTMLElement
            cloned.style.margin = '0px'
            removeChildrenOf(draggedContainer)
            draggedContainer.appendChild(cloned)
          }

          if (!draggedElRect) {
            return
          }

          // Move the dragged element to its new position.
          draggedContainer.style.transform = `translate(${draggedElRect.left + deltaX - scrollX}px, ${draggedElRect.top + deltaY - scrollY}px)`

          draggingOverBoard =
            boardRect.left < pageX &&
            boardRect.right > pageX &&
            boardRect.top < pageY &&
            boardRect.bottom > pageY
          
          if (draggingOverBoard && !currentlyRecalculatingBoardRects) {
            // Find the element and side to where the current mouse position is the closest.

            // I am assuming that the layout of the board is that
            // there are elements of varying widths in multiple rows,
            // in which the heights of the elements are the same.

            let smallestDY: number = Infinity
            let smallestDYRect
            for (const boardItemRect of boardItemRects) {
              const dTop = Math.abs(boardItemRect.top - pageY)
              const dBottom = Math.abs(boardItemRect.bottom - pageY)
              const dY = Math.min(dTop, dBottom)
              if (dY < smallestDY) {
                smallestDY = dY
                smallestDYRect = boardItemRect
              }
            }

            if (!smallestDYRect) return

            // Probably using rect.top === smallestDYRect.top would be fine too,
            // but in theory there might be browsers which render the elements slightly off,
            // so let's not live dangerously.
            const yAccuracy = 5
            const boardItemRectsInRow = boardItemRects.filter(rect => Math.abs(rect.top - smallestDYRect.top) < yAccuracy)

            let smallestDX: number = Infinity
            let isCloserToTheLeft = true
            let smallestDXRect
            for (const boardItemRect of boardItemRectsInRow) {
              const dLeft = Math.abs(boardItemRect.left - pageX)
              const dRight = Math.abs(boardItemRect.right - pageX)
              const dX = Math.min(dLeft, dRight)
              if (dX < smallestDX) {
                smallestDX = dX
                smallestDXRect = boardItemRect
                isCloserToTheLeft = dX === dLeft
              }
            }

            draggingTargetElement = smallestDXRect.el
            draggingTargetSide = isCloserToTheLeft ? 'left' : 'right'
          } else {
            draggingTargetElement = null
            draggingTargetSide = null
          }
        }
      )
    )

    const pointerupListener = createEventListener(document, 'pointerup', () => {
      pointermoveListener.destroy()
      pointerupListener.destroy()

      if (draggedData && draggingOverBoard) {
        if (draggingTargetElement) {
          let index = $boardItems.findIndex(item => item.id === draggingTargetElement.dataset.id)
          if (draggingTargetSide === 'right') {
            index += 1
          }
    
          $boardItems.splice(index, 0, draggedData)
        } else {
          $boardItems.push(draggedData)
        }

        boardItems.set($boardItems)
        draggedData = null
      
      }

      draggingOverBoard = false
      draggingTargetElement = null
      draggingTargetSide = null
      removeChildrenOf(draggedContainer)
    })
  }

  function onSourceItemPointerdown (e: PointerEvent) {
    // @ts-ignore
    const type = e.currentTarget?.dataset?.type
    if (typeof type !== 'string') {
      return
    }

    // disable selecting text
    e.preventDefault()

    mayStartDragging(e, {
      onDragStart () {
        draggedData = {
          ...sourceItems.find(source => source.type === type),
          id: String(nextBoardItemId++)
        }
      }
    })
  }

  function onBoardItemPointerdown (e: PointerEvent) {
    // Only enable dragging for main button (left-click).
    if (e.button !== 0) {
      return
    }

    const target = e.target as HTMLElement
    const id =
      target?.dataset?.id ||
      target?.closest('.item__label')?.parentElement.dataset.id

    if (typeof id !== 'string') {
      return
    }

    // disable selecting text
    e.preventDefault()
    
    const boardItemIndex = $boardItems.findIndex(item => item.id === id)
    if (boardItemIndex === -1) {
      console.error('cannot find boardItem with id:', id)
      return
    }
    
    mayStartDragging(e, {
      onDragStart () {
        draggedData = $boardItems.splice(boardItemIndex, 1)[0]
        boardItems.set($boardItems)
      }
    })
  }
  
  // Control the behaviour of the format context menu
  function onBoardItemContextmenu (e: Event) {
    e.preventDefault()
    formatDialogTargetId = (e.currentTarget as HTMLElement).dataset.id
  }

  browser && document.addEventListener('pointerdown', ({ target }) => {
    if (
      typeof formatDialogTargetId === 'string' &&
      !document.querySelector(`*[data-id="${formatDialogTargetId}"] .format-dialog`).contains(target as HTMLElement)
    ) {
      formatDialogTargetId = null
    }
  })
</script>

<h1>PS1 generator</h1>

<main class="main">
  <div class="workplace">
    <div class="item-container item-container--source">
      {#each sourceItems as item (item.type)}
        <span
          class="item"
          data-type={item.type}
          on:pointerdown={onSourceItemPointerdown}
        >
          <span class="item__label">{item.label}</span>
        </span>
      {/each}
    </div>
    <div bind:this={board} class="item-container item-container--board {draggingOverBoard ? 'dragging-over' : ''}">
      {#each $boardItems as item (item.id)}
        <span
          in:scale={{ duration: 400 }}
          animate:flip={{ duration: 400 }}
          on:pointerdown={onBoardItemPointerdown}
          on:contextmenu={onBoardItemContextmenu}
          class="item {
            draggingTargetElement && this.first === draggingTargetElement
              ? 'placing-item-on-the-' + draggingTargetSide
              : ''
          }"
          data-id={item.id}
        >
          <span class="item__label">{item.label}</span>
          <div class="format-dialog" style={formatDialogTargetId === item.id ? (formatDialogSnapToRight ? 'right: 0' : '') : 'display: none'}>
            {#if getBoardItemData(item).customText.length > 0}         
              <label>Content:</label>
              {#each getBoardItemData(item).customText as str}
                <input value={str} on:input={e => str = e.target.value}>
              {/each}
              <hr />
            {/if}
            <label>Text color:</label>
            <ColorPicker bind:value={item.data.format.color}/>
            <label>Background color:</label>
            <ColorPicker bind:value={item.data.format.backgroundColor} />
            <label>Text format:</label>
            <TextFormatPicker bind:value={item.data.format.textStyles} />
          </div>
        </span>
      {/each}
    </div>
  </div>

  <div class="result-and-additional-text">
    <div style="line-height: 0; white-space: nowrap">
      Example:
      <span class="terminal"
      >{#each $exampleResult as {format, text}}<span
        class="terminal-chunk {[...format.textStyles].map(style => style.className).join(' ')}"
        style="color: #{format.color}; background-color: #{format.backgroundColor}"
      >{text}</span>{/each}</span>
    </div>
    <div style="line-height: 0; white-space: nowrap">
      PS1 variable:
      <span class="terminal">
        {#if $ps1Variable}
          <span
            class="terminal-chunk"
          >{$ps1Variable}</span>
        {/if}
      </span>
    </div>
    <h2>How to use</h2>
    <ul>
      <li>
        Drag blocks from the first box and drop them into the second to make up your own PS1 variable!
      </li>
      <li>
        To change the order of the blocks, drag and drop them to another place with left-click.
      </li>
      <li>
        To remove a block, drag and drop them outside the second box with left-click.
      </li>
      <li>
        To change the format of a block, right-click on it.
      </li>
    </ul>
    For a detailed description of the special characters (the things which start with a backslash (\))
    check out the <a href="https://www.gnu.org/software/bash/manual/html_node/Controlling-the-Prompt.html">Bash reference manual</a>.
    <h2>About</h2>
    This web app was developed with love by <a href="https://github.com/trustedtomato">Tamás Halasi</a>,
    see the <a href="https://github.com/trustedtomato/ps1-generator">source code on GitHub</a>.
  </div>
</main>

<span bind:this="{draggedContainer}" class="dragged-container" />