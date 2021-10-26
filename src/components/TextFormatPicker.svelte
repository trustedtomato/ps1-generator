<script lang="ts">
  import type { Decoration } from '../utils/format-bash'
  import { decorations } from '../utils/format-bash'
  export let value: Set<Decoration> = new Set()
  function createOnClick (decoration: Decoration) {
    return function () {
      if (value.has(decoration)) {
        value.delete(decoration)
      } else {
        value.add(decoration)
      }
      value = value
    }
  }
</script>

<div class="text-decoration-container">
  {#each decorations as decoration}
    <button
      class="text-decoration-tile"
      style={value.has(decoration) ? 'outline: 2px solid red' : ''}
      on:pointerdown={createOnClick(decoration)}
    >
      <div class={decoration.className}>{decoration.text}</div>
    </button>
  {/each}
</div>