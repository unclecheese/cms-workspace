import fs from "fs"
import { exec } from "../utils/exec"
// @ts-ignore
import copy from "copy-dir"
import path from "path"
import getWorkspaceDir from "../utils/getWorkspaceDir"
import { loadModuleManifest } from "../utils/loadModuleManifest"
import { getModuleTaxonomy } from "../utils/getModuleTaxonomy"
import { installModules } from "../utils/installModules"
import { createBootstrapFile } from "../utils/createBootstrapFile"
import { collectDependencies } from "../utils/collectDependencies"
import { reconcileDependencies } from "../utils/reconcileDepdencies"
import getProjectDir from "../utils/getProjectDir"
import { getComposerHash } from "../utils/getComposerHash"
import { release } from "./release"

export const create = async () => {
  const workspaceDir = getWorkspaceDir()
  const composerHash = getComposerHash()
  if (fs.existsSync(workspaceDir)) {
    const state = require(`${workspaceDir}/.state.json`)
    const prevHash = state.composerHash ?? null
    if (prevHash === composerHash) {
      console.log(`No change to composer.lock. Keeping workspace`)
      process.exit(0)
    } else {
      console.log(`composer.lock has changed. Rebuilding workspace...`)
      await release()
    }
  } else {
    console.log(`No workspace found. Creating...`)
    fs.mkdirSync(workspaceDir)    
  }

  const projectAdminDir = process.cwd()

  const projectModule: Module = {
    adminDir: projectAdminDir,
    slug: `_project`,
    baseDir: projectAdminDir,
    name: `_project`,
    dependencies: [],
    adminPath: ``,
    type: `project`,
  }

  const moduleManifest = loadModuleManifest()

  const { rimu, core, thirdparty } = getModuleTaxonomy(moduleManifest)

  const state: { [key: string]: unknown } = {
    overrides: {},
  }

  const manifest = [
    rimu,
    ...core,
    ...thirdparty,
    projectModule,
  ].filter(Boolean) as Array<Module>

  console.log(`Found ${moduleManifest.modules.length} modules to add to the workspace`)

  const overrideResults = installModules(manifest, projectModule)
  for (const moduleName in overrideResults) {
    overrideResults[moduleName].forEach(result => {
      console.log(`
      [OVERRIDE]: ${path.relative(workspaceDir, result.dest)}
        ---> ${path.relative(getProjectDir(), result.src)}
      `)
    })
  }

  state.overrides = overrideResults

  console.log(`Creating bootstrap file`)
  createBootstrapFile(manifest)

  fs.copyFileSync(
    `${rimu!.baseDir}/tailwind.config.js`,
    `${projectModule!.adminDir}/tailwind.config.js`
  )
  fs.copyFileSync(
    `${rimu!.baseDir}/craco.config.js`,
    `${projectModule!.adminDir}/craco.config.js`
  )

  const localPackagePath = `${projectModule.baseDir}/package.json`
  if (!fs.existsSync(localPackagePath)) {
    throw new Error(`Local module ${projectModule.slug} has no package.json`)
  }
  const localPackage = require(localPackagePath) as Dependencies

  fs.copyFileSync(localPackagePath, `${workspaceDir}/package-original.json`)

  console.log(`Backed up package.json to package-original.json`)

  const allDependencies = collectDependencies(manifest)
  reconcileDependencies(allDependencies, localPackage)

  fs.writeFileSync(localPackagePath, JSON.stringify(localPackage, null, 4))
  console.log(`Wrote new temporary package.json`)

  fs.writeFileSync(
    `${workspaceDir}/package-merged.json`,
    JSON.stringify(localPackage, null, 4)
  )
  console.log(`Backed up merged package.json`)
  
  state.timestamp = +new Date()
  state.composerHash = composerHash

  fs.writeFileSync(
    `${workspaceDir}/.state.json`,
    JSON.stringify(state, null, 4)
  )

  console.log(`Installing dependencies...`)
  await exec(`yarn install`)
  process.exit(0)
}
