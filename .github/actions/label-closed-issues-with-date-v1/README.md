# Label Closed Issues with Date Action

This action labels issues on close with date they are closed on. If they are opened back up and closed again the date will be set to the last date closed.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `issue-number` | The issue number to check | Yes | - |
| `issue-organization` | The organization where the issue is located | Yes | - |
| `issue-repo` | The repository where the issue is located | Yes | - |
| `token` | A GitHub token with the required permissions | Yes | - |

## Usage

### Basic Usage

```yaml
- name: Label Closed Issues with Date
  uses: ./.github/actions/label-closed-issues-with-date-v1
  with:
    issue-number: 123
    issue-organization: result-team
    issue-repo: my-project
    token: ${{ secrets.PAT }}
```

### Cross-Repository Usage

This action can be used to check issues from any repository:

```yaml
- name: Label Closed Issues from Jazzband
  uses: ./.github/actions/label-closed-issues-with-date-v1
  with:
    issue-number: 456
    issue-organization: jazzband
    issue-repo: some-repo
    token: ${{ secrets.PAT }}

- name: Label Closed Issues from Walnut
  uses: ./.github/actions/label-closed-issues-with-date-v1
  with:
    issue-number: 789
    issue-organization: walnut
    issue-repo: another-repo
    token: ${{ secrets.PAT }}
```

## How It Works

1. **Issue Check**: Gets the issue details using the provided issue number, organization, and repository
2. **Closed Status Check**: Checks if the issue is closed and has a `closed_at` date
3. **Label Cleanup**: Removes any existing labels that start with "Closed:" to ensure only one date label exists
4. **Date Label**: If closed, adds a label with the format `Closed: YYYY-MM-DD` (e.g., `Closed: 2024-01-15`)
5. **Re-closing**: If an issue is reopened and closed again, the old date label is removed and replaced with the latest close date

## Label Format

The action adds labels in the format: `Closed: YYYY-MM-DD`

Examples:
- `Closed: 2024-01-15`
- `Closed: 2024-03-22`
- `Closed: 2024-12-31`

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run fmt
```

## License

MPL-2.0 
