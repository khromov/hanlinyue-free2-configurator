# Hanlinyue Configurator

An unofficial, open-source web configurator for Hanlinyue (翰林阅) page turners. Plug the remote in with a USB-C cable, open the page in Chrome or Edge, and set it up right in the browser. Nothing to install.

**Supported models:** Free2, Free2 2026, Free3, E1 Pro, E3 Control

## Features

It does everything the official desktop app (v1.3.3) does:

- **Presets**: the eight built-in layouts per model (e-reader page turn, arrow keys, Page Up/Down, copy/paste, short-video, music, camera…)
- **Custom keys**: assign any key combo (up to 5 keys, media keys, Mac modifiers) or a phone touch action (like, swipe, home, back…) to each button, with three quick profiles
- **Macros**:
  - Phone action scripts with a repeat count or infinite loop
  - A keyboard macro recorder with recorded, default or fixed delays
- **Lighting**: per-button off, lucky color, rainbow, or a custom color and brightness (Free2 and Free3)
- **Device info**: battery, firmware, serial number, specs; 10 languages; light and dark themes

It also adds:

- Double-click and long-press triggers
- Typing keys straight into the key picker
- Auto-reconnect when the device is plugged back in
- A raw protocol log
- A demo mode (`?demo=Free2`, `?demo=Free3`, `?demo=E1Pro`, `?demo=E3Control`)

Firmware updates still need Hanlinyue's Windows tool.

## Browser support

USB needs the [Web Serial API](https://developer.mozilla.org/docs/Web/API/Web_Serial_API), so use Chrome, Edge or Opera on a desktop computer. Bluetooth configuration (Web Bluetooth, Jieli `AE30` service) is experimental.

## Protocol

The device enumerates as a Jieli composite USB device (VID `0x4C4A`, PID `0x4155`) with a CDC-ACM serial port at 460800 baud. Commands are UTF-8 JSON objects:

| Command | Example |
| --- | --- |
| Read info | `{"o":"get","t":"model"}` → `{"o":"getresult","t":"model","v":"Free 2"}` (also `battery`, `mac`, `firmware`) |
| Preset | `{"o":"set","m":"preset","v":"keyboard_lr"}` |
| Key combo / macro | `{"o":"set","k":1,"m":"keyboard","e":"click","v":[{"t":"down","k":"PageDown","c":34},{"t":"wait","ms":30},{"t":"up","k":"PageDown","c":34}],"r":1}` |
| Phone action | `{"o":"set","k":2,"m":"mouse","e":"doubleclick","v":"like","r":"forever"}` |
| Light | `{"o":"set","k":1,"m":"light","v":{"enable":true,"rgb":"255,0,0","bri":80}}` or `{"enable":true,"animate":"1"}` |

Notes on the commands:

- `e` is the trigger: `click`, `doubleclick` or `longpress`.
- `r` is the repeat count, or `"forever"`.
- Models with a P/M/R slide switch also get `"s":"P"|"M"|"R"` on every `set`.

Commands longer than 64 bytes are split into 55-byte chunks. Each chunk is prefixed with `S{seq}[{i}/{n}]`, where `seq` cycles from 1 to 9. The device doesn't acknowledge `set` commands. A malformed frame makes it repeat its last reply. Examples are an unsplit command over 64 bytes, or several segments arriving merged in one USB transfer. Write each segment separately; Web Serial has no `drain()`, so the app waits 15 ms between segments. Settings are stored right away but only take effect after the USB cable is unplugged and plugged back in; verified on a Free2 running firmware V0.15. See [`src/lib/protocol`](src/lib/protocol).

## Development

```sh
npm install
npm run dev      # http://localhost:5173
npm test
npm run check
npm run build
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Disclaimer

This project is not affiliated with or endorsed by Hanlinyue (Shenzhen) Technology Co., Ltd. Settings are remembered only in your browser. To restore factory defaults, hold the power key for 30 seconds while the page turner is on.
