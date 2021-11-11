import path from 'path'
import fs from 'fs'

export const getNearestPackage = (currentDir: string): string => {
    let curr = currentDir
    let dir;
    while (curr) {
        if (fs.existsSync(path.join(curr, `package.json`))) {
            dir = curr;
            break;
        }
        curr = path.dirname(curr)
    }
    if (!dir) {
        throw new Error(`Could not find package.json at ${currentDir}`)
    }

    return dir
}
