<script lang="ts">
	import {flip} from 'svelte/animate'
  import {scale, slide, fade} from 'svelte/transition'

  interface SourceItem {
    label: string
    result: string | ((...args: string[]) => string)
    example: string | ((...args: string[]) => string)
    type: string
  }

  interface BoardItem extends SourceItem {
    id: string
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

  let board: HTMLElement
  let boardItems: BoardItem[] = []
  let boardRects: { el: HTMLElement, top: number, right: number, bottom: number, left: number }[]
  let nextBoardItemId = 0
  
  function recalculateBoardRects () {
    boardRects = board && Array.from(
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
  }

  function onSourceDrag (e: DragEvent) {
    e.dataTransfer.dropEffect = 'copy'
    e.dataTransfer.setData('text/plain', (e.target as HTMLElement).dataset.type)
    recalculateBoardRects()
  }
  
  let currentlyDraggingBoardItem = false
  let currentlyDoingFlipAnimations = false
  function onBoardItemDrag (e: DragEvent) {
    // If we are moving a text selection for example, we shouldn't do anything.
    // @ts-ignore
    if (!e.target.dataset) return

    e.dataTransfer.dropEffect = 'move'
    e.dataTransfer.setData('text/plain', (e.target as HTMLElement).dataset.type)

    currentlyDoingFlipAnimations = true
    currentlyDraggingBoardItem = true
    
    // We have to wait a bit, else dragging doesn't work.
    setTimeout(() => {
      if (!currentlyDraggingBoardItem) return

      const index = boardItems.findIndex(item => item.id === (e.target as HTMLElement).dataset.id)
      if (index !== -1) {
        boardItems.splice(index, 1)
        boardItems = boardItems
      }
      // A hacky way to detect if the flip animations are still running.
      requestAnimationFrame(function loop () {
        const style = board.children.item(board.children.length - 1).getAttribute('style')
        if (style.includes('running') && style.includes('animation')) {
          requestAnimationFrame(loop)
        } else {
          currentlyDoingFlipAnimations = false
          recalculateBoardRects()
        }
      })
    }, 200)
  }

  function onBoardItemDragend (e: DragEvent) {
    currentlyDraggingBoardItem = false
  }
  
  let targetElement: HTMLElement = null
  let targetSide: 'left' | 'right' = null

  function resetTargetElement () {
    targetElement = null
    targetSide = null
  }

  function onBoardDragover (e: DragEvent) {
    if (currentlyDoingFlipAnimations || !e.dataTransfer.getData('text/plain')) {
      return
    }

    e.preventDefault()

    // I am assuming that the layout of the board is that
    // there are elements of varying widths in multiple rows,
    // in which the heights of the elements are the same.

    let smallestDY: number = Infinity
    let smallestDYRect
    for (const boardRect of boardRects) {
      const dTop = Math.abs(boardRect.top - e.y)
      const dBottom = Math.abs(boardRect.bottom - e.y)
      const dY = Math.min(dTop, dBottom)
      if (dY < smallestDY) {
        smallestDY = dY
        smallestDYRect = boardRect
      }
    }

    if (!smallestDYRect) return

    // Probably using rect.top === smallestDYRect.top would be fine too,
    // but in theory there might be browsers which render the elements slightly off,
    // so let's not live dangerously.
    const yAccuracy = 5
    const boardRectsInRow = boardRects.filter(rect => Math.abs(rect.top - smallestDYRect.top) < yAccuracy)

    let smallestDX: number = Infinity
    let isCloserToTheLeft = true
    let smallestDXRect
    for (const boardRect of boardRectsInRow) {
      const dLeft = Math.abs(boardRect.left - e.x)
      const dRight = Math.abs(boardRect.right - e.x)
      const dX = Math.min(dLeft, dRight)
      if (dX < smallestDX) {
        smallestDX = dX
        smallestDXRect = boardRect
        isCloserToTheLeft = dX === dLeft
      }
    }

    targetElement = smallestDXRect.el
    targetSide = isCloserToTheLeft ? 'left' : 'right'
  }
  
  function onBoardDrop (e: DragEvent) {
    e.preventDefault()
    const source = sources.find(source => source.type === e.dataTransfer.getData('text/plain'))
    if (!source) {
      return
    }

    const newItem = {
      ...source,
      id: String(nextBoardItemId++)
    }

    if (!targetElement) {
      boardItems.push(newItem)
    } else {
      let index = boardItems.findIndex(item => item.id === targetElement.dataset.id)
      if (targetSide === 'right') {
        index += 1
      }
      boardItems.splice(index, 0, newItem)
    }

    // trigger rerendering
    boardItems = boardItems
    resetTargetElement()
  }
</script>

<style>
	section {
		overflow: auto;
    width: 100%;
		height: 100%;
    outline: 0;
    box-sizing: border-box;
    padding: .25rem;
    display: flex;
    flex-wrap: wrap;
    border-top: 1px solid black;
    border-bottom: 1px solid black;
    min-height: 3rem;
	}
  div {
    box-sizing: border-box;
    padding: .25rem;
    /* there must be some margin, otherwise the drag and drop algorithm will not work correctly. */
    margin: .25rem;
    box-shadow: inset 0 0 0 .125rem #ccc;
    position: relative;
  }
  div.placing-item-on-the-right::after,
  div.placing-item-on-the-left::before {
    position: absolute;
    display: block;
    width: .125rem;
    background: red;
    content: '';
    top: 0;
    height: 100%;
  }

  div.placing-item-on-the-right::after {
    right: -.3125rem; /* (-(.25rem + (.125rem / 2)))*/
  }

  div.placing-item-on-the-left::before {
    left: -.3125rem;
  }
</style>
Drag blocks from the first box and drop them into the second
to make up your own PS1 variable!
<section>
	{#each sources as item (item.type)}
		<div draggable="true" data-type={item.type} on:dragstart="{onSourceDrag}">{item.label}</div>
	{/each}
</section>
<section on:drop="{onBoardDrop}" on:dragover="{onBoardDragover}" on:dragend="{onBoardItemDragend}" on:dragleave="{resetTargetElement}" bind:this={board}>
	{#each boardItems as item (item.id)}
		<div
      draggable="true"
      in:scale={{ duration: 400 }}
      animate:flip={{ duration: 400 }}
      class="{
        targetElement && this.first === targetElement
          ? (targetSide === 'right' ? 'placing-item-on-the-right' : 'placing-item-on-the-left')
          : null
      }"
      data-type="{item.type}"
      data-id={item.id}
      on:dragstart="{onBoardItemDrag}"
    >
      {item.label}
    </div>
	{/each}
</section>

For a more detailed description of the special characters (the things which start with a backslash (\))
check out the <a href="https://www.gnu.org/software/bash/manual/html_node/Controlling-the-Prompt.html">Bash reference manual</a>.