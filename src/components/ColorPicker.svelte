<script lang="ts">
  import { ansiColors, boldAnsiColors } from '../utils/format-bash'

  export let value = ansiColors[0]

  const rows = [ansiColors, boldAnsiColors]
  function createOnClick (color: string) {
    return function () {
      value = color
    }
  }
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