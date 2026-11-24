import { app } from "electron"
import path from "path"

export const is = {
  dev: app.isPackaged === false ? true : false,
}

export const getResourcePath = (fileName: string): string => {
  if (is.dev) {
    return path.resolve(app.getAppPath(), "resources", fileName)
  }
  return path.join(process.resourcesPath, fileName)
}
