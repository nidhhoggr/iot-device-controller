import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { getDirnameFromFile, deleteAllFilesInDirectory } from '../utils/index.js';

export default class IotProbe {
  constructor(options = {}) {
    //because we cant call __dirname in json
    
    let cacheFile;
    
    if (options.cacheFile) {
      const thisDir = getDirnameFromFile(import.meta.url);
      cacheFile = path.join(thisDir, options.cacheFile);
      if (options.clearCache) {
        const cacheDir = getDirnameFromFile(cacheFile);
        deleteAllFilesInDirectory(cacheDir).then(() =>{});
      }
    }

    delete options.cacheFile;
    
    this.config = {
      networkPrefix: '192.168.1',
      timeoutMs: 2000,
      expectedResponse: '',
      concurrentRequests: 50,
      cacheFile,
      cacheTtlMs: 3600000, // 1 hour
      ...options
    };

    console.log({options, cacheFile, config: this.config});
    // Bind methods
    this.scan = this.scan.bind(this);
  }

  async #readCache() {
    try {
      const data = await fs.promises.readFile(this.config.cacheFile, 'utf8');
      const cache = JSON.parse(data);
      
      if (cache.timestamp && (Date.now() - cache.timestamp) > this.config.cacheTtlMs) {
        return { valid: false, data: {} };
      }
      
      return { valid: true, data: cache.results || {} };
    } catch (error) {
      return { valid: false, data: {} };
    }
  }

  async #writeCache(results) {
    const cacheData = {
      timestamp: Date.now(),
      results
    };
    
    await fs.promises.writeFile(
      this.config.cacheFile, 
      JSON.stringify(cacheData, null, 2)
    );
  }

  async #checkIp(ip) {
    const url = `http://${ip}`;
    
    try {
      const response = await axios.get(url, { 
        timeout: this.config.timeoutMs 
      });
      
      if (this.config.expectedResponse && 
          !response.data.includes(this.config.expectedResponse)) {
        return { ip, success: false, data: response.data };
      }
      
      return { ip, success: true, data: response.data };
    } catch (error) {
      return { ip, success: false, error: error.message };
    }
  }

  async #scanRange() {
    const promises = [];
    const results = {};
    
    for (let i = 1; i <= 254; i++) {
      const ip = `${this.config.networkPrefix}.${i}`;
      
      if (promises.length >= this.config.concurrentRequests) {
        await Promise.all(promises);
        promises.length = 0;
      }
      
      promises.push(
        this.#checkIp(ip).then(result => {
          if (result.success) {
            results[result.ip] = result.data;
          }
        })
      );
    }
    
    await Promise.all(promises);
    return results;
  }

  async scan(useCache = true) {
    if (useCache) {
      const cache = await this.#readCache();
      if (cache.valid) {
        console.log('Using cached results');
        return cache.data;
      }
    }

    const results = await this.#scanRange();
    
    if (Object.keys(results).length > 0) {
      await this.#writeCache(results);
    }

    return results;
  }

  async clearCache() {
    try {
      await fs.promises.unlink(this.config.cacheFile);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // File doesn't exist, consider cache cleared
      }
      throw error;
    }
  }
}
