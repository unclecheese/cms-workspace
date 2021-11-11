import crypto from "crypto"
import fs from "fs"
import getProjectDir from "./getProjectDir";

export const getComposerHash = (): string => {
    const fileBuffer = fs.readFileSync(`${getProjectDir()}/composer.lock`);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);

    return hashSum.digest('hex');
}