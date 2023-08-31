export default function isValidFooter(title: string): boolean {
  footer = footer.toLowerCase();

  return (
    footer.startsWith('closes: ') ||
    footer.startsWith('ref: ') ||
    footer.startsWith('refs: ') ||
    footer.startsWith('qa notes: ') ||
    footer.startsWith('no qa required')
  )
}
