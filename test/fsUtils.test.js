import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'

export const exists = path => fs.access(path, fsConstants.FS_OK).then(() => true, () => false)

// eslint-disable-next-line n/no-callback-literal
export const existsCallback = (path, callback) => fs.access(path, fsConstants.FS_OK).then(() => callback(true), () => callback(false))
