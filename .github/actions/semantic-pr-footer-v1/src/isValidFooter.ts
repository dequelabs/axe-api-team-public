// These must appear with a suffix (eg, "fix #123" or "QA Notes: test X, Y, and Z")
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

// These may appear alone or with a suffix (eg, "no qa needed" or "no qa needed (test only)")
const validFooters = ['no qa needed', 'no qa required']

const validFooterPrefixRegex = new RegExp(
  `^(${validFooterPrefixes.join('|')}):? `,
  'i'
)
const validFooterRegex = new RegExp(`^(${validFooters.join('|')})`, 'i')
export default function isValidFooter(footer: string): boolean {
  footer = footer.trimStart()
  return validFooterRegex.test(footer) || validFooterPrefixRegex.test(footer)
}
