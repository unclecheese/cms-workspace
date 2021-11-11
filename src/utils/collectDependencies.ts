import fs from "fs"

export const collectDependencies = (manifest: Array<Module>): Dependencies => {
    return manifest.reverse().reduce(
    (mergedDeps: Dependencies, module: Module): Dependencies => {
      const packageJsonPath = `${module.baseDir}/package.json`
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`Module ${module.slug} has no package.json`)
      }
      const packageJson = require(packageJsonPath) as Dependencies
      const {
        dependencies = {},
        devDependencies = {},
        peerDependencies = {},
      } = packageJson
      return {
        dependencies: {
          ...mergedDeps.dependencies,
          ...dependencies,
        },
        devDependencies: {
          ...mergedDeps.devDependencies,
          ...devDependencies,
        },
        peerDependencies: {
          ...mergedDeps.peerDependencies,
          ...peerDependencies,
        },
      }
    },
    {
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
    } as Dependencies
  )
  
}