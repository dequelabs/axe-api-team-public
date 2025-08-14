# Set DateClosed Field on Issue Close Action

This action updates the `DateClosed` project field when an issue is closed as completed. If an issue is reopened and closed again, the `DateClosed` field will reflect the latest date that it was closed.

## Prerequisites

Before using this action, you must:

1. **Create a custom field in your project**:

   - Go to your GitHub project board
   - Add a new custom field named `DateClosed`
   - Set the field type to **Date**
   - This field will store the date when issues are closed

2. **Note**: The project number should be hardcoded in your workflow file, not set as an environment variable

## Inputs

| Input                | Description                                   | Required | Default |
| -------------------- | --------------------------------------------- | -------- | ------- |
| `issue-number`       | The issue number to check                     | Yes      | -       |
| `issue-organization` | The organization where the issue is located   | Yes      | -       |
| `issue-repo`         | The repository where the issue is located     | Yes      | -       |
| `project-number`     | The project number where the issue is located | Yes      | -       |
| `token`              | A GitHub token with the required permissions  | Yes      | -       |

## Usage

### Basic Usage

```yaml
name: Set DateClosed Field on Issue Close

on:
  issues:
    types: [closed]
    # Optional: Add conditions to only trigger on completed issues
    # This can be configured based on your specific needs

jobs:
  set-date-closed:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set DateClosed Field on Issue Close
        uses: ./.github/actions/set-date-closed-field-v1
        with:
          issue-number: ${{ github.event.issue.number }}
          issue-organization: ${{ github.event.repository.owner.login }}
          issue-repo: ${{ github.event.repository.name }}
          project-number: '123'
          token: ${{ secrets.PAT }}
```

### Project Number

The project number should be hardcoded directly in your workflow file. For example, if your project number is 123, use `project-number: '123'` in the action inputs.

### Permissions

This action requires the following permission scopes:

- `repo` - To access the issue within private repositories
- `workflow` - To access the `GITHUB_TOKEN` secret
- `write:org` - To update project fields
- `read:org` - To read the project board
- `project` - access to project board

## How It Works

1. **Issue Check**: Gets the issue details using the provided issue number, organization, and repository
2. **Closed Status Check**: Checks if the issue is closed and has a `closed_at` date
3. **Project Item Lookup**: Finds the issue in the specified project board
4. **DateClosed Field Update**: If the issue is closed and in the project, updates the `DateClosed` field with the close date in YYYY-MM-DD format
5. **Re-closing**: If an issue is reopened and closed again, the `DateClosed` field is updated to reflect the latest close date

**Note**: This action should be configured to only trigger when an issue is closed as completed, not when it's closed as "not planned" or other non-completion reasons. This can be achieved by configuring the workflow trigger appropriately.

## Troubleshooting

### Finding Your Project Number

If you're getting errors about the project not being found, you can find your project number by:

1. **Using GitHub CLI** (if you have it installed):

   ```bash
   gh project list --owner YOUR_ORG_OR_USERNAME
   ```

2. **From the GitHub UI**:

   - Go to your GitHub project board
   - Look at the URL: `https://github.com/orgs/YOUR_ORG/projects/PROJECT_NUMBER`
   - The PROJECT_NUMBER is what you need

3. **Check project access**:
   - Make sure the GitHub token has access to the project
   - Verify the project exists and is accessible

### Verifying the DateClosed Field

To check if the DateClosed field exists in your project:

```bash
gh project field-list PROJECT_NUMBER --owner YOUR_ORG_OR_USERNAME --format json
```

Look for a field named `DateClosed` with type `Date`. If it doesn't exist, create it following the setup instructions above.

### Common Error: "Failed to get DateClosed field ID"

This error usually means:

1. The project number is incorrect
2. The DateClosed field doesn't exist in the project
3. The GitHub token doesn't have access to the project
4. The project is in a different organization than expected

### Common Error: "gh: To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable"

This error occurs when the GitHub CLI (`gh`) command doesn't have proper authentication. The action should handle this automatically, but if you see this error:

1. **Check your token permissions**: Make sure your `PAT` token has:

   - `read:org` - To read the project board
   - `write:org` - To update project fields
   - `project` - To access project boards

2. **Verify project access**: Ensure the token has access to the specific project you're trying to use

3. **Check project number**: Verify the project number exists and is accessible:

   ```bash
   gh project list --owner dequelabs
   ```

4. **Test manually**: Try running the command manually to see the exact error:
   ```bash
   gh project field-list 188 --owner dequelabs --format json
   ```

## Setup Instructions

### Step 1: Create the DateClosed Custom Field

1. Navigate to your GitHub project board
2. Click on the "+" icon to add a new field
3. Select "Custom field"
4. Name the field `DateClosed`
5. Set the field type to **Date**
6. Save the field

### Step 2: Configure the Workflow

Use the workflow example above, making sure to hardcode your project number in the `project-number` input field.

**Important**: Consider configuring your workflow to only trigger when issues are closed as completed, not when they're closed for other reasons (e.g., "not planned", "duplicate", etc.). This can be done by adding appropriate conditions to your workflow trigger or by using issue labels to distinguish between different types of closure.

## Requirements

- The project must have a field named `DateClosed` of type Date
- The issue must be added to the specified project board
- The GitHub token must have the necessary permissions to read and update project fields
