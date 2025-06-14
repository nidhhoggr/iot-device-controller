import _ from "lodash";
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


export const sleep = async (wait) => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`sleeping for ${wait} milliseconds`);
      resolve();
    }, wait);
  });
}

export function Logger(DEBUG_MODE) {
  return {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => DEBUG_MODE && console.log('[DEBUG]', ..._.map(args, arg =>
      _.isObject(arg) ? JSON.stringify(arg, null, 2) : arg))
  }
};

export const loadJson = async (jsonFilePath) => {
  const configFile = await readFile(new URL(jsonFilePath, import.meta.url));
  return JSON.parse(configFile);
}

export const getDirname = (fileUrl) => {
  const __filename = fileURLToPath(fileUrl);
  return dirname(__filename);
}
