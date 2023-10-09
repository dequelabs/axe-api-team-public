import type { ParsedCommitList } from './types'
import dedent from 'dedent'

export const rawCommitList = dedent`
  061acd5 refactor(integrations/javascript): some refactor (#664)
  4d6220e chore: Update dependencies (#680)
  3d6220e fix(packages/axe-core): some fix (#1337)
  2d6220e feat(packages/axe-core): some feature (#42)
  1d6220e ci: some ci change (#123)
  6d6220e feat!: some breaking change (#126)
  7d6220e feat(package)!: some breaking change (#127)
  1c41b7a1 revert: feat: awesome feature (#3957) (#3988)
  4d6220e chore: release v1.0.0
  5d6220e chore: release v1.0.1
  5d6220e5d6220e chore: release a long commit SHA
`

export const expectedRawCommitList = [
  '061acd5 refactor(integrations/javascript): some refactor (#664)',
  '4d6220e chore: Update dependencies (#680)',
  '3d6220e fix(packages/axe-core): some fix (#1337)',
  '2d6220e feat(packages/axe-core): some feature (#42)',
  '1d6220e ci: some ci change (#123)',
  '6d6220e feat!: some breaking change (#126)',
  '7d6220e feat(package)!: some breaking change (#127)',
  '1c41b7a1 revert: feat: awesome feature (#3957) (#3988)',
  '4d6220e chore: release v1.0.0',
  '5d6220e chore: release v1.0.1',
  '5d6220e5d6220e chore: release a long commit SHA'
]

export const expectedRepository = 'dequelabs/axe-api-team-public'

export const expectedParsedCommitList: Array<ParsedCommitList> = [
  {
    commit: '061acd5 refactor(integrations/javascript): some refactor (#664)',
    title: 'refactor(integrations/javascript): some refactor',
    sha: '061acd5',
    type: 'refactor',
    id: '664',
    link: `https://github.com/${expectedRepository}/pull/664`
  },
  {
    commit: '4d6220e chore: Update dependencies (#680)',
    title: 'chore: Update dependencies',
    sha: '4d6220e',
    type: 'chore',
    id: '680',
    link: `https://github.com/${expectedRepository}/pull/680`
  },
  {
    commit: '3d6220e fix(packages/axe-core): some fix (#1337)',
    title: 'fix(packages/axe-core): some fix',
    sha: '3d6220e',
    type: 'fix',
    id: '1337',
    link: `https://github.com/${expectedRepository}/pull/1337`
  },
  {
    commit: '2d6220e feat(packages/axe-core): some feature (#42)',
    title: 'feat(packages/axe-core): some feature',
    sha: '2d6220e',
    type: 'feat',
    id: '42',
    link: `https://github.com/${expectedRepository}/pull/42`
  },
  {
    commit: '1d6220e ci: some ci change (#123)',
    title: 'ci: some ci change',
    sha: '1d6220e',
    type: 'ci',
    id: '123',
    link: `https://github.com/${expectedRepository}/pull/123`
  },
  {
    commit: '6d6220e feat!: some breaking change (#126)',
    title: 'feat!: some breaking change',
    sha: '6d6220e',
    type: 'feat!',
    id: '126',
    link: `https://github.com/${expectedRepository}/pull/126`
  },
  {
    commit: '7d6220e feat(package)!: some breaking change (#127)',
    title: 'feat(package)!: some breaking change',
    sha: '7d6220e',
    type: 'feat!',
    id: '127',
    link: `https://github.com/${expectedRepository}/pull/127`
  },
  {
    commit: '1c41b7a1 revert: feat: awesome feature (#3957) (#3988)',
    title: 'revert: feat: awesome feature (#3957)',
    sha: '1c41b7a1',
    type: 'revert',
    id: '3988',
    link: `https://github.com/${expectedRepository}/pull/3988`
  },
  /* For cases where `getFallbackId` cannot find the PR ID, we'll return null. */
  {
    commit: '4d6220e chore: release v1.0.0',
    title: 'chore: release v1.0.0',
    sha: '4d6220e',
    type: 'chore',
    id: null,
    link: null
  },
  /* For cases where `getFallbackId` can find the PR ID, we'll return it. */
  {
    commit: '5d6220e chore: release v1.0.1',
    title: 'chore: release v1.0.1',
    sha: '5d6220e',
    type: 'chore',
    id: '456',
    link: `https://github.com/${expectedRepository}/pull/456`
  },
  {
    commit: '5d6220e5d6220e chore: release a long commit SHA',
    title: 'chore: release a long commit SHA',
    sha: '5d6220e5d6220e',
    type: 'chore',
    id: null,
    link: null
  }
]
