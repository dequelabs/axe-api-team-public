# Set DateClosed Field on Issue Close Action

This action updates the `DateClosed` project field when an issue is closed as completed. If an issue is reopened and closed again, the `DateClosed` field will reflect the latest date that it was closed.

## Prerequisites

Before using this action, you must:

1. **Create a custom field in your project**: 
   - Go to your GitHub project board
   - Add a new custom field named `DateClosed` 
   - Set the field type to **Date**
   - This field will store the date when issues are closed

2. **Set up environment variables**:
   - Add `PROJECT_NUMBER` as an environment variable in your GitHub repository settings
   - Set the value to your project number (e.g., `123`)

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `issue-number` | The issue number to check | Yes | - |
| `issue-organization` | The organization where the issue is located | Yes | - |
| `issue-repo` | The repository where the issue is located | Yes | - |
| `project-number` | The project number where the issue is located | Yes | - |
| `token` | A GitHub token with the required permissions | Yes | - |

## Usage

### Basic Usage

```yaml
name: Set DateClosed Field on Issue Close

on:
  issues:
    types: [closed]

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
          project-number: ${{ env.PROJECT_NUMBER }}
          token: ${{ secrets.PAT }} 
```

### Environment Variables

Make sure to set the following environment variable in your GitHub repository settings:

- `PROJECT_NUMBER`: The number of your GitHub project board (e.g., `123`)

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

## Setup Instructions

### Step 1: Create the DateClosed Custom Field

1. Navigate to your GitHub project board
2. Click on the "+" icon to add a new field
3. Select "Custom field"
4. Name the field `DateClosed`
5. Set the field type to **Date**
6. Save the field

### Step 2: Set Environment Variable

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Click on "Variables" tab
4. Add a new variable:
   - Name: `PROJECT_NUMBER`
   - Value: Your project number (e.g., `123`)
5. Save the variable

### Step 3: Configure the Workflow

Use the workflow example above, making sure to reference the environment variable: `${{ env.PROJECT_NUMBER }}`

## Requirements

- The project must have a field named `DateClosed` of type Date
- The issue must be added to the specified project board
- The GitHub token must have the necessary permissions to read and update project fields 
