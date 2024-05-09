interface InstallScriptParams {
  packageManager: 'npm' | 'yarn'
  pinStrategy: string
  latestAxeCoreVersion: string
  dependencyGroup: 'dependencies' | 'devDependencies'
}

export default function ({
  packageManager,
  pinStrategy,
  latestAxeCoreVersion,
  dependencyGroup
}: InstallScriptParams) {
  const newAxeVersion = `axe-core@${pinStrategy}${latestAxeCoreVersion}`

  if (packageManager === 'npm') {
    const dependencyTypeArgs = dependencyGroup === 'dependencies' ? [] : ['-D']
    return ['i', ...dependencyTypeArgs, newAxeVersion]
  } else if (packageManager === 'yarn') {
    const dependencyTypeArgs = dependencyGroup === 'dependencies' ? [] : ['-D']
    return ['add', ...dependencyTypeArgs, newAxeVersion]
  }

  throw new Error(`unsupported packageManager: ${packageManager}`)
}
