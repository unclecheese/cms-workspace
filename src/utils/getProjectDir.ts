import fs from 'fs'
import path from 'path'

const getProjectDir = (): string => {
    let curr = process.cwd()
    let dir;
    while (curr) {
        if (
            fs.existsSync(path.join(curr, `composer.json`)) &&
            fs.existsSync(path.join(curr, `vendor`)) &&
            fs.existsSync(path.join(curr, `public`))
        ) {
            dir = curr;
            break;
        }
        curr = path.dirname(curr)
    }
    if (!dir) {
        throw new Error(`Could not find project dir at ${process.cwd()}`)
    }

    return dir
}

export default getProjectDir