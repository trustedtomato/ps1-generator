<script lang="ts">
  import { removeChildrenOf } from '../utils/remove-children-of'
	import { flip } from 'svelte/animate'
  import { scale } from 'svelte/transition'
  import { waitForAnimFrame } from '../utils/wait-for-anim-frame';
  import ColorPicker from '../components/ColorPicker.svelte'
  import TextFormatPicker from '../components/TextFormatPicker.svelte'
  import { createEventListener } from '../utils/create-event-listener'
import { browser } from '$app/env';

  interface SourceItem {
    label: string
    result: string | ((...args: string[]) => string)
    example: string | ((...args: string[]) => string)
    type: string
  }

  interface BoardItem extends SourceItem {
    id: string
    data?: any
  }

  interface Rect {
    top: number
    right: number
    bottom: number
    left: number
  }

  interface BoardItemRect extends Rect {
    el: HTMLElement
  }

	let sources: SourceItem[] = [
    { label: 'Date in "Weekday Month Date" format (\\d)', result: '\\d', example: 'Tue May 26' },
		{ label: 'Hostname up to the first "." (\\h)', result: '\\d', example: 'mycomputer' },
    { label: 'Hostname (\\H)', result: '\\H', example: 'mycomuter.localdomain' },
    { label: 'Number of jobs currently managed by the shell (\\j)', result: '\\j', example: '3' },
    { label: 'Basename of the shell\'s terminal device name (\\l)', result: '\\l', example: '0' },
    { label: 'Name of the shell (\\s)', result: '\\s', example: 'bash' },
    { label: 'Time in 24-hour HH:MM:SS format (\\t)', result: '\\t', example: '22:46:03' },
    { label: 'Time in 12-hour HH:MM:SS format (\\T)', result: '\\T', example: '10:46:03' },
    { label: 'Time in 12-hour am/pm format (\\@)', result: '\\@', example: '10:46 PM' },
    { label: 'Time in 24-hour HH:MM format (\\A)', result: '\\A', example: '22:46' },
    { label: 'Username of the current user (\\u)', result: '\\u', example: 'potatocaptain' },
    { label: 'Version of Bash (\\v)', result: '\\v', example: '5.1' },
    { label: 'Version of Bash + patchlevel (\\V)', result: '\\V', example: '5.1.8' },
    { label: 'Current working directory (\\w)', result: '\\w', example: '~/Documents/mydir' },
    { label: 'Current working directory\'s basename (\\W)', result: '\\W', example: 'mydir' },
    { label: 'History number of this command (\\!)', result: '\\W', example: '127' },
    { label: 'Command number of this command (\\#)', result: '\\#', example: '26' },
    { label: '# if the effective UID is 0, otherwise $', result: '\\$', example: '$' },
    { label: 'Text', result: (text: string) => text.replace(/\\/g, '\\\\'), example: (text: string) => text}
	].map((source, index) => ({
    ...source,
    type: String(index)
  }))

  let draggedContainer: HTMLElement
  
  let board: HTMLElement
  let boardRect: Rect
  let boardItems: BoardItem[] = []
  let boardItemRects: BoardItemRect[] = []
  let nextBoardItemId = 0
  let formatDialogTargetId: string = null
  
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

    boardRect = board.getBoundingClientRect()
    boardItemRects = Array.from(
      board.children,
      el => {
        const rect = el.getBoundingClientRect()
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
    boardItems
    recalculateBoardRects()
  }

  let draggingOverBoard = false
  let draggingTargetElement: HTMLElement
  let draggingTargetSide: 'left' | 'right'
  let draggedData: BoardItem
  const minDistanceOnDrag = 1

  function mayStartDragging (startE: PointerEvent, { onDragStart }: { onDragStart?: () => void } = {}) {
    const target = startE.target as HTMLElement
    let draggedElRect = null

    const pointermoveListener = createEventListener(document, 'pointermove', ({ x, y }: PointerEvent) => {
      const deltaX = x - startE.x
      const deltaY = y - startE.y
      if (
        !draggedElRect && (
          Math.abs(deltaX) > minDistanceOnDrag ||
          Math.abs(deltaY) > minDistanceOnDrag
        )
      ) {
        draggedElRect = target.getBoundingClientRect()

        // Clone target and put it into a fixed container
        // so that it can float everywhere.
        const cloned = target.cloneNode(true) as HTMLElement
        cloned.style.margin = '0px'
        removeChildrenOf(draggedContainer)
        draggedContainer.appendChild(cloned)
        onDragStart?.()
      }

      if (!draggedElRect) {
        return
      }

      // Move the dragged element to its new position.
      draggedContainer.style.transform = `translate(${draggedElRect.left + deltaX}px, ${draggedElRect.top + deltaY}px)`

      draggingOverBoard =
        boardRect.left < x &&
        boardRect.right > x &&
        boardRect.top < y &&
        boardRect.bottom > y
      
      if (draggingOverBoard && !currentlyRecalculatingBoardRects) {
        // Find the element and side to where the current mouse position is the closest.

        // I am assuming that the layout of the board is that
        // there are elements of varying widths in multiple rows,
        // in which the heights of the elements are the same.

        let smallestDY: number = Infinity
        let smallestDYRect
        for (const boardItemRect of boardItemRects) {
          const dTop = Math.abs(boardItemRect.top - y)
          const dBottom = Math.abs(boardItemRect.bottom - y)
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
          const dLeft = Math.abs(boardItemRect.left - x)
          const dRight = Math.abs(boardItemRect.right - x)
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
    })

    const pointerupListener = createEventListener(document, 'pointerup', () => {
      pointermoveListener.destroy()
      pointerupListener.destroy()

      if (draggedData && draggingOverBoard) {
        if (draggingTargetElement) {
          let index = boardItems.findIndex(item => item.id === draggingTargetElement.dataset.id)
          if (draggingTargetSide === 'right') {
            index += 1
          }
    
          boardItems.splice(index, 0, draggedData)
        } else {
          boardItems.push(draggedData)
        }

        boardItems = boardItems
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
    const type = e.target?.dataset?.type
    if (typeof type !== 'string') {
      return
    }

    // disable selecting text
    e.preventDefault()

    mayStartDragging(e, {
      onDragStart () {
        draggedData = {
          ...sources.find(source => source.type === type),
          id: String(nextBoardItemId++)
        }
      }
    })
  }

  function onBoardItemPointerdown (e: PointerEvent) {
    // @ts-ignore
    const id = e.target?.dataset?.id
    if (typeof id !== 'string') {
      return
    }

    // disable selecting text
    e.preventDefault()
    
    const boardItemIndex = boardItems.findIndex(item => item.id === id)
    if (boardItemIndex === -1) {
      console.error('cannot find boardItem with id:', id)
      return
    }
    
    mayStartDragging(e, {
      onDragStart () {
        draggedData = boardItems.splice(boardItemIndex, 1)[0]
        boardItems = boardItems
      }
    })
  }
  
  // Control the behaviour of the format context menu
  browser && document.addEventListener('pointerup', ({ target }) => {
    if (!draggedData && typeof target?.['dataset'].id === 'string') {
      formatDialogTargetId = target['dataset'].id
    }
  })

  browser && document.addEventListener('pointerdown', ({ target }) => {
    if (
      typeof formatDialogTargetId === 'string' &&
      !document.querySelector(`*[data-id="${formatDialogTargetId}"]`).contains(target as HTMLElement)
    ) {
      formatDialogTargetId = null
    }
  })

  function preventDefault (e: Event) {
    e.preventDefault()
  }
</script>

<style>
	section {
    width: 100%;
		height: 100%;
    outline: 0;
    box-sizing: border-box;
    padding: .25rem;
    display: flex;
    flex-wrap: wrap;
    background: black;
    min-height: 3rem;
	}
  .item {
    box-sizing: border-box;
    padding: .25rem;
    /* There must be some margin, otherwise the drag and drop algorithm will not work correctly. */
    margin: .25rem;
    box-shadow: inset 0 0 0 .125rem #333;
    background: black;
    color: #AAA;
    position: relative;
    cursor: pointer;
  }
  .item.placing-item-on-the-right::after,
  .item.placing-item-on-the-left::before {
    position: absolute;
    display: block;
    width: .125rem;
    background: red;
    content: '';
    top: 0;
    height: 100%;
  }

  .item.placing-item-on-the-right::after {
    right: -.3125rem; /* (-(.25rem + (.125rem / 2)))*/
  }

  .item.placing-item-on-the-left::before {
    left: -.3125rem;
  }

  .dragging-over {
    outline: 1px solid red;
  }

  .format-dialog {
    position: absolute;
    bottom: .125rem;
    transform: translateY(100%);
    left: 0;
    background: black;
    width: 100%;
    padding: .5rem;
    box-sizing: border-box;
    min-width: 14.5rem;
    border: .125rem #333 solid;
  }

  .dragged-container {
    position: fixed;
    left: 0;
    top: 0;
    display: flex;
    opacity: .5;
  }
</style>
<h1>PS1 generator</h1>
Drag blocks from the first box and drop them into the second
to make up your own PS1 variable!
<section>
	{#each sources as item (item.type)}
		<span
      class="item"
      data-type={item.type}
      on:pointerdown={onSourceItemPointerdown}
      on:contextmenu={preventDefault}
    >{item.label}</span>
	{/each}
</section>
<section bind:this={board} class={draggingOverBoard ? 'dragging-over' : ''}>
	{#each boardItems as item (item.id)}
		<span
      in:scale={{ duration: 400 }}
      animate:flip={{ duration: 400 }}
      on:pointerdown={onBoardItemPointerdown}
      on:contextmenu={preventDefault}
      class="item {
        draggingTargetElement && this.first === draggingTargetElement
          ? 'placing-item-on-the-' + draggingTargetSide
          : null
      }"
      data-id={item.id}
    >
      {item.label}
      <div class="format-dialog" style={formatDialogTargetId === item.id ? '' : 'display: none'}>
        <h2>Format</h2>
        <h3>Text color</h3>
        <ColorPicker />
        <h3>Background color</h3>
        <ColorPicker />
        <h3>Text format</h3>
        <TextFormatPicker />
      </div>
    </span>
	{/each}
</section>

For a more detailed description of the special characters (the things which start with a backslash (\))
check out the <a href="https://www.gnu.org/software/bash/manual/html_node/Controlling-the-Prompt.html">Bash reference manual</a>.

<span bind:this="{draggedContainer}" class="dragged-container" />