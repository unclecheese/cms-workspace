#! /usr/bin/env node

;(async () => {
    const commands: { [command: string]: () => Promise<any> } = {
      "create": () =>
        import("./commands/create").then(i => i.create()),
      "release": () =>
        import("./commands/release").then(i => i.release()),
    }
    const commandName = process.argv[2]
    const command = commands[commandName] ?? null
  
    if (!command) {
      console.log(`
      Usage
        $ cms-workspace <command>
  
      Available commands
        ${Object.keys(commands).join(", ")}
  
    `)
      process.exit(0)
    }
  
    // Make sure commands gracefully respect termination signals (e.g. from Docker)
    process.on("SIGTERM", () => process.exit(0))
    process.on("SIGINT", () => process.exit(0))
  
    await command()
  })()
  