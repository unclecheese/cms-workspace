import glob from "glob"
import path from "path"
import fs from "fs"
import getWorkspaceDir from "./getWorkspaceDir"

export const createBootstrapFile = (manifest: Array<Module>) => {
  const bootstraps = manifest
    .map(module => {
      const files = glob.sync(`${module.adminDir}/_config.{ts,js}`, {
        absolute: true,
      })
      if (!files.length) {
        return null
      }
      if (files.length > 1) {
        console.error(
          `Multiple boot files found at ${module.adminDir}. Using the first one only.`
        )
      }
      const file = files[0]
      const basename = path.parse(file).name
      return `import('./${module.slug}/${basename}').then((m: any) => m.default && m.default())`
    })
    .filter(Boolean)

  const importCode = `
    export default async () => {
    await Promise.all([
    ${bootstraps.join(",\n\t\t")}
    ])
    }
    `

  fs.writeFileSync(`${getWorkspaceDir()}/_config.ts`, importCode)
}
