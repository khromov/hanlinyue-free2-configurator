/**
 * Wire framing used by Hanlinyue firmware.
 *
 * Commands are UTF-8 JSON objects. When an encoded command is longer than
 * the transport limit (64 bytes over USB CDC, 245 over BLE) it is split into
 * segments, each prefixed with `S{seq}[{index}/{total}]`, where `seq` cycles
 * 1..9 per command. Each segment carries `limit - 9` payload bytes, exactly
 * like the official driver.
 */

export const USB_SEGMENT_LIMIT = 64;
export const BLE_SEGMENT_LIMIT = 245;
const PREFIX_RESERVE = 9;

const encoder = new TextEncoder();

export function encodeCommand(cmd: unknown): Uint8Array {
  return encoder.encode(JSON.stringify(cmd));
}

export function segment(data: Uint8Array, limit: number, seq: number): Uint8Array[] {
  if (data.length <= limit) return [data];
  const size = limit - PREFIX_RESERVE;
  const total = Math.ceil(data.length / size);
  const out: Uint8Array[] = [];
  for (let i = 0; i < total; i++) {
    const prefix = encoder.encode(`S${seq}[${i + 1}/${total}]`);
    const chunk = data.subarray(i * size, (i + 1) * size);
    const seg = new Uint8Array(prefix.length + chunk.length);
    seg.set(prefix, 0);
    seg.set(chunk, prefix.length);
    out.push(seg);
  }
  return out;
}

/** Cycles 1..9 like the firmware expects. */
export class SequenceCounter {
  private value = 1;
  next(): number {
    const current = this.value;
    this.value = (this.value % 9) + 1;
    return current;
  }
}

/**
 * Splits a byte stream of concatenated / fragmented JSON objects into
 * parsed messages. The device replies with bare objects and no delimiter,
 * and a single read can contain half an object or several of them.
 */
export class JsonStreamParser {
  private buffer = '';

  push(text: string): unknown[] {
    this.buffer += text;
    const messages: unknown[] = [];
    let depth = 0;
    let inString = false;
    let escaped = false;
    let start = -1;
    let consumed = 0;

    for (let i = 0; i < this.buffer.length; i++) {
      const c = this.buffer[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === '"') inString = false;
        continue;
      }
      if (c === '"') {
        if (depth > 0) inString = true;
      } else if (c === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (c === '}' && depth > 0) {
        depth--;
        if (depth === 0) {
          const raw = this.buffer.slice(start, i + 1);
          try {
            messages.push(JSON.parse(raw));
          } catch {
            // Corrupt frame: drop it and keep going.
          }
          consumed = i + 1;
        }
      } else if (depth === 0) {
        consumed = i + 1; // noise between objects
      }
    }

    this.buffer = this.buffer.slice(consumed);
    // Guard against unbounded growth if the stream is garbage.
    if (this.buffer.length > 64 * 1024) this.buffer = '';
    return messages;
  }

  reset() {
    this.buffer = '';
  }
}
