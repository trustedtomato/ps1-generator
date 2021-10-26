<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const colors = ['000', 'A00', '0A0', 'AA0', '00A', 'A0A', '0AA', 'AAA']
  const boldColors = colors.map(color => color
    .replace(/0/g, '5')
    .replace(/A/g, 'F')
  )
  const dispatch = createEventDispatcher()
  export let value = colors[0]
  $: {
    dispatch('input', value)
  }
  function createOnClick (color: string) {
    return function () {
      value = color
    }
  }
  const rows = [colors, boldColors]
</script>

<div>
  {#each rows as row}
    <div style="display: flex">
      {#each row as color}
        <button
          class="color-tile"
          style="background: #{color}; {color === value ? 'position: relative; outline: 2px solid red' : ''}"
          on:pointerdown={createOnClick(color)}
        />
      {/each}
    </div>
  {/each}
</div>