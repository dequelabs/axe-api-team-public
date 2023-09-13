import type { ParsedCommitList } from './types'
import dedent from 'dedent'

export const rawCommitList = dedent`
  061acd5 refactor(integrations/javascript): some refactor (#664)
  4d6220e chore: Update dependencies (#680)
  3d6220e fix(packages/axe-core): some fix (#1337)
  2d6220e feat(packages/axe-core): some feature (#42)
  1d6220e ci: some ci change (#123)
  5d6220e BREAKING CHANGE: some breaking change (#124)
  6d6220e feat!: some breaking change (#126)
  7d6220e feat(package)!: some breaking change (#127)
`

export const expectedRawCommitList = [
  '061acd5 refactor(integrations/javascript): some refactor (#664)',
  '4d6220e chore: Update dependencies (#680)',
  '3d6220e fix(packages/axe-core): some fix (#1337)',
  '2d6220e feat(packages/axe-core): some feature (#42)',
  '1d6220e ci: some ci change (#123)',
  '5d6220e BREAKING CHANGE: some breaking change (#124)',
  '6d6220e feat!: some breaking change (#126)',
  '7d6220e feat(package)!: some breaking change (#127)'
]

export const rawRepositoryURL =
  'https://github.com/dequelabs/axe-api-team-public.git'

export const expectedRepositoryURL =
  'https://github.com/dequelabs/axe-api-team-public'

export const expectedParsedCommitList: Array<ParsedCommitList> = [
  {
    commit: '061acd5 refactor(integrations/javascript): some refactor (#664)',
    title: 'refactor(integrations/javascript): some refactor',
    sha: '061acd5',
    type: 'refactor',
    id: '664',
    link: `${expectedRepositoryURL}/pull/664`
  },
  {
    commit: '4d6220e chore: Update dependencies (#680)',
    title: 'chore: Update dependencies',
    sha: '4d6220e',
    type: 'chore',
    id: '680',
    link: `${expectedRepositoryURL}/pull/680`
  },
  {
    commit: '3d6220e fix(packages/axe-core): some fix (#1337)',
    title: 'fix(packages/axe-core): some fix',
    sha: '3d6220e',
    type: 'fix',
    id: '1337',
    link: `${expectedRepositoryURL}/pull/1337`
  },
  {
    commit: '2d6220e feat(packages/axe-core): some feature (#42)',
    title: 'feat(packages/axe-core): some feature',
    sha: '2d6220e',
    type: 'feat',
    id: '42',
    link: `${expectedRepositoryURL}/pull/42`
  },
  {
    commit: '1d6220e ci: some ci change (#123)',
    title: 'ci: some ci change',
    sha: '1d6220e',
    type: 'ci',
    id: '123',
    link: `${expectedRepositoryURL}/pull/123`
  },
  {
    commit: '5d6220e BREAKING CHANGE: some breaking change (#124)',
    title: 'BREAKING CHANGE: some breaking change',
    sha: '5d6220e',
    type: 'BREAKING CHANGE',
    id: '124',
    link: `${expectedRepositoryURL}/pull/124`
  },
  {
    commit: '6d6220e feat!: some breaking change (#126)',
    title: 'feat!: some breaking change',
    sha: '6d6220e',
    type: 'feat!',
    id: '126',
    link: `${expectedRepositoryURL}/pull/126`
  },
  {
    commit: '7d6220e feat(package)!: some breaking change (#127)',
    title: 'feat(package)!: some breaking change',
    sha: '7d6220e',
    type: 'feat!',
    id: '127',
    link: `${expectedRepositoryURL}/pull/127`
  }
]
