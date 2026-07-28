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

// These may appear alone *only* when they introduce a trailing section, so the
// content satisfying them lives beneath the heading rather than on the same line.
// Issue-linking keywords are deliberately excluded: "## Closes" with the issue
// reference somewhere below is not something we want to accept.
const validSectionHeadings = ['qa notes']

const validFooterPrefixRegex = new RegExp(
  `^(${validFooterPrefixes.join('|')}):? `,
  'i'
)
const validFooterRegex = new RegExp(`^(${validFooters.join('|')})`, 'i')
const validSectionHeadingRegex = new RegExp(
  `^(${validSectionHeadings.join('|')}):?\\s*$`,
  'i'
)

/**
 * Strip markdown so a footer written as a heading is recognised: the leading `#`s
 * of an ATX heading, and the emphasis characters people wrap keywords in
 * (`**No QA required**`).
 *
 * Only leading whitespace is removed. The prefix rule requires whitespace after
 * the keyword — "Closes:" alone is invalid — so trimming the end here would make
 * every prefixed footer fail.
 */
function stripMarkdown(footer: string): string {
  return footer
    .replace(/^\s{0,3}#{1,6}\s*/, '')
    .replace(/[*_`]/g, '')
    .replace(/^\s+/, '')
}

/**
 * @param footer the candidate footer text
 * @param isSectionHeading whether `footer` is a markdown heading introducing a
 * non-empty trailing section. Only then may a keyword such as "QA notes" stand
 * alone, because the content it promises follows underneath. Without this, a
 * bare keyword stays invalid — "Closes:" on its own is still a failure.
 */
export default function isValidFooter(
  footer: string,
  isSectionHeading = false
): boolean {
  const text = stripMarkdown(footer)

  return (
    validFooterRegex.test(text) ||
    validFooterPrefixRegex.test(text) ||
    (isSectionHeading && validSectionHeadingRegex.test(text))
  )
}
