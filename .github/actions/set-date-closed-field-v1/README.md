# Set Closed Date Field on Issue Close Action

This action updates a date project field (default: `DateClosed`) when an issue is closed as completed. If an issue is reopened and closed again, the field will reflect the latest date that it was closed.

## Quick Reference

| Input                | Description                                               | Required | Default      |
| -------------------- | --------------------------------------------------------- | -------- | ------------ |
| `token`              | PAT with required permissions (see below)                 | Yes      | -            |
| `issue-number`       | The issue number to check                                 | Yes      | -            |
| `issue-organization` | The organization where the issue is located               | No       | -            |
| `issue-repo`         | The repository where the issue is located                 | No       | -            |
| `project-number`     | The project number where the issue is located             | Yes      | -            |
| `date-field-name`    | The name of the date field to update the issue close date | No       | `DateClosed` |

**Requirements:**

- A custom date field (Date type) in your project (default name: `DateClosed`)
- A Personal Access Token with `repo`, `read:org`, `write:org`, and `project` scopes
- Issue must be added to the specified project board

## Setup

### 1. Create the Date Custom Field

1. Navigate to your GitHub project board
2. Click the "+" icon to add a new field
3. Select "Custom field"
4. Name the field `DateClosed` (or your preferred name) and set type to **Date**
5. Save the field

### 2. Create Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Project Board Access")
4. Select required scopes: `repo`, `write:org`, `read:org`, `project`
5. Generate and copy the token immediately

### 3. Add Token to Repository Secrets

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `PAT`, Value: your token
4. Click "Add secret"

### 4. Find Your Project Number

**From GitHub UI:** Look at your project URL: `https://github.com/orgs/YOUR_ORG/projects/PROJECT_NUMBER`

**Using GitHub CLI:**

```bash
gh project list --owner YOUR_ORG_OR_USERNAME
```

## Usage

```yaml
name: Set Closed Date Field on Issue Close Action

on:
  issues:
    types: [closed]
    # Consider adding conditions to only trigger on completed issues

jobs:
  set-date-closed:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set closed date field
        uses: dequelabs/axe-api-team-public/.github/actions/set-date-closed-field-v1@main
        with:
          issue-number: ${{ github.event.issue.number }}
          issue-organization: ${{ github.event.repository.owner.login }}
          issue-repo: ${{ github.event.repository.name }}
          project-number: '123' # Replace with your project number
          date-field-name: 'MyCustomDateField'
          token: ${{ secrets.PAT }}
```

**Important:** The default `GITHUB_TOKEN` will not work for project operations. You must use a PAT as shown above.

## How It Works

1. **Issue Check** - Gets the issue details using the provided parameters
2. **Closed Status Check** - Verifies the issue is closed and has a `closed_at` date
3. **Project Item Lookup** - Finds the issue in the specified project board
4. **Date Field Update** - Updates the specified date field (default: `DateClosed`) with the close date in YYYY-MM-DD format
5. **Re-closing Support** - If an issue is reopened and closed again, the field reflects the latest close date

## Troubleshooting

### "Failed to get \<field name\> field ID"

**Causes:**

- Incorrect project number
- The specified date field doesn't exist in the project
- Token lacks project access
- Project is in a different organization

**Solutions:**

1. Verify project number using: `gh project list --owner YOUR_ORG`
2. Check if the field exists: `gh project field-list PROJECT_NUMBER --owner YOUR_ORG --format json`
3. Ensure PAT has all required scopes
4. Confirm project organization matches your expectations

### General Debugging Tips

- **Test project access:** Use GitHub CLI commands locally with your PAT to verify access
- **Check issue location:** Ensure the issue exists in the specified organization/repository
- **Verify project membership:** Confirm the issue is actually added to the project board
- **Consider workflow conditions:** Add logic to only trigger on issues closed as "completed" rather than "not planned"
