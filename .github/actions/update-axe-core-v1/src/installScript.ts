interface InstallScriptParams {
  packageManager: 'npm' | 'yarn' | 'pnpm'
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
  // yarn and pnpm share the same `add` command and `-D` flag
  } else if (packageManager === 'yarn' || packageManager === 'pnpm') {
    const dependencyTypeArgs = dependencyGroup === 'dependencies' ? [] : ['-D']
    return ['add', ...dependencyTypeArgs, newAxeVersion]
  }

  throw new Error(`unsupported packageManager: ${packageManager}`)
}
