export const getDependenciesForModule = (
    manifest: ModuleManifest,
    moduleName: string,
    parentName: string | null = null
  ) => {
    const data = manifest.byName(moduleName)
    if (!data) {
      return []
    }
    let deps = [...data.dependencies]
    data.dependencies
      .filter(d => d !== parentName)
      .forEach(d => {
        deps = deps.concat(getDependenciesForModule(manifest, d, moduleName))
      })

    return [...new Set(deps)]
  }