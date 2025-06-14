# IOT Device Controller

A Node.js script to discover and control TP-Link Tapo smart devices using their local API with Lodash utilities and command-line filtering.

## Features

- 🔍 Scan network for Tapo devices
- 🎛️ Control device power states (on/off)
- 🔎 Filter devices by nickname
- 📊 Detailed device information logging
- 🔄 Automatic retry mechanism for failed operations

## Prerequisites

- Node.js 18.x or higher
- TP-Link Tapo compatible smart devices
- Network access to device IPs

## Installation

1. Clone the repository:
```bash
git clone https://github.com/nidhhoggr/iot-device-controller.git
cd iot-device-controller
```

2. Install dependencies:
```bash
npm install
```

3. Create a `config.json` file:
```json
{
  "tapo": {
    "email": "your@tapo.email",
    "password": "yourPassword123"
  },
  "plug_probe": {
    "networkPrefix": "192.168.0",
    "expectedResponse": "<html><body><center>200 OK</center></body></html>",
    "cacheTtlMs": 1800000,
    "concurrentRequests": 30,
    "cacheFile": "/../../cache/ip-scanner-cache.json"
    "scanTimeout": 5000
  }
}
```

## Usage

### Basic Command
```bash
node toggle.js
```

### Filter by Device Nickname
```bash
node toggle.js --nickname "Basking Lamp"
```

### Enable Debug Logging
```bash
node toggle.js --debug
```

### Help Menu
```bash
node toggle.js --help
```

## Command Line Options

| Option | Description |
|--------|-------------|
| `-n, --nickname` | Filter devices by nickname (partial match) |
| `-d, --debug` | Enable verbose debug logging |
| `-h, --help` | Display help information |

## Code Structure

```
iot-device-controller/
├── src/
│   ├── toggle.js              # Main control script
│   ├── utils/                 # Utility modules
│   └── iot-probe/             # Device discovery
├── config.json                # Configuration file
├── cache/                     # Cache directory
├── package.json
└── README.md
```

## Advanced Configuration

Modify `config.json` to adjust:

- IP range for scanning
- Scan timeout duration
- Operation delay intervals
- Retry attempt counts

## Error Handling

The script includes comprehensive error handling for:

- Device connection failures
- Authentication errors
- Network timeouts
- Power state mismatches

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Disclaimer

This project is not affiliated with TP-Link. Use at your own risk with compatible Tapo devices.
```
