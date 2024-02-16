interface InstallScriptParams {
  packageManager: string
  pinStrategy: string
  latestAxeCoreVersion: string
  dependencyType: string
}

// https://github.com/yarnpkg/yarn/issues/5228
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

  // <comment about weird Yarn behavior>
  // @see https://github.com/yarnpkg/yarn/issues/5228
  return dependencyType === '-D'
    ? ['add', newAxeVersion, '-D']
    : ['add', newAxeVersion]
}
