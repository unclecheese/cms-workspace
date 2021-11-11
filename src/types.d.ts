declare  module "inquirer"
declare  module "recursive-last-modified"
interface Module {
    baseDir: string
    dependencies: Array<string>
    name: string
    type: "silverstripe-recipe" | "silverstripe-vendormodule" | "project"
    slug: string
    adminPath: string
    adminDir?: string
  }
  
  interface StringMap {
    [key: string]: string
  }
  
  interface Dependencies {
    dependencies: StringMap
    devDependencies: StringMap
    peerDependencies: StringMap
  }

  type ModuleByName = Map<string, Module>
  type ModuleByDir = Map<string, Module>

  type ModuleManifest = {
      modules: Array<Module>
      byName: (name: string) => Module | undefined
      byDirectory: (name: string) => Module | undefined
  }

  type OverrideResult = {
    src: string
    dest: string
    origin: string
  }
  
  type OverrideState = {
    [key: string]: Array<OverrideResult>
  }
  
