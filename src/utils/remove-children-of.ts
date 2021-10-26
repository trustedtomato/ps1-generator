export function removeChildrenOf (parentNode: Node): void {
  parentNode.childNodes.forEach(node => parentNode.removeChild(node))
}