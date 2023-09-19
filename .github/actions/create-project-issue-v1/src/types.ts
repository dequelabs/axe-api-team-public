import core from '@actions/core'
import github from '@actions/github'

export type Core = Pick<
  typeof core,
  'getInput' | 'setFailed' | 'info' | 'warning' | 'setOutput'
>
export type GitHub = Pick<typeof github, 'getOctokit' | 'context'>

type Nodes = {
  id: string
  name: string
  options: Omit<Nodes, 'options'>[]
}

export type GraphQlQueryResponseData = {
  organization: {
    projectV2: {
      id: string
      fields: {
        nodes: Nodes[]
      }
    }
  }
}
