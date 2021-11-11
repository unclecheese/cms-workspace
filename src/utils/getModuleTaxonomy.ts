import { getDependenciesForModule } from "./getDependenciesForModule"

let rimuModule: Module | null = null
const coreModules: Array<Module> = []
const thirdpartyModules: Array<Module> = []

export const getModuleTaxonomy = (
  manifest: ModuleManifest,
) => {
  const recipeComposers = manifest.modules.filter(
    ({ type }) => type === `silverstripe-recipe`
  )

  const recipeModules = recipeComposers.reduce(
    (acc: Array<string>, curr: Module) => {
      return [
        ...new Set<string>([
          ...acc,
          ...getDependenciesForModule(manifest, curr.name),
        ]),
      ]
    },
    []
  )

  manifest.modules.forEach(module => {
    const { name, type } = module
    const mod = { ...module }

    if (name === `unclecheese/silverstripe-rimu`) {
      rimuModule = mod
    } else if (recipeModules.includes(name)) {
      coreModules.push(mod)
    } else if (type === `silverstripe-vendormodule`) {
      thirdpartyModules.push(mod)
    }
  })
  return {
    rimu: rimuModule,
    core: coreModules,
    thirdparty: thirdpartyModules,
  }
}
