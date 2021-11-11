import getWorkspaceDir from "../utils/getWorkspaceDir"
import fs from "fs"
// @ts-ignore
import copy from "copy-dir"
import { loadModuleManifest } from "../utils/loadModuleManifest"
import { getModuleTaxonomy } from "../utils/getModuleTaxonomy"
import { getNearestPackage } from "../utils/getNearestPackage"
import inquirer from "inquirer"
import { exec } from "../utils/exec"
import rlm from "recursive-last-modified"

export const release = async () => {
  const workspaceDir = getWorkspaceDir()
  if (!fs.existsSync(workspaceDir)) {
    console.log(`No workspace found.`)
    process.exit(1)
  }

  const moduleManifest = loadModuleManifest()
  const { rimu, core, thirdparty } = getModuleTaxonomy(moduleManifest)
  const manifest = [rimu, ...core, ...thirdparty].filter(Boolean)
  const state = require(`${workspaceDir}/.state.json`)
  const { overrides } = state
  for (const moduleName in overrides) {
    console.log(`Reverting ${Object.keys(overrides).length} overrides for ${moduleName}`)
    overrides[moduleName].forEach((result: OverrideResult) => {
      fs.rmSync(result.dest)
      fs.copyFileSync(result.origin, result.dest)
    })
  }

  // Put all the modules out of the workspace
  for (const module of manifest) {
    console.log(`Unmounting ${module!.name}`)
    const srcDir = `${workspaceDir}/${module!.slug}`
    const destDir = module!.adminDir
    const mtime = rlm(srcDir)
    if (mtime > state.timestamp) {
      console.log(`Releasing changes...`)
      copy.sync(srcDir, destDir)
    }    
  }

  // Merge any new dependencies back in
  const merged = require(`${workspaceDir}/package-merged.json`).dependencies
  const current = require(`${workspaceDir}/../../package.json`).dependencies

  type Tuple = Array<string | null | undefined>
  let added: Array<Tuple> = []
  let updated: Array<Tuple> = []
  let removed: Array<Tuple> = []

  for (const packageName in current) {
    const currentVersion = current[packageName] ?? null
    const priorVersion = merged[packageName] ?? null
    const packageData: Tuple = [packageName, currentVersion, priorVersion]
    if (!priorVersion) {
      added.push(packageData)
    } else if (priorVersion !== currentVersion) {
      updated.push(packageData)
    }
  }
  for (const packageName in merged) {
    const currentVersion = current[packageName] ?? null
    if (!currentVersion) {
      removed.push([packageName, null])
    }
  }

  console.log(`Reverting package.json to its original state`)
  fs.copyFileSync(
    `${workspaceDir}/package-original.json`,
    `${workspaceDir}/../../package.json`
  )
  while (added.length || updated.length || removed.length) {
      let choices: Array<{
      name: string | null | undefined,
      value?: string,
      checked: boolean
    }> = []

    if (added.length) {
      choices.push(new inquirer.Separator(`=== New ===`))
      choices = [...choices, ...added.map(([name, ver]) => ({
        name,
        value: `add--${name}@${ver}`,
        checked: true
      }))]
    }
    if (updated.length) {
      choices.push(new inquirer.Separator(`=== Updated ===`))
      choices = [...choices, ...updated.map(([name, curr, prev]) => ({
        name: `${name} (${prev} => ${curr})`,
        value: `update--${name}@${curr}`,
        checked: true
      }))]
    }
    if (removed.length) {
      choices.push(new inquirer.Separator(`=== Removed ===`))
      choices = [...choices, ...removed.map(([name]) => ({
        name,
        value: `remove--${name}`,
        checked: true
      }))]
    }

    const answers = await inquirer.prompt([
      {
        name: `module`,
        type: `list`,
        message: `
The dependency graph has changed since you created the workspace. Select a module to export the depdencies to
`,
        choices: [`<project>`, ...manifest.map(m => m?.name)]
      },
      {
        name: `packages`,
        type: `checkbox`,
        message: `
Choose the packages you want to export
`,
        choices,
      },

    ])
    let dir
    if (answers.module === `<project>`) {
      dir = process.cwd()
    } else {      
      const mod = moduleManifest.byName(answers.module)
      if (!mod || !mod.adminDir) {
        console.error(`Invlaid module: ${answers.module}`)
        process.exit(1)
      }
      dir = getNearestPackage(mod.adminDir)  
    }
    const updateStrs: Array<string> = []
    const removeStrs: Array<string> = []
    answers.packages.forEach((answer: string) => {
      const [ type, identifier ] = answer.split(`--`)
      const [ name ] = identifier.split(`@`)
      if (type === `remove`) {
        removeStrs.push(name)
        removed = removed.filter(([packageName]) => packageName !== name)
      } else if (type === `update`) {
        updateStrs.push(identifier)
        updated = updated.filter(([packageName]) => packageName !== name)
      } else if (type === `add`) {
        updateStrs.push(identifier)
        added = added.filter(([packageName]) => packageName !== name)
      }
    })

    if (updateStrs.length) {
      await exec(`cd ${dir} && yarn add ${updateStrs.join(" ")}`)
    }
    if (removeStrs.length) {
      await exec(`cd ${dir} && yarn remove ${removeStrs.join(" ")}`)
    }
  }
  console.log(`Done!`)
  process.exit(0)
}
