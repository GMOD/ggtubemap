// The web globals @gmod/tabix reads that R's V8 lacks. A browser or Node has
// them all; this module defines only the missing ones.

// Core clones only its inputs, which arrive as parsed JSON, so a JSON round
// trip copies them exactly
globalThis.structuredClone ??= value => JSON.parse(JSON.stringify(value))

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function fromBase64(s) {
  const text = s.replace(/[\s=]+/g, '')
  const out = new Uint8Array((text.length * 3) >> 2)
  for (let i = 0, j = 0, acc = 0, bits = 0; i < text.length; i++) {
    acc = (acc << 6) | BASE64.indexOf(text[i])
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out[j++] = (acc >> bits) & 0xff
    }
  }
  return out
}

globalThis.TextDecoder ??= class TextDecoder {
  decode(bytes = new Uint8Array(0)) {
    const b = ArrayBuffer.isView(bytes)
      ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      : new Uint8Array(bytes)
    let out = ''
    for (let i = 0; i < b.length; ) {
      const c = b[i++]
      const extra = c >= 0xf8 ? -1 : c >= 0xf0 ? 3 : c >= 0xe0 ? 2 : c >= 0xc0 ? 1 : 0
      if (extra < 0 || (c >= 0x80 && c < 0xc0) || i + extra > b.length) {
        out += '�'
        continue
      }
      let cp = extra === 0 ? c : c & (0x3f >> extra)
      for (let k = 0; k < extra; k++) {
        cp = (cp << 6) | (b[i++] & 0x3f)
      }
      out += cp > 0x10ffff ? '�' : String.fromCodePoint(cp)
    }
    return out
  }
}

globalThis.TextEncoder ??= class TextEncoder {
  encode(text = '') {
    const out = []
    for (const ch of text) {
      const cp = ch.codePointAt(0)
      if (cp < 0x80) {
        out.push(cp)
      } else if (cp < 0x800) {
        out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f))
      } else if (cp < 0x10000) {
        out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
      } else {
        out.push(
          0xf0 | (cp >> 18),
          0x80 | ((cp >> 12) & 0x3f),
          0x80 | ((cp >> 6) & 0x3f),
          0x80 | (cp & 0x3f),
        )
      }
    }
    return Uint8Array.from(out)
  }
}

if (!globalThis.AbortController) {
  class AbortSignal {
    aborted = false
    reason = undefined
    listeners = []
    addEventListener(_type, fn) {
      this.listeners.push(fn)
    }
    removeEventListener(_type, fn) {
      this.listeners = this.listeners.filter(f => f !== fn)
    }
    throwIfAborted() {
      if (this.aborted) {
        throw this.reason
      }
    }
  }
  globalThis.AbortController = class AbortController {
    signal = new AbortSignal()
    abort(reason = new Error('aborted')) {
      if (!this.signal.aborted) {
        this.signal.aborted = true
        this.signal.reason = reason
        for (const fn of this.signal.listeners) {
          fn({ type: 'abort' })
        }
      }
    }
  }
}

// the bgzip reader's inlined WASM loads through fetch on a data: URL
globalThis.fetch ??= async url => {
  const m = /^data:[^,]*;base64,(.*)$/.exec(url)
  if (!m) {
    throw new Error(`V8 has no network: cannot fetch ${url}`)
  }
  const bytes = fromBase64(m[1])
  return { ok: true, arrayBuffer: async () => bytes.buffer }
}
