interface InstallScriptParams {
  packageManager: string
  pinStrategy: string
  latestAxeCoreVersion: string
  dependencyType: string
}

export default function ({
  packageManager,
  pinStrategy,
  latestAxeCoreVersion,
  dependencyType
}: InstallScriptParams) {
const newAxeVersion = `axe-core@${pinStrategy}${latestAxeCoreVersion}`

  if (packageManager !== 'yarn') {
    return ['i', newAxeVersion, dependencyType]
  }

  // When running using a child process it considers 
  // an empty string a value and returns an error
  // @see https://github.com/yarnpkg/yarn/issues/5228
  return dependencyType === '-D'
    ? ['add', newAxeVersion, '-D']
    : ['add', newAxeVersion]
}
