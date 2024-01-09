const validFooters = [
  // github terms that link an issue
  // @see https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
  'close: ',
  'closes: ',
  'closed: ',
  'fix: ',
  'fixes: ',
  'fixed: ',
  'resolve: ',
  'resolves: ',
  'resolved: ',

  // additional allowed terms
  'ref: ',
  'refs: ',
  'qa notes: ',
  'no qa required',
  'no qa needed'
]

export default function isValidFooter(footer: string): boolean {
  footer = footer.toLowerCase()

  return validFooters.some(term => footer.startsWith(term))
}
