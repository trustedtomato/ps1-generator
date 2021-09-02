<script lang="ts">
  const colors = ['000', 'A00', '0A0', 'AA0', '00A', 'A0A', '0AA', 'AAA']
  const boldColors = colors.map(color => color
    .replace(/0/g, '5')
    .replace(/A/g, 'F')
  )
</script>

<div>
  <div style="display: flex">
    {#each colors as color}
      <div style="background: #{color}; width: 1rem; height: 1rem" />
    {/each}
  </div>
  <div style="display: flex">
    {#each boldColors as color}
      <div style="background: #{color}; width: 1rem; height: 1rem" />
    {/each}
  </div>
</div>