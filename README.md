# axe-api-team-public

Shared configuration, settings, and actions for the Axe API Team

## Directory Structure

All GitHub actions should be added to the `.github/actions` directory in their own directory. The name of the directory should be the name of the action with the version number appended to it. For example, the semantic pr title action would live in a directory named `semantic-pr-title-v1`. This allows us to create breaking changes to actions by creating a new directory instead of creating one-off branches for each action.

Actions that depend on 3rd party npm modules should install the module at the root `package.json` of the repo. If a breaking change to an action also requires installing a breaking change to a dependency, install the old version under an alias (e.g. `npm install pkg-v1@npm:pkg@1`) and the new version without alias.

## Probot Settings

Each repo should extend the [Probot Settings](https://probot.github.io/apps/settings/) file by creating a `.github/settings.yml` file which uses the `_extends` keyword where the value is the \<org\>/\<repo\> path to this repo.

```yml
_extends: "dequelabs/axe-api-team-public"
```