import _ from "lodash";
import { readFile, unlink, lstat, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

export const getDirnameFromFile = (fileUrl) => {
  try {
    const __filename = fileURLToPath(fileUrl);
    return dirname(__filename);
  } catch(err) {
    console.error(`fileUrl provided threw an error: ${fileUrl}`);
    return dirname(fileUrl);
  }
}

export const deleteAllFilesInDirectory = async (directoryPath) => {
  try {
    const files = await readdir(directoryPath); // Read the contents of the directory

    for (const file of files) {
      const filePath = join(directoryPath, file); // Construct the full path to the file
      const stats = await lstat(filePath); // Get file statistics to check if it's a file or directory

      if (stats.isFile()) {
        await unlink(filePath); // Delete the file if it's a regular file
        console.log(`Deleted file: ${filePath}`);
      }
    }
    console.log(`All files in ${directoryPath} have been deleted.`);
  } catch (err) {
    console.error(`Error deleting files in directory: ${err}`);
  }
}
