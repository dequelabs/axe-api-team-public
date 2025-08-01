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
name: Label Closed Issues with Date

on:
  issues:
    types: [closed]

jobs:
  label-closed-issues:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Label Closed Issues with Date on Close
        uses: ./.github/actions/label-closed-issues-with-date-v1
        with:
          issue-number: ${{ github.event.issue.number }}
          issue-organization: ${{ github.event.repository.owner.login }}
          issue-repo: ${{ github.event.repository.name }}
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
