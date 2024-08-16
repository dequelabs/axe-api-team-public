const validFooterPrefixes = [
  // Should accept all github terms that link an issue
  // @see https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
  'close',
  'closes',
  'closed',
  'fix',
  'fixes',
  'fixed',
  'resolve',
  'resolves',
  'resolved',
  // Additional allowed terms
  'ref',
  'refs',
  'qa notes'
]
const validFooters = ['no qa needed', 'no qa required']

const validFooterPrefixRegex = new RegExp(
  `^(${validFooterPrefixes.join('|')}):? `,
  'i'
)
export default function isValidFooter(footer: string): boolean {
  footer = footer.toLowerCase()

  return validFooters.includes(footer) || validFooterPrefixRegex.test(footer)
}
