import core from '@actions/core'
import github from '@actions/github'

export type Core = Pick<
  typeof core,
  'getInput' | 'setOutput' | 'info' | 'setFailed'
>
export type GitHub = Pick<typeof github, 'context' | 'getOctokit'>

export interface Field {
  id: string
  name: string
  type: string
  options: Omit<Field, 'options' | 'type'>[]
}
export interface LabelNode {
  name: string
}
export interface projectItemsNode {
  id: string
  project: {
    number: number
  }
}
export interface IssueNodes {
  repository: {
    issue: {
      id: string
      number: number
      url: string
      labels: {
        nodes: LabelNode[]
      }
      projectItems: {
        nodes: projectItemsNode[]
      }
    }
  }
}
