import { exec as nodeExec, ExecException } from "child_process"

export const exec = (cmd: string) => {
  return new Promise((resolve, reject) => {
    nodeExec(
      cmd,
      (
        error: ExecException | null,
        stdout: string | Buffer,
        stderr: string | Buffer
      ) => {
        if (error) {
          console.error(`exec error: ${error}`)
          reject(error)
          return
        }
        console.log(`stdout: ${stdout}`)
        console.error(`stderr: ${stderr}`)
        resolve(stdout)
      }
    )
  })
}
