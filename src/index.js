import _ from 'lodash';
import { loginDeviceByIp } from 'tp-link-tapo-connect';

// Device info processing with Lodash
export const normalizeDeviceInfo = (deviceInfo, ip) => ({
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
export const shouldProcessDevice = (deviceInfo, filter) => 
  !filter || _.includes(_.toLower(deviceInfo.nickname), _.toLower(filter));

export const getDeviceInfo = async ({email, password}, ip) => {
    const device = await loginDeviceByIp(email, password, ip);
    const rawInfo = await device.getDeviceInfo();
    return { 
      device, 
      info: normalizeDeviceInfo(rawInfo, ip)
    };
}
