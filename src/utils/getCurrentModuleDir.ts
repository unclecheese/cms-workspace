import path from 'path'
import fs from 'fs'

const getCurrentModuleDir = (): string => {
    let curr = process.cwd()
    let dir;
    while (curr) {
        if (fs.existsSync(path.join(curr, `composer.json`))) {
            dir = curr;
            break;
        }
        curr = path.dirname(curr)
    }
    if (!dir) {
        throw new Error(`Could not find module dir at ${process.cwd()}`)
    }

    return dir
}

export default getCurrentModuleDir