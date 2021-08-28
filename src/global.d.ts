/// <reference types="@sveltejs/kit" />

declare type DndEvent = { detail: import('svelte-dnd-action').DndEvent }
declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    onconsider?: (e: DndEvent) => void
    onfinalize?: (e: DndEvent) => void
  }
}
