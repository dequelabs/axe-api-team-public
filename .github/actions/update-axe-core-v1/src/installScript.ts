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
  if (packageManager !== 'yarn') {
    return [
      'i',
      `axe-core@${pinStrategy}${latestAxeCoreVersion}`,
      dependencyType
    ]
  }

  if (dependencyType !== '-D') {
    return ['add', `axe-core@${pinStrategy}${latestAxeCoreVersion}`]
  }

  return ['add', `axe-core@${pinStrategy}${latestAxeCoreVersion}`, '-D']
}
