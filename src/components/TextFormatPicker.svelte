<script>
  const styles = [
    { styleAttr: 'text-decoration: underline', text: 'underline' },
    { styleAttr: 'text-decoration: underline; padding-bottom: 1px; border-bottom: solid 1px', text: 'double underline' },
    { styleAttr: 'font-style: italic', text: 'italic' },
    { styleAttr: 'text-decoration: line-through', text: 'strikethrough' },
  ]
</script>

<div style="display: flex; line-height: 1rem; flex-wrap: wrap; margin: -.25rem;">
  {#each styles as style}
    <div style="margin: .25rem; padding: .25rem; border: 1px solid #444">
      <div style={style.styleAttr}>{style.text}</div>
    </div>
  {/each}
</div>