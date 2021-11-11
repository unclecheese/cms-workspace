import glob from "glob"
import getProjectDir from "./getProjectDir"
import path from "path"

export const loadModuleManifest = (): ModuleManifest => {
  const moduleByName: ModuleByName = new Map()
  const moduleByDir: ModuleByDir = new Map()


  const modules = glob
    .sync(`${getProjectDir()}/**/composer.json`, { absolute: true })
    .map(file => {
      const composerData = require(file)
      const { name, type, extra } = composerData
      const baseDir = path.dirname(file)
      const adminPath = extra?.adminPath
      return {
        baseDir,
        dependencies: [...Object.keys(composerData.require ?? {})],
        name,
        type,
        slug:
          path.dirname(file) === getProjectDir()
            ? `_project`
            : name
            ? name.replace(`/`, `-`)
            : ``,
        adminPath,
        adminDir: `${baseDir}/${adminPath}`
      }
    })
    .filter(({ type, adminPath, baseDir }) => {
      if (!adminPath) {
        return false
      }
      if (baseDir === getProjectDir()) {
        return true
      }
      return [`silverstripe-vendormodule`, `silverstripe-recipe`].includes(type)
    })
    modules.forEach(data => {
      moduleByName.set(data.name, { ...data })
      moduleByDir.set(data.baseDir, { ...data })
    })
    
    return {
      modules,
      byName(name: string) {
        return moduleByName.get(name)
      },
      byDirectory(dir: string) {
        return moduleByDir.get(dir)
      }
    }
}