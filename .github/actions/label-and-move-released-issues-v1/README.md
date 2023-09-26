# label-and-move-released-issues-v1

This action labels and moves issues that have been released to the `released` column of a project board.

## Inputs

| Name                  | Required | Description                                                          | Default              |
| --------------------- | -------- | -------------------------------------------------------------------- | -------------------- |
| `commit-list`         | Yes      | The list of commits generated from the "Generate commit list" action | NA                   |
| `version`             | Yes      | The version number of the release                                    | NA                   |
| `project-number`      | No       | The project number of the project board                              | `66`                 |
| `project-board-title` | No       | The title of the project board                                       | `Axe API Team Board` |

## Permissions

This action requires the following permission scopes:

- `repo` - To create the issue within private repositories
- `workflow` - To access the `GITHUB_TOKEN` secret
- `write:org` - To add the issue to a project board
- `read:org` - To read the project board
- `project` - access to project board
