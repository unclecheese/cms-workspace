import getWorkspaceDir from "./getWorkspaceDir"
// @ts-ignore
import copy from "copy-dir"
import fs from "fs"
import glob from "glob"
import path from "path"

type Result = {
  src: string
  dest: string
  origin: string
}

type Results = {
  [key: string]: Array<Result>
}

export const installModules = (
  manifest: Array<Module>,
  projectModule: Module
): Results => {
  const workspaceDir = getWorkspaceDir()
  const externalModules = manifest.filter(m => m !== projectModule)

  // Put all the modules in the workspace
  for (const module of externalModules) {
    const destDir = `${workspaceDir}/${module.slug}`
    copy.sync(module.adminDir!, destDir)
  }

  let results: Results = {}
  for (const authoritativeModule of manifest) {
    for (const targetModule of externalModules) {
      const overrideDir = path.join(
        workspaceDir,
        authoritativeModule.slug,
        targetModule.slug
      )
      if (!fs.existsSync(overrideDir)) {
        continue
      }
      results[targetModule.name] = []
      const targetDir = `${workspaceDir}/${targetModule.slug}`
      const mergableFiles = glob.sync(`${overrideDir}/**/*.{js,jsx,ts,tsx}`, {
        absolute: true,
      })
      for (const overrideFile of mergableFiles) {
        const stem = path.relative(overrideDir, overrideFile)
        const fileOverridden = path.join(targetDir, stem)
        fs.rmSync(fileOverridden)
        fs.symlinkSync(overrideFile, fileOverridden)
        results[targetModule.name].push({
          src: overrideFile,
          dest: fileOverridden,
          origin: path.join(targetModule.adminDir!, stem) 
        })
      }
    }
  }

  return results
}
