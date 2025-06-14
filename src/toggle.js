import _ from 'lodash';
import { loginDeviceByIp } from 'tp-link-tapo-connect';
import getopt from 'node-getopt';
import IotProbe from './iot-probe/index.js';
import { sleep, Logger, loadJson, getDirname} from './utils/index.js';
const rootConfig = await loadJson(getDirname(import.meta.url) + '/../config.json');

// Command line options configuration
const opt = getopt.create([
  ['n', 'nickname=NAME', 'Filter devices by nickname'],
  ['h', 'help', 'Display this help'],
  ['d', 'debug', 'Enable debug logging']
]).bindHelp();

// Parse command line arguments
const { options } = opt.parseSystem();

const DEBUG_MODE = _.get(options, 'debug', false);
const nicknameFilter = _.get(options, 'nickname');
const logger = Logger(DEBUG_MODE);

// Configuration
const { email, password } = _.get(rootConfig, 'tapo', {});
const SCAN_CACHE = true;
const DELAY_MS = 2000;

// Device info processing with Lodash
const normalizeDeviceInfo = (deviceInfo, ip) => ({
  ...deviceInfo,
  ip,
  nickname: _.chain(deviceInfo)
    .thru(info => _.get(info, 'nickname') || 
                  _.get(info, 'deviceInfo.nickname') || 
                  _.get(info, 'result.nickname') ||
                  'Unknown')
    .trim()
    .value()
});

// Predicate functions with Lodash
const shouldProcessDevice = (deviceInfo, filter) => 
  !filter || _.includes(_.toLower(deviceInfo.nickname), _.toLower(filter));

const processDevice = _.memoize(async (ip) => {
  try {
    logger.info(`Connecting to device at ${ip}...`);
    const device = await loginDeviceByIp(email, password, ip);
    const rawInfo = await device.getDeviceInfo();
    const deviceInfo = normalizeDeviceInfo(rawInfo, ip);
    
    logger.info(`Device ${ip} nickname: "${deviceInfo.nickname}"`);
    
    if (!shouldProcessDevice(deviceInfo, nicknameFilter)) {
      logger.info(`Skipping device ${ip} - nickname doesn't match filter`);
      return null;
    }

    logger.info(`Processing device ${ip} (${deviceInfo.nickname})...`);
    await toggleDevicePower(device, deviceInfo);
    return deviceInfo;
  } catch (error) {
    logger.error(`Device processing failed: ${_.get(error, 'message', error)}`);
    return null;
  }
});

async function toggleDevicePower(device, deviceInfo) {
  try {
    const action = deviceInfo.device_on ? 'Off' : 'On';
    logger.info(`Turning ${action} device "${deviceInfo.nickname}"...`);
    
    await sleep(DELAY_MS);
    await device[`turn${action}`]();
    await sleep(DELAY_MS);
    
    const newState = await device.getDeviceInfo();
    logger.info(`Device "${deviceInfo.nickname}" turned ${action} successfully.`);
    logger.debug('New state:', newState);
  } catch (error) {
    logger.error(`Power toggle failed: ${_.get(error, 'message', error)}`);
    throw error;
  }
}

async function scanAndProcessDevices() {
  try {
    logger.info('Starting Tapo device control script');
    if (nicknameFilter) logger.info(`Nickname filter: "${nicknameFilter}"`);

    const scanner = new IotProbe(_.get(rootConfig, 'plug_probe', {}));
    logger.debug(scanner);
    const scannedDevices = await _.invoke(scanner, 'scan', SCAN_CACHE);
    logger.debug(scannedDevices);
    const deviceIPs = _.keys(scannedDevices);
    logger.info(`Discovered ${deviceIPs.length} devices:`, deviceIPs);

    const results = await _.map(deviceIPs, processDevice);
    const successfulResults = _.compact(results);

    if (nicknameFilter && _.isEmpty(successfulResults)) {
      logger.error(`No devices matching nickname: "${nicknameFilter}"`);
    }

    logger.info('Operation completed. Processed devices:', successfulResults.length);
    logger.debug('Results:', successfulResults);
  } catch (error) {
    logger.error('Execution failed:', _.get(error, 'message', error));
    process.exit(1);
  }
}

// Execute the main workflow
await scanAndProcessDevices();
