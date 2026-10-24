export type TransportKind = 'usb' | 'ble';

export interface TransportEvents {
  onMessage: (msg: unknown) => void;
  onDisconnect: () => void;
}

export interface Transport {
  readonly kind: TransportKind;
  /** Write one already-encoded command, segmenting it as needed. */
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
}

/** Hanlinyue's Jieli-based devices enumerate with this USB VID/PID. */
export const USB_FILTER = { usbVendorId: 0x4c4a, usbProductId: 0x4155 };
export const BAUD_RATE = 460800;

/** Jieli BLE config service: write to AE01, notifications on AE02. */
export const BLE_SERVICE = 0xae30;
export const BLE_WRITE_CHAR = 0xae01;
export const BLE_NOTIFY_CHAR = 0xae02;
