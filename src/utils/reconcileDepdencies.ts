export const reconcileDependencies = (
  allDependencies: Dependencies,
  localPackage: Dependencies
) => {
  for (const k in allDependencies) {
    const dependencyType = k as keyof Dependencies
    const incomingDeps = allDependencies[dependencyType] ?? {}
    const localDeps = localPackage[dependencyType] ?? {}
    for (const d in incomingDeps) {
      if (localDeps[d] && localDeps[d] !== incomingDeps[d]) {
        throw new Error(`
Package ${d} required by the workspace is in conflict with 
local dependency. You will need to remove it from your package.json in ${dependencyType}
or change the version constraint to match that of the workspace.

(Yours: ${localDeps[d]} Workspace: ${incomingDeps[d]})

            `)
      }

      localDeps[d] = incomingDeps[d]
    }
    localPackage[dependencyType] = {
      ...localDeps,
    }
  }

  // Remove duplicates across dev/peer
  for (const k in localPackage.dependencies) {
    delete localPackage.devDependencies[k]
    delete localPackage.peerDependencies[k]
  }
}
