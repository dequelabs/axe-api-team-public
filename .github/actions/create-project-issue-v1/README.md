# create-project-issue-v1

A GitHub Action to generate a github issue on a certain board in a certain column.

## Inputs

| Name             | Description                                                               | Required | Default             |
| ---------------- | ------------------------------------------------------------------------- | -------- | ------------------- |
| `github-token`   | The GitHub token, used for creating the issue and adding to project board | Yes      | NA                  |
| `title`          | The title of the issue                                                    | Yes      | NA                  |
| `body`           | The body of the issue                                                     | Yes      | NA                  |
| `repository`     | The repository to create the issue in                                     | No       | `github.repository` |
| `labels`         | Comma separated list of labels to add to the issue                        | No       | NA                  |
| `assignees`      | Comma separated list of assignees to add to the issue                     | No       | NA                  |
| `project_number` | The number of the project board to add the issue to                       | No       | `66`                |
| `column_name`    | The name of the column within the project board to add the issue to       | No       | `Backlog`           |

## Outputs

| Name        | Description                  |
| ----------- | ---------------------------- |
| `issue_url` | The URL of the created issue |

## Example usage

```yaml
uses: ./.github/actions/create-project-issue-v1
with:
  github-token: ${{ secrets.GITHUB_TOKEN }}
  title: 'My issue title'
  body: 'My issue body'
  labels: 'bug'
  assignees: 'user1,user2'
  env:
    # See permissions required in Permissions section below
    GH_TOKEN: ${{ secrets.PAT }}
```

## Permissions

This action requires the following permission scopes:

- `repo` - To create the issue within private repositories
- `workflow` - To access the `GITHUB_TOKEN` secret
- `write:org` - To add the issue to a project board
- `read:org` - To read the project board
- `project` - access to project board
