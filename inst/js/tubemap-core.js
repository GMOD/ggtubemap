/*
 * @jbrowse/tubemap-core 2.0.1, bundled by tools/bridge.js
 *
 * MIT License
 *
 * Copyright (c) 2017 Wolfgang Beyer, 2026 Colin Diesh
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(() => {
  var __defProp = Object.defineProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // tools/polyfills.js
  globalThis.structuredClone ?? (globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value)));
  var BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  function fromBase64(s) {
    const text = s.replace(/[\s=]+/g, "");
    const out = new Uint8Array(text.length * 3 >> 2);
    for (let i = 0, j = 0, acc = 0, bits = 0; i < text.length; i++) {
      acc = acc << 6 | BASE64.indexOf(text[i]);
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out[j++] = acc >> bits & 255;
      }
    }
    return out;
  }
  globalThis.TextDecoder ?? (globalThis.TextDecoder = class TextDecoder2 {
    decode(bytes = new Uint8Array(0)) {
      const b = ArrayBuffer.isView(bytes) ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength) : new Uint8Array(bytes);
      let out = "";
      for (let i = 0; i < b.length; ) {
        const c = b[i++];
        const extra = c >= 248 ? -1 : c >= 240 ? 3 : c >= 224 ? 2 : c >= 192 ? 1 : 0;
        if (extra < 0 || c >= 128 && c < 192 || i + extra > b.length) {
          out += "\uFFFD";
          continue;
        }
        let cp = extra === 0 ? c : c & 63 >> extra;
        for (let k = 0; k < extra; k++) {
          cp = cp << 6 | b[i++] & 63;
        }
        out += cp > 1114111 ? "\uFFFD" : String.fromCodePoint(cp);
      }
      return out;
    }
  });
  globalThis.TextEncoder ?? (globalThis.TextEncoder = class TextEncoder2 {
    encode(text = "") {
      const out = [];
      for (const ch of text) {
        const cp = ch.codePointAt(0);
        if (cp < 128) {
          out.push(cp);
        } else if (cp < 2048) {
          out.push(192 | cp >> 6, 128 | cp & 63);
        } else if (cp < 65536) {
          out.push(224 | cp >> 12, 128 | cp >> 6 & 63, 128 | cp & 63);
        } else {
          out.push(
            240 | cp >> 18,
            128 | cp >> 12 & 63,
            128 | cp >> 6 & 63,
            128 | cp & 63
          );
        }
      }
      return Uint8Array.from(out);
    }
  });
  if (!globalThis.AbortController) {
    class AbortSignal {
      constructor() {
        __publicField(this, "aborted", false);
        __publicField(this, "reason");
        __publicField(this, "listeners", []);
      }
      addEventListener(_type, fn) {
        this.listeners.push(fn);
      }
      removeEventListener(_type, fn) {
        this.listeners = this.listeners.filter((f) => f !== fn);
      }
      throwIfAborted() {
        if (this.aborted) {
          throw this.reason;
        }
      }
    }
    globalThis.AbortController = class AbortController {
      constructor() {
        __publicField(this, "signal", new AbortSignal());
      }
      abort(reason = new Error("aborted")) {
        if (!this.signal.aborted) {
          this.signal.aborted = true;
          this.signal.reason = reason;
          for (const fn of this.signal.listeners) {
            fn({ type: "abort" });
          }
        }
      }
    };
  }
  globalThis.fetch ?? (globalThis.fetch = async (url) => {
    const m = /^data:[^,]*;base64,(.*)$/.exec(url);
    if (!m) {
      throw new Error(`V8 has no network: cannot fetch ${url}`);
    }
    const bytes = fromBase64(m[1]);
    return { ok: true, arrayBuffer: async () => bytes.buffer };
  });

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/zlib/constants.js
  var Z_NO_FLUSH = 0;
  var Z_SYNC_FLUSH = 2;
  var Z_FINISH = 4;
  var Z_OK = 0;
  var Z_STREAM_END = 1;
  var Z_NEED_DICT = 2;
  var Z_BUF_ERROR = -5;

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/utils/common.js
  function _has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }
  function assign(obj) {
    var sources = Array.prototype.slice.call(arguments, 1);
    while (sources.length) {
      var source = sources.shift();
      if (!source) {
        continue;
      }
      if (typeof source !== "object") {
        throw new TypeError(source + "must be non-object");
      }
      for (var p in source) {
        if (_has(source, p)) {
          obj[p] = source[p];
        }
      }
    }
    return obj;
  }
  function shrinkBuf(buf, size) {
    if (buf.length === size) {
      return buf;
    }
    if (buf.subarray) {
      return buf.subarray(0, size);
    }
    buf.length = size;
    return buf;
  }
  var fnTyped = {
    arraySet: function(dest, src, src_offs, len, dest_offs) {
      if (src.subarray && dest.subarray) {
        dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
        return;
      }
      for (var i = 0; i < len; i++) {
        dest[dest_offs + i] = src[src_offs + i];
      }
    },
    // Join array of chunks to single array.
    flattenChunks: function(chunks) {
      var i, l, len, pos, chunk, result;
      len = 0;
      for (i = 0, l = chunks.length; i < l; i++) {
        len += chunks[i].length;
      }
      result = new Uint8Array(len);
      pos = 0;
      for (i = 0, l = chunks.length; i < l; i++) {
        chunk = chunks[i];
        result.set(chunk, pos);
        pos += chunk.length;
      }
      return result;
    },
    Buf8: function(size) {
      return new Uint8Array(size);
    },
    Buf16: function(size) {
      return new Uint16Array(size);
    },
    Buf32: function(size) {
      return new Int32Array(size);
    }
  };
  var fnUntyped = {
    arraySet: function(dest, src, src_offs, len, dest_offs) {
      for (var i = 0; i < len; i++) {
        dest[dest_offs + i] = src[src_offs + i];
      }
    },
    // Join array of chunks to single array.
    flattenChunks: function(chunks) {
      return [].concat.apply([], chunks);
    },
    Buf8: function(size) {
      return new Array(size);
    },
    Buf16: function(size) {
      return new Array(size);
    },
    Buf32: function(size) {
      return new Array(size);
    }
  };
  var typedOK = () => {
    const supported = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
    typedOK = () => supported;
    return supported;
  };
  var arraySet = (dest, src, src_offs, len, dest_offs) => {
    arraySet = typedOK() ? fnTyped.arraySet : fnUntyped.arraySet;
    return arraySet(dest, src, src_offs, len, dest_offs);
  };
  var flattenChunks = (chunks) => {
    flattenChunks = typedOK() ? fnTyped.flattenChunks : fnUntyped.flattenChunks;
    return flattenChunks(chunks);
  };
  var Buf8 = (size) => {
    Buf8 = typedOK() ? fnTyped.Buf8 : fnUntyped.Buf8;
    return Buf8(size);
  };
  var Buf16 = (size) => {
    Buf16 = typedOK() ? fnTyped.Buf16 : fnUntyped.Buf16;
    return Buf16(size);
  };
  var Buf32 = (size) => {
    Buf32 = typedOK() ? fnTyped.Buf32 : fnUntyped.Buf32;
    return Buf32(size);
  };

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/utils/strings.js
  var strApplyOK = function() {
    let result = true;
    try {
      String.fromCharCode.apply(null, [0]);
    } catch (_) {
      result = false;
    }
    strApplyOK = () => result;
    return result;
  };
  var strApplyUintOK = function() {
    let result = true;
    try {
      String.fromCharCode.apply(null, new Uint8Array(1));
    } catch (_) {
      result = false;
    }
    strApplyUintOK = () => result;
    return result;
  };
  var utf8len = function(c) {
    var table = Buf8(256);
    for (var q = 0; q < 256; q++) {
      table[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
    }
    table[254] = table[254] = 1;
    utf8len = (arg) => table[arg];
    return table[c];
  };
  function string2buf(str) {
    var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
    for (m_pos = 0; m_pos < str_len; m_pos++) {
      c = str.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
    }
    buf = new Uint8Array(buf_len);
    for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
      c = str.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      if (c < 128) {
        buf[i++] = c;
      } else if (c < 2048) {
        buf[i++] = 192 | c >>> 6;
        buf[i++] = 128 | c & 63;
      } else if (c < 65536) {
        buf[i++] = 224 | c >>> 12;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      } else {
        buf[i++] = 240 | c >>> 18;
        buf[i++] = 128 | c >>> 12 & 63;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      }
    }
    return buf;
  }
  function _buf2binstring(buf, len) {
    if (len < 65534) {
      if (buf.subarray && strApplyUintOK() || !buf.subarray && strApplyOK()) {
        return String.fromCharCode.apply(null, shrinkBuf(buf, len));
      }
    }
    var result = "";
    for (var i = 0; i < len; i++) {
      result += String.fromCharCode(buf[i]);
    }
    return result;
  }
  function binstring2buf(str) {
    var buf = new Uint8Array(str.length);
    for (var i = 0, len = buf.length; i < len; i++) {
      buf[i] = str.charCodeAt(i);
    }
    return buf;
  }
  function buf2string(buf, max) {
    var i, out, c, c_len;
    var len = max || buf.length;
    var utf16buf = new Array(len * 2);
    for (out = 0, i = 0; i < len; ) {
      c = buf[i++];
      if (c < 128) {
        utf16buf[out++] = c;
        continue;
      }
      c_len = utf8len(c);
      if (c_len > 4) {
        utf16buf[out++] = 65533;
        i += c_len - 1;
        continue;
      }
      c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
      while (c_len > 1 && i < len) {
        c = c << 6 | buf[i++] & 63;
        c_len--;
      }
      if (c_len > 1) {
        utf16buf[out++] = 65533;
        continue;
      }
      if (c < 65536) {
        utf16buf[out++] = c;
      } else {
        c -= 65536;
        utf16buf[out++] = 55296 | c >> 10 & 1023;
        utf16buf[out++] = 56320 | c & 1023;
      }
    }
    return _buf2binstring(utf16buf, out);
  }
  function utf8border(buf, max) {
    var pos;
    max = max || buf.length;
    if (max > buf.length) {
      max = buf.length;
    }
    pos = max - 1;
    while (pos >= 0 && (buf[pos] & 192) === 128) {
      pos--;
    }
    if (pos < 0) {
      return max;
    }
    if (pos === 0) {
      return max;
    }
    return pos + utf8len(buf[pos]) > max ? pos : max;
  }

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/zlib/gzheader.js
  function GZheader() {
    this.text = 0;
    this.time = 0;
    this.xflags = 0;
    this.os = 0;
    this.extra = null;
    this.extra_len = 0;
    this.name = "";
    this.comment = "";
    this.hcrc = 0;
    this.done = false;
  }

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/zlib/adler32.js
  function adler32(adler, buf, len, pos) {
    var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
    while (len !== 0) {
      n = len > 2e3 ? 2e3 : len;
      len -= n;
      do {
        s1 = s1 + buf[pos++] | 0;
        s2 = s2 + s1 | 0;
      } while (--n);
      s1 %= 65521;
      s2 %= 65521;
    }
    return s1 | s2 << 16 | 0;
  }

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/zlib/crc32.js
  function makeTable() {
    var c, table = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      }
      table[n] = c;
    }
    return table;
  }
  var crcTable = function() {
    const table = makeTable();
    crcTable = () => table;
    return table;
  };
  function crc32(crc, buf, len, pos) {
    var t = crcTable(), end = pos + len;
    crc ^= -1;
    for (var i = pos; i < end; i++) {
      crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
    }
    return crc ^ -1;
  }

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/zlib/inffast.js
  var BAD = 30;
  var TYPE = 12;
  function inflate_fast(strm, start) {
    var state;
    var _in;
    var last;
    var _out;
    var beg;
    var end;
    var dmax;
    var wsize;
    var whave;
    var wnext;
    var s_window;
    var hold;
    var bits;
    var lcode;
    var dcode;
    var lmask;
    var dmask;
    var here;
    var op;
    var len;
    var dist;
    var from;
    var from_source;
    var input, output;
    state = strm.state;
    _in = strm.next_in;
    input = strm.input;
    last = _in + (strm.avail_in - 5);
    _out = strm.next_out;
    output = strm.output;
    beg = _out - (start - strm.avail_out);
    end = _out + (strm.avail_out - 257);
    dmax = state.dmax;
    wsize = state.wsize;
    whave = state.whave;
    wnext = state.wnext;
    s_window = state.window;
    hold = state.hold;
    bits = state.bits;
    lcode = state.lencode;
    dcode = state.distcode;
    lmask = (1 << state.lenbits) - 1;
    dmask = (1 << state.distbits) - 1;
    top: do {
      if (bits < 15) {
        hold += input[_in++] << bits;
        bits += 8;
        hold += input[_in++] << bits;
        bits += 8;
      }
      here = lcode[hold & lmask];
      dolen: for (; ; ) {
        op = here >>> 24;
        hold >>>= op;
        bits -= op;
        op = here >>> 16 & 255;
        if (op === 0) {
          output[_out++] = here & 65535;
        } else if (op & 16) {
          len = here & 65535;
          op &= 15;
          if (op) {
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
            }
            len += hold & (1 << op) - 1;
            hold >>>= op;
            bits -= op;
          }
          if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
          }
          here = dcode[hold & dmask];
          dodist: for (; ; ) {
            op = here >>> 24;
            hold >>>= op;
            bits -= op;
            op = here >>> 16 & 255;
            if (op & 16) {
              dist = here & 65535;
              op &= 15;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;
                }
              }
              dist += hold & (1 << op) - 1;
              if (dist > dmax) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break top;
              }
              hold >>>= op;
              bits -= op;
              op = _out - beg;
              if (dist > op) {
                op = dist - op;
                if (op > whave) {
                  if (state.sane) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD;
                    break top;
                  }
                }
                from = 0;
                from_source = s_window;
                if (wnext === 0) {
                  from += wsize - op;
                  if (op < len) {
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;
                    from_source = output;
                  }
                } else if (wnext < op) {
                  from += wsize + wnext - op;
                  op -= wnext;
                  if (op < len) {
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = 0;
                    if (wnext < len) {
                      op = wnext;
                      len -= op;
                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);
                      from = _out - dist;
                      from_source = output;
                    }
                  }
                } else {
                  from += wnext - op;
                  if (op < len) {
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;
                    from_source = output;
                  }
                }
                while (len > 2) {
                  output[_out++] = from_source[from++];
                  output[_out++] = from_source[from++];
                  output[_out++] = from_source[from++];
                  len -= 3;
                }
                if (len) {
                  output[_out++] = from_source[from++];
                  if (len > 1) {
                    output[_out++] = from_source[from++];
                  }
                }
              } else {
                from = _out - dist;
                do {
                  output[_out++] = output[from++];
                  output[_out++] = output[from++];
                  output[_out++] = output[from++];
                  len -= 3;
                } while (len > 2);
                if (len) {
                  output[_out++] = output[from++];
                  if (len > 1) {
                    output[_out++] = output[from++];
                  }
                }
              }
            } else if ((op & 64) === 0) {
              here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
              continue dodist;
            } else {
              strm.msg = "invalid distance code";
              state.mode = BAD;
              break top;
            }
            break;
          }
        } else if ((op & 64) === 0) {
          here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
          continue dolen;
        } else if (op & 32) {
          state.mode = TYPE;
          break top;
        } else {
          strm.msg = "invalid literal/length code";
          state.mode = BAD;
          break top;
        }
        break;
      }
    } while (_in < last && _out < end);
    len = bits >> 3;
    _in -= len;
    bits -= len << 3;
    hold &= (1 << bits) - 1;
    strm.next_in = _in;
    strm.next_out = _out;
    strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
    strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
    state.hold = hold;
    state.bits = bits;
    return;
  }

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/zlib/inftrees.js
  var MAXBITS = 15;
  var ENOUGH_LENS = 852;
  var ENOUGH_DISTS = 592;
  var CODES = 0;
  var LENS = 1;
  var DISTS = 2;
  var lbase = [
    /* Length codes 257..285 base */
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    13,
    15,
    17,
    19,
    23,
    27,
    31,
    35,
    43,
    51,
    59,
    67,
    83,
    99,
    115,
    131,
    163,
    195,
    227,
    258,
    0,
    0
  ];
  var lext = [
    /* Length codes 257..285 extra */
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    17,
    17,
    17,
    17,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    20,
    20,
    20,
    20,
    21,
    21,
    21,
    21,
    16,
    72,
    78
  ];
  var dbase = [
    /* Distance codes 0..29 base */
    1,
    2,
    3,
    4,
    5,
    7,
    9,
    13,
    17,
    25,
    33,
    49,
    65,
    97,
    129,
    193,
    257,
    385,
    513,
    769,
    1025,
    1537,
    2049,
    3073,
    4097,
    6145,
    8193,
    12289,
    16385,
    24577,
    0,
    0
  ];
  var dext = [
    /* Distance codes 0..29 extra */
    16,
    16,
    16,
    16,
    17,
    17,
    18,
    18,
    19,
    19,
    20,
    20,
    21,
    21,
    22,
    22,
    23,
    23,
    24,
    24,
    25,
    25,
    26,
    26,
    27,
    27,
    28,
    28,
    29,
    29,
    64,
    64
  ];
  function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
    var bits = opts.bits;
    var len = 0;
    var sym = 0;
    var min = 0, max = 0;
    var root = 0;
    var curr = 0;
    var drop = 0;
    var left = 0;
    var used = 0;
    var huff = 0;
    var incr;
    var fill;
    var low;
    var mask;
    var next;
    var base = null;
    var base_index = 0;
    var end;
    var count = Buf16(MAXBITS + 1);
    var offs = Buf16(MAXBITS + 1);
    var extra = null;
    var extra_index = 0;
    var here_bits, here_op, here_val;
    for (len = 0; len <= MAXBITS; len++) {
      count[len] = 0;
    }
    for (sym = 0; sym < codes; sym++) {
      count[lens[lens_index + sym]]++;
    }
    root = bits;
    for (max = MAXBITS; max >= 1; max--) {
      if (count[max] !== 0) {
        break;
      }
    }
    if (root > max) {
      root = max;
    }
    if (max === 0) {
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      opts.bits = 1;
      return 0;
    }
    for (min = 1; min < max; min++) {
      if (count[min] !== 0) {
        break;
      }
    }
    if (root < min) {
      root = min;
    }
    left = 1;
    for (len = 1; len <= MAXBITS; len++) {
      left <<= 1;
      left -= count[len];
      if (left < 0) {
        return -1;
      }
    }
    if (left > 0 && (type === CODES || max !== 1)) {
      return -1;
    }
    offs[1] = 0;
    for (len = 1; len < MAXBITS; len++) {
      offs[len + 1] = offs[len] + count[len];
    }
    for (sym = 0; sym < codes; sym++) {
      if (lens[lens_index + sym] !== 0) {
        work[offs[lens[lens_index + sym]]++] = sym;
      }
    }
    if (type === CODES) {
      base = extra = work;
      end = 19;
    } else if (type === LENS) {
      base = lbase;
      base_index -= 257;
      extra = lext;
      extra_index -= 257;
      end = 256;
    } else {
      base = dbase;
      extra = dext;
      end = -1;
    }
    huff = 0;
    sym = 0;
    len = min;
    next = table_index;
    curr = root;
    drop = 0;
    low = -1;
    used = 1 << root;
    mask = used - 1;
    if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
      return 1;
    }
    for (; ; ) {
      here_bits = len - drop;
      if (work[sym] < end) {
        here_op = 0;
        here_val = work[sym];
      } else if (work[sym] > end) {
        here_op = extra[extra_index + work[sym]];
        here_val = base[base_index + work[sym]];
      } else {
        here_op = 32 + 64;
        here_val = 0;
      }
      incr = 1 << len - drop;
      fill = 1 << curr;
      min = fill;
      do {
        fill -= incr;
        table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
      } while (fill !== 0);
      incr = 1 << len - 1;
      while (huff & incr) {
        incr >>= 1;
      }
      if (incr !== 0) {
        huff &= incr - 1;
        huff += incr;
      } else {
        huff = 0;
      }
      sym++;
      if (--count[len] === 0) {
        if (len === max) {
          break;
        }
        len = lens[lens_index + work[sym]];
      }
      if (len > root && (huff & mask) !== low) {
        if (drop === 0) {
          drop = root;
        }
        next += min;
        curr = len - drop;
        left = 1 << curr;
        while (curr + drop < max) {
          left -= count[curr + drop];
          if (left <= 0) {
            break;
          }
          curr++;
          left <<= 1;
        }
        used += 1 << curr;
        if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
          return 1;
        }
        low = huff & mask;
        table[low] = root << 24 | curr << 16 | next - table_index | 0;
      }
    }
    if (huff !== 0) {
      table[next + huff] = len - drop << 24 | 64 << 16 | 0;
    }
    opts.bits = root;
    return 0;
  }

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/zlib/inflate.js
  var CODES2 = 0;
  var LENS2 = 1;
  var DISTS2 = 2;
  var Z_FINISH2 = 4;
  var Z_BLOCK = 5;
  var Z_TREES = 6;
  var Z_OK2 = 0;
  var Z_STREAM_END2 = 1;
  var Z_NEED_DICT2 = 2;
  var Z_STREAM_ERROR = -2;
  var Z_DATA_ERROR = -3;
  var Z_MEM_ERROR = -4;
  var Z_BUF_ERROR2 = -5;
  var Z_DEFLATED = 8;
  var HEAD = 1;
  var FLAGS = 2;
  var TIME = 3;
  var OS = 4;
  var EXLEN = 5;
  var EXTRA = 6;
  var NAME = 7;
  var COMMENT = 8;
  var HCRC = 9;
  var DICTID = 10;
  var DICT = 11;
  var TYPE2 = 12;
  var TYPEDO = 13;
  var STORED = 14;
  var COPY_ = 15;
  var COPY = 16;
  var TABLE = 17;
  var LENLENS = 18;
  var CODELENS = 19;
  var LEN_ = 20;
  var LEN = 21;
  var LENEXT = 22;
  var DIST = 23;
  var DISTEXT = 24;
  var MATCH = 25;
  var LIT = 26;
  var CHECK = 27;
  var LENGTH = 28;
  var DONE = 29;
  var BAD2 = 30;
  var MEM = 31;
  var SYNC = 32;
  var ENOUGH_LENS2 = 852;
  var ENOUGH_DISTS2 = 592;
  function zswap32(q) {
    return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
  }
  function InflateState() {
    this.mode = 0;
    this.last = false;
    this.wrap = 0;
    this.havedict = false;
    this.flags = 0;
    this.dmax = 0;
    this.check = 0;
    this.total = 0;
    this.head = null;
    this.wbits = 0;
    this.wsize = 0;
    this.whave = 0;
    this.wnext = 0;
    this.window = null;
    this.hold = 0;
    this.bits = 0;
    this.length = 0;
    this.offset = 0;
    this.extra = 0;
    this.lencode = null;
    this.distcode = null;
    this.lenbits = 0;
    this.distbits = 0;
    this.ncode = 0;
    this.nlen = 0;
    this.ndist = 0;
    this.have = 0;
    this.next = null;
    this.lens = Buf16(320);
    this.work = Buf16(288);
    this.lendyn = null;
    this.distdyn = null;
    this.sane = 0;
    this.back = 0;
    this.was = 0;
  }
  function inflateResetKeep(strm) {
    var state;
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR;
    }
    state = strm.state;
    strm.total_in = strm.total_out = state.total = 0;
    strm.msg = "";
    if (state.wrap) {
      strm.adler = state.wrap & 1;
    }
    state.mode = HEAD;
    state.last = 0;
    state.havedict = 0;
    state.dmax = 32768;
    state.head = null;
    state.hold = 0;
    state.bits = 0;
    state.lencode = state.lendyn = Buf32(ENOUGH_LENS2);
    state.distcode = state.distdyn = Buf32(ENOUGH_DISTS2);
    state.sane = 1;
    state.back = -1;
    return Z_OK2;
  }
  function inflateReset(strm) {
    var state;
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR;
    }
    state = strm.state;
    state.wsize = 0;
    state.whave = 0;
    state.wnext = 0;
    return inflateResetKeep(strm);
  }
  function inflateReset2(strm, windowBits) {
    var wrap;
    var state;
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR;
    }
    state = strm.state;
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else {
      wrap = (windowBits >> 4) + 1;
      if (windowBits < 48) {
        windowBits &= 15;
      }
    }
    if (windowBits && (windowBits < 8 || windowBits > 15)) {
      return Z_STREAM_ERROR;
    }
    if (state.window !== null && state.wbits !== windowBits) {
      state.window = null;
    }
    state.wrap = wrap;
    state.wbits = windowBits;
    return inflateReset(strm);
  }
  function inflateInit2(strm, windowBits) {
    var ret;
    var state;
    if (!strm) {
      return Z_STREAM_ERROR;
    }
    state = new InflateState();
    strm.state = state;
    state.window = null;
    ret = inflateReset2(strm, windowBits);
    if (ret !== Z_OK2) {
      strm.state = null;
    }
    return ret;
  }
  var virgin = true;
  var lenfix;
  var distfix;
  function fixedtables(state) {
    if (virgin) {
      var sym;
      lenfix = Buf32(512);
      distfix = Buf32(32);
      sym = 0;
      while (sym < 144) {
        state.lens[sym++] = 8;
      }
      while (sym < 256) {
        state.lens[sym++] = 9;
      }
      while (sym < 280) {
        state.lens[sym++] = 7;
      }
      while (sym < 288) {
        state.lens[sym++] = 8;
      }
      inflate_table(LENS2, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
      sym = 0;
      while (sym < 32) {
        state.lens[sym++] = 5;
      }
      inflate_table(DISTS2, state.lens, 0, 32, distfix, 0, state.work, {
        bits: 5
      });
      virgin = false;
    }
    state.lencode = lenfix;
    state.lenbits = 9;
    state.distcode = distfix;
    state.distbits = 5;
  }
  function updatewindow(strm, src, end, copy) {
    var dist;
    var state = strm.state;
    if (state.window === null) {
      state.wsize = 1 << state.wbits;
      state.wnext = 0;
      state.whave = 0;
      state.window = Buf8(state.wsize);
    }
    if (copy >= state.wsize) {
      arraySet(state.window, src, end - state.wsize, state.wsize, 0);
      state.wnext = 0;
      state.whave = state.wsize;
    } else {
      dist = state.wsize - state.wnext;
      if (dist > copy) {
        dist = copy;
      }
      arraySet(state.window, src, end - copy, dist, state.wnext);
      copy -= dist;
      if (copy) {
        arraySet(state.window, src, end - copy, copy, 0);
        state.wnext = copy;
        state.whave = state.wsize;
      } else {
        state.wnext += dist;
        if (state.wnext === state.wsize) {
          state.wnext = 0;
        }
        if (state.whave < state.wsize) {
          state.whave += dist;
        }
      }
    }
    return 0;
  }
  function inflate(strm, flush) {
    var state;
    var input, output;
    var next;
    var put;
    var have, left;
    var hold;
    var bits;
    var _in, _out;
    var copy;
    var from;
    var from_source;
    var here = 0;
    var here_bits, here_op, here_val;
    var last_bits, last_op, last_val;
    var len;
    var ret;
    var hbuf = Buf8(4);
    var opts;
    var n;
    var order = (
      /* permutation of code lengths */
      [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
    );
    if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
      return Z_STREAM_ERROR;
    }
    state = strm.state;
    if (state.mode === TYPE2) {
      state.mode = TYPEDO;
    }
    put = strm.next_out;
    output = strm.output;
    left = strm.avail_out;
    next = strm.next_in;
    input = strm.input;
    have = strm.avail_in;
    hold = state.hold;
    bits = state.bits;
    _in = have;
    _out = left;
    ret = Z_OK2;
    inf_leave: for (; ; ) {
      switch (state.mode) {
        case HEAD:
          if (state.wrap === 0) {
            state.mode = TYPEDO;
            break;
          }
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.wrap & 2 && hold === 35615) {
            state.check = 0;
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32(state.check, hbuf, 2, 0);
            hold = 0;
            bits = 0;
            state.mode = FLAGS;
            break;
          }
          state.flags = 0;
          if (state.head) {
            state.head.done = false;
          }
          if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
            strm.msg = "incorrect header check";
            state.mode = BAD2;
            break;
          }
          if ((hold & 15) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD2;
            break;
          }
          hold >>>= 4;
          bits -= 4;
          len = (hold & 15) + 8;
          if (state.wbits === 0) {
            state.wbits = len;
          } else if (len > state.wbits) {
            strm.msg = "invalid window size";
            state.mode = BAD2;
            break;
          }
          state.dmax = 1 << len;
          strm.adler = state.check = 1;
          state.mode = hold & 512 ? DICTID : TYPE2;
          hold = 0;
          bits = 0;
          break;
        case FLAGS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.flags = hold;
          if ((state.flags & 255) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD2;
            break;
          }
          if (state.flags & 57344) {
            strm.msg = "unknown header flags set";
            state.mode = BAD2;
            break;
          }
          if (state.head) {
            state.head.text = hold >> 8 & 1;
          }
          if (state.flags & 512) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = TIME;
        /* falls through */
        case TIME:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) {
            state.head.time = hold;
          }
          if (state.flags & 512) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            hbuf[2] = hold >>> 16 & 255;
            hbuf[3] = hold >>> 24 & 255;
            state.check = crc32(state.check, hbuf, 4, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = OS;
        /* falls through */
        case OS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) {
            state.head.xflags = hold & 255;
            state.head.os = hold >> 8;
          }
          if (state.flags & 512) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = EXLEN;
        /* falls through */
        case EXLEN:
          if (state.flags & 1024) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length = hold;
            if (state.head) {
              state.head.extra_len = hold;
            }
            if (state.flags & 512) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
          } else if (state.head) {
            state.head.extra = null;
          }
          state.mode = EXTRA;
        /* falls through */
        case EXTRA:
          if (state.flags & 1024) {
            copy = state.length;
            if (copy > have) {
              copy = have;
            }
            if (copy) {
              if (state.head) {
                len = state.head.extra_len - state.length;
                if (!state.head.extra) {
                  state.head.extra = new Array(state.head.extra_len);
                }
                arraySet(
                  state.head.extra,
                  input,
                  next,
                  // extra field is limited to 65536 bytes
                  // - no need for additional size check
                  copy,
                  /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                  len
                );
              }
              if (state.flags & 512) {
                state.check = crc32(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              state.length -= copy;
            }
            if (state.length) {
              break inf_leave;
            }
          }
          state.length = 0;
          state.mode = NAME;
        /* falls through */
        case NAME:
          if (state.flags & 2048) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.name += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512) {
              state.check = crc32(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.name = null;
          }
          state.length = 0;
          state.mode = COMMENT;
        /* falls through */
        case COMMENT:
          if (state.flags & 4096) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.comment += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512) {
              state.check = crc32(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.comment = null;
          }
          state.mode = HCRC;
        /* falls through */
        case HCRC:
          if (state.flags & 512) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (hold !== (state.check & 65535)) {
              strm.msg = "header crc mismatch";
              state.mode = BAD2;
              break;
            }
            hold = 0;
            bits = 0;
          }
          if (state.head) {
            state.head.hcrc = state.flags >> 9 & 1;
            state.head.done = true;
          }
          strm.adler = state.check = 0;
          state.mode = TYPE2;
          break;
        case DICTID:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          strm.adler = state.check = zswap32(hold);
          hold = 0;
          bits = 0;
          state.mode = DICT;
        /* falls through */
        case DICT:
          if (state.havedict === 0) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            return Z_NEED_DICT2;
          }
          strm.adler = state.check = 1;
          state.mode = TYPE2;
        /* falls through */
        case TYPE2:
          if (flush === Z_BLOCK || flush === Z_TREES) {
            break inf_leave;
          }
        /* falls through */
        case TYPEDO:
          if (state.last) {
            hold >>>= bits & 7;
            bits -= bits & 7;
            state.mode = CHECK;
            break;
          }
          while (bits < 3) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.last = hold & 1;
          hold >>>= 1;
          bits -= 1;
          switch (hold & 3) {
            case 0:
              state.mode = STORED;
              break;
            case 1:
              fixedtables(state);
              state.mode = LEN_;
              if (flush === Z_TREES) {
                hold >>>= 2;
                bits -= 2;
                break inf_leave;
              }
              break;
            case 2:
              state.mode = TABLE;
              break;
            case 3:
              strm.msg = "invalid block type";
              state.mode = BAD2;
          }
          hold >>>= 2;
          bits -= 2;
          break;
        case STORED:
          hold >>>= bits & 7;
          bits -= bits & 7;
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
            strm.msg = "invalid stored block lengths";
            state.mode = BAD2;
            break;
          }
          state.length = hold & 65535;
          hold = 0;
          bits = 0;
          state.mode = COPY_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        /* falls through */
        case COPY_:
          state.mode = COPY;
        /* falls through */
        case COPY:
          copy = state.length;
          if (copy) {
            if (copy > have) {
              copy = have;
            }
            if (copy > left) {
              copy = left;
            }
            if (copy === 0) {
              break inf_leave;
            }
            arraySet(output, input, next, copy, put);
            have -= copy;
            next += copy;
            left -= copy;
            put += copy;
            state.length -= copy;
            break;
          }
          state.mode = TYPE2;
          break;
        case TABLE:
          while (bits < 14) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.nlen = (hold & 31) + 257;
          hold >>>= 5;
          bits -= 5;
          state.ndist = (hold & 31) + 1;
          hold >>>= 5;
          bits -= 5;
          state.ncode = (hold & 15) + 4;
          hold >>>= 4;
          bits -= 4;
          if (state.nlen > 286 || state.ndist > 30) {
            strm.msg = "too many length or distance symbols";
            state.mode = BAD2;
            break;
          }
          state.have = 0;
          state.mode = LENLENS;
        /* falls through */
        case LENLENS:
          while (state.have < state.ncode) {
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.lens[order[state.have++]] = hold & 7;
            hold >>>= 3;
            bits -= 3;
          }
          while (state.have < 19) {
            state.lens[order[state.have++]] = 0;
          }
          state.lencode = state.lendyn;
          state.lenbits = 7;
          opts = { bits: state.lenbits };
          ret = inflate_table(CODES2, state.lens, 0, 19, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid code lengths set";
            state.mode = BAD2;
            break;
          }
          state.have = 0;
          state.mode = CODELENS;
        /* falls through */
        case CODELENS:
          while (state.have < state.nlen + state.ndist) {
            for (; ; ) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (here_val < 16) {
              hold >>>= here_bits;
              bits -= here_bits;
              state.lens[state.have++] = here_val;
            } else {
              if (here_val === 16) {
                n = here_bits + 2;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                if (state.have === 0) {
                  strm.msg = "invalid bit length repeat";
                  state.mode = BAD2;
                  break;
                }
                len = state.lens[state.have - 1];
                copy = 3 + (hold & 3);
                hold >>>= 2;
                bits -= 2;
              } else if (here_val === 17) {
                n = here_bits + 3;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 3 + (hold & 7);
                hold >>>= 3;
                bits -= 3;
              } else {
                n = here_bits + 7;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 11 + (hold & 127);
                hold >>>= 7;
                bits -= 7;
              }
              if (state.have + copy > state.nlen + state.ndist) {
                strm.msg = "invalid bit length repeat";
                state.mode = BAD2;
                break;
              }
              while (copy--) {
                state.lens[state.have++] = len;
              }
            }
          }
          if (state.mode === BAD2) {
            break;
          }
          if (state.lens[256] === 0) {
            strm.msg = "invalid code -- missing end-of-block";
            state.mode = BAD2;
            break;
          }
          state.lenbits = 9;
          opts = { bits: state.lenbits };
          ret = inflate_table(LENS2, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid literal/lengths set";
            state.mode = BAD2;
            break;
          }
          state.distbits = 6;
          state.distcode = state.distdyn;
          opts = { bits: state.distbits };
          ret = inflate_table(DISTS2, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
          state.distbits = opts.bits;
          if (ret) {
            strm.msg = "invalid distances set";
            state.mode = BAD2;
            break;
          }
          state.mode = LEN_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        /* falls through */
        case LEN_:
          state.mode = LEN;
        /* falls through */
        case LEN:
          if (have >= 6 && left >= 258) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            inflate_fast(strm, _out);
            put = strm.next_out;
            output = strm.output;
            left = strm.avail_out;
            next = strm.next_in;
            input = strm.input;
            have = strm.avail_in;
            hold = state.hold;
            bits = state.bits;
            if (state.mode === TYPE2) {
              state.back = -1;
            }
            break;
          }
          state.back = 0;
          for (; ; ) {
            here = state.lencode[hold & (1 << state.lenbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (here_op && (here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          state.length = here_val;
          if (here_op === 0) {
            state.mode = LIT;
            break;
          }
          if (here_op & 32) {
            state.back = -1;
            state.mode = TYPE2;
            break;
          }
          if (here_op & 64) {
            strm.msg = "invalid literal/length code";
            state.mode = BAD2;
            break;
          }
          state.extra = here_op & 15;
          state.mode = LENEXT;
        /* falls through */
        case LENEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          state.was = state.length;
          state.mode = DIST;
        /* falls through */
        case DIST:
          for (; ; ) {
            here = state.distcode[hold & (1 << state.distbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          if (here_op & 64) {
            strm.msg = "invalid distance code";
            state.mode = BAD2;
            break;
          }
          state.offset = here_val;
          state.extra = here_op & 15;
          state.mode = DISTEXT;
        /* falls through */
        case DISTEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.offset += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          if (state.offset > state.dmax) {
            strm.msg = "invalid distance too far back";
            state.mode = BAD2;
            break;
          }
          state.mode = MATCH;
        /* falls through */
        case MATCH:
          if (left === 0) {
            break inf_leave;
          }
          copy = _out - left;
          if (state.offset > copy) {
            copy = state.offset - copy;
            if (copy > state.whave) {
              if (state.sane) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD2;
                break;
              }
            }
            if (copy > state.wnext) {
              copy -= state.wnext;
              from = state.wsize - copy;
            } else {
              from = state.wnext - copy;
            }
            if (copy > state.length) {
              copy = state.length;
            }
            from_source = state.window;
          } else {
            from_source = output;
            from = put - state.offset;
            copy = state.length;
          }
          if (copy > left) {
            copy = left;
          }
          left -= copy;
          state.length -= copy;
          do {
            output[put++] = from_source[from++];
          } while (--copy);
          if (state.length === 0) {
            state.mode = LEN;
          }
          break;
        case LIT:
          if (left === 0) {
            break inf_leave;
          }
          output[put++] = state.length;
          left--;
          state.mode = LEN;
          break;
        case CHECK:
          if (state.wrap) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold |= input[next++] << bits;
              bits += 8;
            }
            _out -= left;
            strm.total_out += _out;
            state.total += _out;
            if (_out) {
              strm.adler = state.check = /*UPDATE(state.check, put - _out, _out);*/
              state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
            }
            _out = left;
            if ((state.flags ? hold : zswap32(hold)) !== state.check) {
              strm.msg = "incorrect data check";
              state.mode = BAD2;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = LENGTH;
        /* falls through */
        case LENGTH:
          if (state.wrap && state.flags) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (hold !== (state.total & 4294967295)) {
              strm.msg = "incorrect length check";
              state.mode = BAD2;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = DONE;
        /* falls through */
        case DONE:
          ret = Z_STREAM_END2;
          break inf_leave;
        case BAD2:
          ret = Z_DATA_ERROR;
          break inf_leave;
        case MEM:
          return Z_MEM_ERROR;
        case SYNC:
        /* falls through */
        default:
          return Z_STREAM_ERROR;
      }
    }
    strm.next_out = put;
    strm.avail_out = left;
    strm.next_in = next;
    strm.avail_in = have;
    state.hold = hold;
    state.bits = bits;
    if (state.wsize || _out !== strm.avail_out && state.mode < BAD2 && (state.mode < CHECK || flush !== Z_FINISH2)) {
      if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
        state.mode = MEM;
        return Z_MEM_ERROR;
      }
    }
    _in -= strm.avail_in;
    _out -= strm.avail_out;
    strm.total_in += _in;
    strm.total_out += _out;
    state.total += _out;
    if (state.wrap && _out) {
      strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
      state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
    }
    strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE2 ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
    if ((_in === 0 && _out === 0 || flush === Z_FINISH2) && ret === Z_OK2) {
      ret = Z_BUF_ERROR2;
    }
    return ret;
  }
  function inflateEnd(strm) {
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR;
    }
    var state = strm.state;
    if (state.window) {
      state.window = null;
    }
    strm.state = null;
    return Z_OK2;
  }
  function inflateGetHeader(strm, head) {
    var state;
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR;
    }
    state = strm.state;
    if ((state.wrap & 2) === 0) {
      return Z_STREAM_ERROR;
    }
    state.head = head;
    head.done = false;
    return Z_OK2;
  }
  function inflateSetDictionary(strm, dictionary) {
    var dictLength = dictionary.length;
    var state;
    var dictid;
    var ret;
    if (!strm || !strm.state) {
      return Z_STREAM_ERROR;
    }
    state = strm.state;
    if (state.wrap !== 0 && state.mode !== DICT) {
      return Z_STREAM_ERROR;
    }
    if (state.mode === DICT) {
      dictid = 1;
      dictid = adler32(dictid, dictionary, dictLength, 0);
      if (dictid !== state.check) {
        return Z_DATA_ERROR;
      }
    }
    ret = updatewindow(strm, dictionary, dictLength, dictLength);
    if (ret) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
    state.havedict = 1;
    return Z_OK2;
  }

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/zlib/messages.js
  var messages_default = {
    2: "need dictionary",
    1: "stream end",
    0: "",
    "-1": "file error",
    "-2": "stream error",
    "-3": "data error",
    "-4": "insufficient memory",
    "-5": "buffer error",
    "-6": "incompatible version"
  };

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/zlib/zstream.js
  function ZStream() {
    this.input = null;
    this.next_in = 0;
    this.avail_in = 0;
    this.total_in = 0;
    this.output = null;
    this.next_out = 0;
    this.avail_out = 0;
    this.total_out = 0;
    this.msg = "";
    this.state = null;
    this.data_type = 2;
    this.adler = 0;
  }

  // node_modules/.pnpm/pako-esm2@2.0.2/node_modules/pako-esm2/esm/inflate.js
  var toString = Object.prototype.toString;
  var Inflate = class _Inflate {
    constructor(options) {
      if (!(this instanceof _Inflate))
        return new _Inflate(options);
      this.options = assign({
        chunkSize: 16384,
        windowBits: 0,
        to: ""
      }, options || {});
      var opt = this.options;
      if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
        opt.windowBits = -opt.windowBits;
        if (opt.windowBits === 0) {
          opt.windowBits = -15;
        }
      }
      if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
        opt.windowBits += 32;
      }
      if (opt.windowBits > 15 && opt.windowBits < 48) {
        if ((opt.windowBits & 15) === 0) {
          opt.windowBits |= 15;
        }
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream();
      this.strm.avail_out = 0;
      var status = inflateInit2(this.strm, opt.windowBits);
      if (status !== Z_OK) {
        throw new Error(messages_default[status]);
      }
      this.header = new GZheader();
      inflateGetHeader(this.strm, this.header);
      if (opt.dictionary) {
        if (typeof opt.dictionary === "string") {
          opt.dictionary = string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
          opt.dictionary = new Uint8Array(opt.dictionary);
        }
        if (opt.raw) {
          status = inflateSetDictionary(this.strm, opt.dictionary);
          if (status !== Z_OK) {
            throw new Error(messages_default[status]);
          }
        }
      }
    }
    /**
     * Inflate#push(data[, mode]) -> Boolean
     * - data (Uint8Array|Array|ArrayBuffer|String): input data
     * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
     *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
     *
     * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
     * new output chunks. Returns `true` on success. The last data block must have
     * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
     * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
     * can use mode Z_SYNC_FLUSH, keeping the decompression context.
     *
     * On fail call [[Inflate#onEnd]] with error code and return false.
     *
     * We strongly recommend to use `Uint8Array` on input for best speed (output
     * format is detected automatically). Also, don't skip last param and always
     * use the same type in your code (boolean or number). That will improve JS speed.
     *
     * For regular `Array`-s make sure all elements are [0..255].
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/
    push(data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var dictionary = this.options.dictionary;
      var status, _mode;
      var next_out_utf8, tail, utf8str;
      var dict;
      var allowBufError = false;
      if (this.ended) {
        return false;
      }
      _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = binstring2buf(data);
      } else if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      do {
        if (strm.avail_out === 0) {
          strm.output = Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = inflate(strm, Z_NO_FLUSH);
        if (status === Z_NEED_DICT && dictionary) {
          if (typeof dictionary === "string") {
            dict = string2buf(dictionary);
          } else if (toString.call(dictionary) === "[object ArrayBuffer]") {
            dict = new Uint8Array(dictionary);
          } else {
            dict = dictionary;
          }
          status = inflateSetDictionary(this.strm, dict);
        }
        if (status === Z_BUF_ERROR && allowBufError === true) {
          status = Z_OK;
          allowBufError = false;
        }
        if (status !== Z_STREAM_END && status !== Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.next_out) {
          if (strm.avail_out === 0 || status === Z_STREAM_END || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
            if (this.options.to === "string") {
              next_out_utf8 = utf8border(strm.output, strm.next_out);
              tail = strm.next_out - next_out_utf8;
              utf8str = buf2string(strm.output, next_out_utf8);
              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) {
                arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
              }
              this.onData(utf8str);
            } else {
              this.onData(shrinkBuf(strm.output, strm.next_out));
            }
          }
        }
        if (strm.avail_in === 0 && strm.avail_out === 0) {
          allowBufError = true;
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
      if (status === Z_STREAM_END) {
        _mode = Z_FINISH;
      }
      if (_mode === Z_FINISH) {
        status = inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK;
      }
      if (_mode === Z_SYNC_FLUSH) {
        this.onEnd(Z_OK);
        strm.avail_out = 0;
        return true;
      }
      return true;
    }
    /**
     * Inflate#onData(chunk) -> Void
     * - chunk (Uint8Array|Array|String): output data. Type of array depends
     *   on js engine support. When string output requested, each chunk
     *   will be string.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/
    onData(chunk) {
      this.chunks.push(chunk);
    }
    /**
     * Inflate#onEnd(status) -> Void
     * - status (Number): inflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called either after you tell inflate that the input stream is
     * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
     * or if an error happened. By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/
    onEnd(status) {
      if (status === Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    }
  };
  function inflate2(input, options) {
    var inflator = new Inflate(options);
    inflator.push(input, true);
    if (inflator.err) {
      throw inflator.msg || messages_default[inflator.err];
    }
    return inflator.result;
  }
  var ungzip = inflate2;

  // node_modules/.pnpm/@gmod+bgzf-filehandle@6.7.0/node_modules/@gmod/bgzf-filehandle/esm/bgzfBlockScan.js
  var BGZF_HEADER_SIZE = 18;
  var BGZF_TRAILER_SIZE = 8;
  var BGZF_MIN_BLOCK_SIZE = BGZF_HEADER_SIZE + BGZF_TRAILER_SIZE;
  function scanBgzfBlocks(input, minBlockPosition, maxBlockPosition) {
    const blocks = [];
    let offset = 0;
    let filePosition = minBlockPosition;
    while (offset + BGZF_MIN_BLOCK_SIZE <= input.length) {
      if (input[offset] !== 31 || input[offset + 1] !== 139 || input[offset + 2] !== 8 || input[offset + 3] !== 4) {
        break;
      }
      if (input[offset + 10] !== 6 || input[offset + 12] !== 66 || input[offset + 13] !== 67) {
        break;
      }
      const bsize = (input[offset + 16] | input[offset + 17] << 8) + 1;
      if (bsize < BGZF_MIN_BLOCK_SIZE || offset + bsize > input.length) {
        break;
      }
      const trailerPos = offset + bsize - BGZF_TRAILER_SIZE;
      const isize = (input[trailerPos + 4] | input[trailerPos + 5] << 8 | input[trailerPos + 6] << 16 | input[trailerPos + 7] << 24) >>> 0;
      blocks.push({
        inputOffset: offset,
        compressedSize: bsize,
        decompressedSize: isize,
        filePosition
      });
      if (filePosition >= maxBlockPosition) {
        break;
      }
      offset += bsize;
      filePosition += bsize;
    }
    return blocks;
  }

  // node_modules/.pnpm/@gmod+bgzf-filehandle@6.7.0/node_modules/@gmod/bgzf-filehandle/esm/util.js
  function concatUint8Array(args) {
    let total = 0;
    for (const entry of args) {
      total += entry.length;
    }
    const mergedArray = new Uint8Array(total);
    let offset = 0;
    for (const entry of args) {
      mergedArray.set(entry, offset);
      offset += entry.length;
    }
    return mergedArray;
  }

  // node_modules/.pnpm/@gmod+bgzf-filehandle@6.7.0/node_modules/@gmod/bgzf-filehandle/esm/wasm/bgzf-wasm-inlined.js
  var __webpack_require__ = {};
  (() => {
    __webpack_require__.d = (exports, definition) => {
      if (Array.isArray(definition)) {
        var i = 0;
        while (i < definition.length) {
          var key = definition[i++];
          var binding = definition[i++];
          if (!__webpack_require__.o(exports, key)) {
            if (binding === 0) {
              Object.defineProperty(exports, key, { enumerable: true, value: definition[i++] });
            } else {
              Object.defineProperty(exports, key, { enumerable: true, get: binding });
            }
          } else if (binding === 0) {
            i++;
          }
        }
      } else {
        for (var key in definition) {
          if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
            Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
          }
        }
      }
    };
  })();
  (() => {
    __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
  })();
  (() => {
    __webpack_require__.r = (exports) => {
      if (Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
      }
      Object.defineProperty(exports, "__esModule", { value: true });
    };
  })();
  var bgzf_wasm_bg_namespaceObject = {};
  __webpack_require__.r(bgzf_wasm_bg_namespaceObject);
  __webpack_require__.d(bgzf_wasm_bg_namespaceObject, {
    ChunkSliceResult: () => ChunkSliceResult,
    __wbg_Error_92b29b0548f8b746: () => __wbg_Error_92b29b0548f8b746,
    __wbg___wbindgen_throw_344f42d3211c4765: () => __wbg___wbindgen_throw_344f42d3211c4765,
    __wbg_set_wasm: () => __wbg_set_wasm,
    decompress_all: () => decompress_all,
    decompress_chunk_slice: () => decompress_chunk_slice
  });
  var wasm_bgzf_wasm_bg_namespaceObject = "data:application/wasm;base64,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AghBAUEAEBUACywCAX8BfiMAQRBrIgEkACAAKQIAIQIgASAANgIMIAEgAjcCBCABQQRqEGYACyMBAX8jAEEQayICJAAgAiABNgIMIAIgADYCCCACQQhqEGUACyAAAkAgASgCAEUNACAAQbiXwAA2AgQgACABNgIADwsACx4BAX8CQCAAKAIAIgJFDQAgASACIAAoAgQQTQ8LAAsbAQF/EGogAEEEakEEEFgiASAANgIAIAFBBGoLHgEBfwJAIAAoAgAiAUEBSA0AIAAoAgQgAUEBEFMLCx4AIAAoAgAgACgCBEEAKALomkAiAEEEIAAbEQQAAAsjAQF/AkBBhIrAABAtIgANAEG4icAAQTpB9InAABA4AAsgAAsXAAJAIABBf2pBfk8NACABIABBARBTCwscAQF/AkAgACgCACIBRQ0AIAAoAgQgAUEBEFMLCxcAAkAgAUEJSQ0AIAEgABAODwsgABACCxUAIABBfGoiACAAKAIAQQRqQQQQUwsUAAJAIABFDQAgACABEF8ACxBWAAsRACAAIAFBAXRBAXIgAhAxAAsSAAJAIAFFDQAgACABIAIQUwsLEgAgACABIAIgAyAEQQAgBRADCxUAAkAgAEUNACAAIAAoAqhaEQIACwsaACAAQQApAoSWQDcCCCAAQQApAvyVQDcCAAsaACAAQQApAvSVQDcCCCAAQQApAuyVQDcCAAsWACAAKAIAIAEgAiAAKAIEKAIMEQcACw0AIAAgASACIAMQBw8LFABBACAANgK8mkBBAEEBNgK4mkALEwAgAEG4l8AANgIEIAAgATYCAAsQACABIAAoAgAgACgCBBBNCxAAIAEgACgCACAAKAIEEAoLCwAgACABIAIQKg8LCgAgACABEGkaAAsPACAAQZyVwAAgASACEAwLEQBBkJjAAEEjQaSYwAAQMQALCwAgACMAaiQAIwALCQAgACABEEQPCwkAIAAgARAuDwsJACAAIAEQYQALDABBr4fAAEEbEFoACw0AQcqHwABBzwAQWgALCQAgASAAEDsACwwAIAAgASkCADcDAAsJACABIAAQXQALDQAgAUH8mcAAQRgQCgsIACAAIAEQAAsIACAAIAEQAQsJACAAKAIAEEoLBwAgABA5AAsHACAAEEAACwcAIAAQJgALCwBBAEEBOgDAnkALCQAgAEEANgIACwUAEGsACwMADwsDAAALAgALC74aAgBBgIDAAAuUGkF0dGVtcHRlZCB0byBpbml0aWFsaXplIHRocmVhZC1sb2NhbCB3aGlsZSBpdCBpcyBiZWluZyBkcm9wcGVkFnNsaWNlIGluZGV4IHN0YXJ0cyBhdCDADSBidXQgZW5kcyBhdCDAABJyYW5nZSBzdGFydCBpbmRleCDAIiBvdXQgb2YgcmFuZ2UgZm9yIHNsaWNlIG9mIGxlbmd0aCDAABByYW5nZSBlbmQgaW5kZXggwCIgb3V0IG9mIHJhbmdlIGZvciBzbGljZSBvZiBsZW5ndGggwAAvcnVzdGMvNDhhMjI5Y2VhZWZkNDk4NWM1MDk5MGIxNDExNmI2ZDg1NmFmMDk4NS9saWJyYXJ5L3N0ZC9zcmMvc3lzL3RocmVhZF9sb2NhbC9ub190aHJlYWRzLnJzAC9ydXN0Yy80OGEyMjljZWFlZmQ0OTg1YzUwOTkwYjE0MTE2YjZkODU2YWYwOTg1L2xpYnJhcnkvc3RkL3NyYy9zeXMvc3luYy9yd2xvY2svbm9fdGhyZWFkcy5ycwAvaG9tZS9ydW5uZXIvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi93YXNtLWJpbmRnZW4tMC4yLjEyNi9zcmMvZXh0ZXJucmVmLnJzAC9ydXN0Yy80OGEyMjljZWFlZmQ0OTg1YzUwOTkwYjE0MTE2YjZkODU2YWYwOTg1L2xpYnJhcnkvYWxsb2Mvc3JjL3Jhd192ZWMvbW9kLnJzAC9ydXN0L2RlcHMvZGxtYWxsb2MtMC4yLjEzL3NyYy9kbG1hbGxvYy5ycwAvaG9tZS9ydW5uZXIvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi9saWJkZWZsYXRlci0xLjI1LjIvc3JjL2xpYi5ycwAA1gAQAF4AAABrAAAADQAAAMwCEAAKAAAAHAAAACQAAADMAhAACgAAAMIAAAApAAAAzAIQAAoAAAC2AAAAJwAAAMwCEAAKAAAAcQAAABwAAADMAhAACgAAAG0AAABBAAAAZGVjb21wcmVzc2lvbiBmYWlsZWRpbnZhbGlkIGJnemYgaGVhZGVyAMwCEAAKAAAATAAAAD0A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";
  var ChunkSliceResult = class _ChunkSliceResult {
    static __wrap(ptr) {
      const obj = Object.create(_ChunkSliceResult.prototype);
      obj.__wbg_ptr = ptr;
      ChunkSliceResultFinalization.register(obj, obj.__wbg_ptr, obj);
      return obj;
    }
    __destroy_into_raw() {
      const ptr = this.__wbg_ptr;
      this.__wbg_ptr = 0;
      ChunkSliceResultFinalization.unregister(this);
      return ptr;
    }
    free() {
      const ptr = this.__destroy_into_raw();
      wasm.__wbg_chunksliceresult_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    take_buffer() {
      try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.chunksliceresult_take_buffer(retptr, this.__wbg_ptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 1, 1);
        return v1;
      } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
      }
    }
    /**
     * @returns {Float64Array}
     */
    take_cpositions() {
      try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.chunksliceresult_take_cpositions(retptr, this.__wbg_ptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v1;
      } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
      }
    }
    /**
     * @returns {Float64Array}
     */
    take_dpositions() {
      try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.chunksliceresult_take_dpositions(retptr, this.__wbg_ptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 8, 8);
        return v1;
      } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
      }
    }
  };
  if (Symbol.dispose)
    ChunkSliceResult.prototype[Symbol.dispose] = ChunkSliceResult.prototype.free;
  function decompress_all(input) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passArray8ToWasm0(input, wasm.__wbindgen_export2);
      const len0 = WASM_VECTOR_LEN;
      wasm.decompress_all(retptr, ptr0, len0);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
      var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
      if (r3) {
        throw takeObject(r2);
      }
      var v2 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_export(r0, r1 * 1, 1);
      return v2;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  function decompress_chunk_slice(input, min_block_position, min_data_position, max_block_position, max_data_position) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passArray8ToWasm0(input, wasm.__wbindgen_export2);
      const len0 = WASM_VECTOR_LEN;
      wasm.decompress_chunk_slice(retptr, ptr0, len0, min_block_position, min_data_position, max_block_position, max_data_position);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
      if (r2) {
        throw takeObject(r1);
      }
      return ChunkSliceResult.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  function __wbg_Error_92b29b0548f8b746(arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
  }
  function __wbg___wbindgen_throw_344f42d3211c4765(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  }
  var ChunkSliceResultFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((ptr) => wasm.__wbg_chunksliceresult_free(ptr, 1));
  function addHeapObject(obj) {
    if (heap_next === heap.length)
      heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];
    heap[idx] = obj;
    return idx;
  }
  function dropObject(idx) {
    if (idx < 1028)
      return;
    heap[idx] = heap_next;
    heap_next = idx;
  }
  function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
  }
  function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
  }
  var cachedDataViewMemory0 = null;
  function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
      cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
  }
  var cachedFloat64ArrayMemory0 = null;
  function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
      cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
  }
  function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
  }
  var cachedUint8ArrayMemory0 = null;
  function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
      cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
  }
  function getObject(idx) {
    return heap[idx];
  }
  var heap = new Array(1024).fill(void 0);
  heap.push(void 0, null, true, false);
  var heap_next = heap.length;
  function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
  }
  function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
  }
  var cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
  cachedTextDecoder.decode();
  var MAX_SAFARI_DECODE_BYTES = 2146435072;
  var numBytesDecoded = 0;
  function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
      cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
      cachedTextDecoder.decode();
      numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len).slice());
  }
  var WASM_VECTOR_LEN = 0;
  var wasm;
  function __wbg_set_wasm(val) {
    wasm = val;
  }
  var wrapper_wasm = null;
  var initPromise = null;
  async function init() {
    if (wrapper_wasm)
      return wrapper_wasm;
    if (!initPromise) {
      initPromise = (async () => {
        const response = await fetch(wasm_bgzf_wasm_bg_namespaceObject);
        const bytes = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(bytes, {
          "./bgzf_wasm_bg.js": bgzf_wasm_bg_namespaceObject
        });
        wrapper_wasm = instance.exports;
        __wbg_set_wasm(wrapper_wasm);
        return wrapper_wasm;
      })();
    }
    return initPromise;
  }
  async function decompressAll(input) {
    if (!wrapper_wasm) {
      await init();
    }
    return decompress_all(input);
  }
  async function decompressChunkSlice(input, minBlockPosition, minDataPosition, maxBlockPosition, maxDataPosition) {
    if (!wrapper_wasm) {
      await init();
    }
    const result = decompress_chunk_slice(input, minBlockPosition, minDataPosition, maxBlockPosition, maxDataPosition);
    const buffer = result.take_buffer();
    const cpositions = result.take_cpositions();
    const dpositions = result.take_dpositions();
    result.free();
    return { buffer, cpositions, dpositions };
  }

  // node_modules/.pnpm/@gmod+bgzf-filehandle@6.7.0/node_modules/@gmod/bgzf-filehandle/esm/unzip.js
  var BGZF_MIN_BLOCK_SIZE2 = 26;
  function hasGzipHeader(data) {
    return data[0] === 31 && data[1] === 139;
  }
  function hasBgzfHeader(data) {
    return data.length >= BGZF_MIN_BLOCK_SIZE2 && hasGzipHeader(data) && data[2] === 8 && data[3] === 4 && data[10] === 6 && data[12] === 66 && data[13] === 67;
  }
  function errorMessage(error) {
    return error instanceof Error ? error.message : `${error}`;
  }
  async function decompressGzip(inputData) {
    if (typeof DecompressionStream !== "undefined") {
      const stream = new Blob([inputData]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } else {
      return ungzip(inputData, void 0);
    }
  }
  function wrapGzipHeaderError(error) {
    if (errorMessage(error).includes("invalid gzip header")) {
      return new Error("problem decompressing block: incorrect gzip header check", { cause: error });
    }
    return error;
  }
  async function unzip(inputData) {
    if (inputData.length === 0) {
      return new Uint8Array(0);
    }
    if (!hasBgzfHeader(inputData)) {
      if (hasGzipHeader(inputData)) {
        return decompressGzip(inputData);
      }
      throw new Error("problem decompressing block: not a valid bgzf or gzip block");
    }
    try {
      return await decompressAll(inputData);
    } catch (error) {
      if (errorMessage(error).includes("invalid bgzf header")) {
        return decompressGzip(inputData);
      }
      throw wrapGzipHeaderError(error);
    }
  }
  function assembleChunkSliceResult(blocks, infos, minv, maxv) {
    const cpositions = [];
    const dpositions = [];
    const slices = [];
    let dpos = minv.dataPosition;
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const info = infos[i];
      const isLast = info.filePosition >= maxv.blockPosition;
      cpositions.push(info.filePosition);
      dpositions.push(dpos);
      const start = i === 0 ? minv.dataPosition : 0;
      const end = isLast ? Math.min(maxv.dataPosition + 1, block.length) : block.length;
      if (start < end) {
        slices.push(block.subarray(start, end));
      }
      dpos += block.length - start;
      if (isLast) {
        cpositions.push(info.filePosition + info.compressedSize);
        dpositions.push(dpos);
        break;
      }
    }
    return {
      buffer: concatUint8Array(slices),
      // Float64Array to match the wasm path's shape exactly — a caller must not
      // be able to tell which one produced its result
      cpositions: Float64Array.from(cpositions),
      dpositions: Float64Array.from(dpositions)
    };
  }
  var POOL_MIN_DECOMPRESSED_BYTES = 4e5;
  function decompressedBytes(blocks) {
    let total = 0;
    for (const block of blocks) {
      total += block.decompressedSize;
    }
    return total;
  }
  async function unzipChunkSlice(inputData, chunk, workerPool) {
    const { minv, maxv } = chunk;
    if (workerPool) {
      const blocks = scanBgzfBlocks(inputData, minv.blockPosition, maxv.blockPosition);
      if (decompressedBytes(blocks) >= POOL_MIN_DECOMPRESSED_BYTES) {
        const result = await workerPool.decompressBlocks(inputData, blocks);
        return assembleChunkSliceResult(result.blocks, blocks, minv, maxv);
      }
    }
    try {
      const result = await decompressChunkSlice(inputData, minv.blockPosition, minv.dataPosition, maxv.blockPosition, maxv.dataPosition);
      return {
        buffer: result.buffer,
        cpositions: result.cpositions,
        dpositions: result.dpositions
      };
    } catch (error) {
      throw wrapGzipHeaderError(error);
    }
  }

  // node_modules/.pnpm/@gmod+shared-read-cache@2.0.1/node_modules/@gmod/shared-read-cache/esm/throwIfAborted.js
  function throwIfAborted(signal) {
    if (signal?.aborted) {
      throw abortReason(signal);
    }
  }
  function abortReason(signal) {
    const reason = signal.reason;
    return reason === void 0 ? new DOMException("This operation was aborted", "AbortError") : reason;
  }

  // node_modules/.pnpm/@gmod+shared-read-cache@2.0.1/node_modules/@gmod/shared-read-cache/esm/SharedReadCache.js
  var SharedReadCache = class {
    constructor({
      fill,
      maxSize = Infinity,
      sizeOf = () => 1,
      cacheKey = (key) => String(key),
      idleTimeoutMs = 0,
      budget
      // Defaulted, because a cache with no options at all is a real shape and a
      // common one: the memo, whose fill is a closure passed per get() call. Five
      // of these exist across @gmod/bam, @gmod/tabix and indexedfasta-js, and
      // every one of them was written `new SharedReadCache({})`.
    } = {}) {
      __publicField(this, "entries", /* @__PURE__ */ new Map());
      __publicField(this, "total", 0);
      /**
       * How many of {@link entries} have settled. Maintained rather than counted,
       * because {@link evict} needs it on every settle and a cache sitting at its
       * ceiling is over the limit on every settle — so the O(entries) count it
       * replaces was the steady-state cost of having a budget at all. That count
       * measured 8.6us per read over 100 entries and 134us over 20,000; maintaining
       * it instead holds 7.4us and 14us across the same range.
       */
      __publicField(this, "settledCount", 0);
      __publicField(this, "limit");
      /** the budget this cache joined, and the handle it reports its weight by */
      __publicField(this, "shared");
      __publicField(this, "fill");
      __publicField(this, "sizeOf");
      __publicField(this, "toCacheKey");
      __publicField(this, "idleTimeoutMs");
      __publicField(this, "sweepTimer");
      this.fill = fill;
      this.limit = maxSize;
      this.shared = budget && { budget, membership: budget.register(this) };
      this.sizeOf = sizeOf;
      this.toCacheKey = cacheKey;
      this.idleTimeoutMs = idleTimeoutMs > 0 && Number.isFinite(idleTimeoutMs) ? idleTimeoutMs : void 0;
    }
    /** Number of entries held, including reads still in flight. */
    get size() {
      return this.entries.size;
    }
    /** Sum of {@link SharedReadCacheOptions.sizeOf} over the settled entries. */
    get totalSize() {
      return this.total;
    }
    get maxSize() {
      return this.limit;
    }
    /**
     * Accessor rather than a plain field so lowering the budget frees memory now.
     * As a field it did nothing until the next read happened to run the eviction
     * loop, which on an idle consumer is never.
     */
    set maxSize(maxSize) {
      this.limit = maxSize;
      this.evict();
    }
    /**
     * How many caller signals the entry under `key` is still holding. Exposed for
     * tests: an entry that has leaked a thousand stale signals answers every read
     * exactly like one that has not, so nothing else would notice.
     */
    waiterCount(key) {
      return this.entries.get(this.toCacheKey(key))?.pending?.signals.size ?? 0;
    }
    async get(key, signal, fill) {
      throwIfAborted(signal);
      const cacheKey = this.toCacheKey(key);
      let entry = this.entries.get(cacheKey);
      if (entry && this.isDoomed(entry)) {
        this.deleteKey(cacheKey);
        entry = void 0;
      }
      if (entry) {
        this.touch(cacheKey, entry);
      } else {
        entry = this.start(cacheKey, key, fill);
      }
      if (entry.pending) {
        this.join(entry.pending, signal);
      }
      try {
        return await this.settleFor(entry, signal);
      } finally {
        throwIfAborted(signal);
      }
    }
    /**
     * The shared read, but a caller that gives up while it is still running is
     * released now rather than whenever that read lands. The read is shared, so
     * one caller aborting does not stop it, and awaiting `entry.promise` alone
     * left that caller pending until every other waiter was done — or forever,
     * against a fill that ignores its signal.
     *
     * Only for a read in flight and a signal that can be subscribed to. The rest
     * fall back to the {@link throwIfAborted} in {@link get}.
     */
    settleFor(entry, signal) {
      if (!entry.pending || signal === void 0 || typeof signal.addEventListener !== "function") {
        return entry.promise;
      }
      let reject;
      const aborted = new Promise((_resolve, rejectAborted) => {
        reject = rejectAborted;
      });
      const onAbort = () => {
        reject(abortReason(signal));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      return Promise.race([entry.promise, aborted]).finally(() => {
        signal.removeEventListener("abort", onAbort);
      });
    }
    /**
     * The promise cached under `key`, or `undefined` if there is none.
     *
     * Marks the entry most-recently-used, exactly as {@link get} does: this is a
     * lookup that happens not to start a read, not an inspection. Use
     * {@link has} if you need to ask without touching the LRU order.
     *
     * The promise is the shared one, so awaiting it does not register the caller
     * as a waiter and its rejection is not re-reported per caller. Callers that
     * want either should use {@link get}.
     *
     * `undefined` too for a read every caller has already abandoned, which is not
     * a cached value but a rejection that has not landed yet.
     */
    getIfCached(key) {
      const cacheKey = this.toCacheKey(key);
      const entry = this.entries.get(cacheKey);
      if (!entry) {
        return void 0;
      }
      if (this.isDoomed(entry)) {
        this.deleteKey(cacheKey);
        return void 0;
      }
      this.touch(cacheKey, entry);
      return entry.promise;
    }
    /**
     * Whether {@link get} would be answered from the cache, by a settled value or
     * a read in flight. False for a read every caller has abandoned, as it is for
     * {@link get} and {@link getIfCached}. The one lookup that changes nothing.
     */
    has(key) {
      const entry = this.entries.get(this.toCacheKey(key));
      return entry !== void 0 && !this.isDoomed(entry);
    }
    delete(key) {
      this.deleteKey(this.toCacheKey(key));
    }
    clear() {
      this.entries.clear();
      this.shared?.budget.charge(this.shared.membership, -this.total);
      this.total = 0;
      this.settledCount = 0;
      this.stopSweep();
    }
    /**
     * Mark an entry most-recently-used, in both orders that word has here: its
     * position in {@link entries}, which {@link evict} and {@link lruSpare} walk,
     * and its {@link Entry.seq}, which a budget compares across caches.
     *
     * {@link lruSpare} takes an entry from map order and reports its seq, so the
     * two orders have to move together. This and {@link start} are the only
     * places either moves.
     */
    touch(cacheKey, entry) {
      this.entries.delete(cacheKey);
      this.entries.set(cacheKey, entry);
      entry.lastTouched = Date.now();
      entry.seq = this.stamp();
    }
    /** Only a budget compares these, so a cache without one has no order to keep. */
    stamp() {
      return this.shared?.budget.nextSeq() ?? 0;
    }
    /** In flight, but every caller waiting on it has already given up. */
    isDoomed(entry) {
      return entry.pending?.controller.signal.aborted === true;
    }
    /**
     * Evict entries nothing has read for {@link SharedReadCacheOptions.idleTimeoutMs}.
     *
     * Exposed so a consumer can reclaim on its own schedule — a browser tab going
     * hidden, say — rather than only on the interval. A no-op when no idle
     * timeout is configured.
     */
    sweepIdle() {
      const timeout = this.idleTimeoutMs;
      if (timeout === void 0) {
        return;
      }
      const cutoff = Date.now() - timeout;
      for (const [cacheKey, entry] of this.entries) {
        if (!entry.pending && entry.lastTouched <= cutoff) {
          this.deleteKey(cacheKey);
        }
      }
      if (this.settledCount === 0) {
        this.stopSweep();
      }
    }
    // The sweep runs on an interval because it is the one form of reclamation
    // that has to happen when nothing is calling in. It runs exactly when there
    // is something it could reclaim: armed by the first read to SETTLE, stopped
    // by the first sweep that finds no settled entry left.
    //
    // The timer holds the cache weakly, which is what makes a dispose() method
    // unnecessary: a pending timer is a GC root, so held strongly it kept a
    // dropped cache, and everything its fill closes over, alive until a sweep
    // emptied it — a whole idle timeout after the consumer let go.
    startSweep() {
      const timeout = this.idleTimeoutMs;
      if (timeout === void 0 || this.sweepTimer !== void 0) {
        return;
      }
      const interval = Math.min(2 ** 31 - 1, Math.max(1e3, Math.floor(timeout / 4)));
      const ref = new WeakRef(this);
      const timer = setInterval(() => {
        const cache = ref.deref();
        if (cache) {
          cache.sweepIdle();
        } else {
          clearInterval(timer);
        }
      }, interval);
      this.sweepTimer = timer;
      timer.unref?.();
    }
    stopSweep() {
      if (this.sweepTimer !== void 0) {
        clearInterval(this.sweepTimer);
        this.sweepTimer = void 0;
      }
    }
    // The read runs under its own controller rather than any one caller's signal,
    // because it is shared: it must survive until every caller waiting on it has
    // given up. join() is what registers them.
    start(cacheKey, key, fill) {
      const run = fill ?? (this.fill && ((s) => this.fill(key, s)));
      if (!run) {
        throw new Error("SharedReadCache needs a fill, either on the cache or on the get() call");
      }
      const pending = {
        signals: /* @__PURE__ */ new Map(),
        pinned: false,
        controller: new AbortController()
      };
      const entry = {
        // Promise.resolve hands a native promise back untouched, so getIfCached
        // still returns the fill's own. What it adds is that an untyped fill
        // returning a bare value is a read like any other, where calling `.then`
        // on it threw after the entry was already in the map.
        promise: Promise.resolve(run(pending.controller.signal)),
        pending,
        size: 0,
        lastTouched: Date.now(),
        seq: this.stamp()
      };
      this.entries.set(cacheKey, entry);
      const isCurrent = () => this.entries.get(cacheKey) === entry;
      const settle = () => {
        for (const [signal, onAbort] of pending.signals) {
          signal.removeEventListener("abort", onAbort);
        }
        entry.pending = void 0;
      };
      void entry.promise.then((value) => {
        const size = isCurrent() ? this.weigh(value) : void 0;
        const current = isCurrent();
        settle();
        if (current) {
          if (size === void 0) {
            this.entries.delete(cacheKey);
          } else {
            entry.lastTouched = Date.now();
            entry.size = size;
            this.settledCount++;
            this.total += size;
            this.shared?.budget.charge(this.shared.membership, size);
            this.startSweep();
          }
        }
        this.evict();
        this.shared?.budget.evict();
      }, () => {
        if (isCurrent()) {
          this.deleteKey(cacheKey);
        }
        settle();
      });
      return entry;
    }
    /**
     * {@link SharedReadCacheOptions.sizeOf}, checked — `undefined` when it does
     * not answer with a weight, which drops the entry rather than keeping one the
     * budget cannot see.
     *
     * Checked because it is consumer code over consumer values: `v =>
     * v.byteLength` returns `undefined` on a value without the field, arithmetic
     * turns that into `NaN`, and `NaN` in `total` is permanent — `total <= limit`
     * is false forever after, so every settle evicts down to the last entry.
     *
     * Swallowed rather than rethrown. Thrown from here it would reject a promise
     * nothing holds, and carried into the entry's own promise it would fail a
     * read that succeeded and whose caller already has its value.
     */
    weigh(value) {
      try {
        const size = this.sizeOf(value);
        return Number.isFinite(size) && size >= 0 ? size : void 0;
      } catch {
        return void 0;
      }
    }
    // Register a caller's interest, so the read survives until that caller has
    // given up too.
    join(pending, signal) {
      if (signal === void 0 || typeof signal.addEventListener !== "function") {
        pending.pinned = true;
      } else if (!signal.aborted && !pending.signals.has(signal)) {
        const onAbort = () => {
          pending.signals.delete(signal);
          if (!pending.pinned && pending.signals.size === 0) {
            pending.controller.abort(signal.reason);
          }
        };
        pending.signals.set(signal, onAbort);
        signal.addEventListener("abort", onAbort, { once: true });
      }
    }
    deleteKey(cacheKey) {
      const entry = this.entries.get(cacheKey);
      if (entry) {
        this.entries.delete(cacheKey);
        if (!entry.pending) {
          this.settledCount--;
        }
        this.total -= entry.size;
        this.shared?.budget.charge(this.shared.membership, -entry.size);
      }
    }
    /**
     * @internal — a budget asks; nothing else should.
     *
     * The least-recently-used settled entry, or `undefined` if this cache holds
     * at most one.
     */
    lruSpare() {
      if (this.settledCount <= 1) {
        return void 0;
      }
      for (const [cacheKey, entry] of this.entries) {
        if (!entry.pending) {
          return { cacheKey, seq: entry.seq };
        }
      }
      return void 0;
    }
    /** @internal — a budget evicting on this cache's behalf. */
    release(cacheKey) {
      this.deleteKey(cacheKey);
    }
    /**
     * Evict from the least-recently-used end.
     *
     * Reads still in flight are skipped: they have no weight to reclaim, and
     * dropping one would lose the de-duplication every caller joined to it is
     * relying on.
     *
     * The last settled entry is kept whatever the budget. A single value larger
     * than the whole budget is still worth holding — the caller needs it for the
     * request in flight, so dropping it only buys an immediate re-read.
     */
    evict() {
      if (this.total <= this.limit) {
        return;
      }
      for (const [cacheKey, entry] of this.entries) {
        if (this.total <= this.limit || this.settledCount <= 1) {
          break;
        }
        if (!entry.pending) {
          this.deleteKey(cacheKey);
        }
      }
    }
  };

  // node_modules/.pnpm/generic-filehandle2@2.5.1/node_modules/generic-filehandle2/esm/util.js
  async function toBytes(src) {
    return src.bytes ? src.bytes() : new Uint8Array(await src.arrayBuffer());
  }
  async function readBody(src, encoding, onProgress) {
    if (encoding === "utf8" || encoding === "utf-8") {
      return src.text();
    } else if (encoding) {
      throw new Error(`unsupported encoding: ${encoding}`);
    }
    return onProgress && "body" in src ? toBytesWithProgress(src, onProgress) : toBytes(src);
  }
  function splitReadFileOptions(options) {
    return typeof options === "string" ? { encoding: options, opts: {} } : { encoding: options?.encoding, opts: options ?? {} };
  }
  function parseContentRangeSize(contentRange) {
    const size = /\/(\d+)$/.exec(contentRange ?? "")?.[1];
    return size === void 0 ? void 0 : parseInt(size, 10);
  }
  function parseContentLength(res) {
    const header = res.headers.get("content-length");
    const parsed = header === null ? Number.NaN : Number(header);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : void 0;
  }
  var PROGRESS_THROTTLE_MS = 50;
  async function toBytesWithProgress(res, onProgress) {
    const total = parseContentLength(res);
    const body = res.body;
    if (!body || total === void 0) {
      const bytes = await toBytes(res);
      onProgress(bytes.byteLength, total ?? bytes.byteLength);
      return bytes;
    }
    const reader = body.getReader();
    let out = new Uint8Array(total);
    let received = 0;
    let lastTick = Date.now();
    onProgress(0, total);
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      if (received + chunk.value.byteLength > out.length) {
        const grown = new Uint8Array(Math.max(received + chunk.value.byteLength, out.length * 2));
        grown.set(out.subarray(0, received));
        out = grown;
      }
      out.set(chunk.value, received);
      received += chunk.value.byteLength;
      const now = Date.now();
      if (now - lastTick >= PROGRESS_THROTTLE_MS) {
        lastTick = now;
        onProgress(received, total);
      }
    }
    onProgress(received, total);
    return received === out.length ? out : out.slice(0, received);
  }

  // node_modules/.pnpm/generic-filehandle2@2.5.1/node_modules/generic-filehandle2/esm/remoteFile.js
  function mergeHeaders(...sources) {
    const merged = /* @__PURE__ */ new Map();
    for (const source of sources) {
      for (const [name, value] of Object.entries(source ?? {})) {
        merged.set(name.toLowerCase(), [name, value]);
      }
    }
    return Object.fromEntries(merged.values());
  }
  function discardBody(res) {
    const body = res.body;
    if (typeof body?.cancel === "function") {
      body.cancel().catch(() => void 0);
    }
  }
  function isByteOffset(n) {
    return Number.isSafeInteger(n) && n >= 0;
  }
  function isNetworkFailure(e) {
    return typeof e === "object" && e !== null && "name" in e && e.name === "TypeError";
  }
  function getMessage(e) {
    const r = typeof e === "object" && e !== null && "message" in e && typeof e.message === "string" ? e.message : `${e}`;
    return r.replace(/\.$/, "");
  }
  var RemoteFile = class {
    constructor(source, opts = {}) {
      __publicField(this, "url");
      __publicField(this, "_stat");
      __publicField(this, "statProbe");
      __publicField(this, "fetchImplementation");
      __publicField(this, "baseHeaders");
      __publicField(this, "baseOverrides");
      __publicField(this, "baseSignal");
      this.url = source;
      this.baseHeaders = opts.headers ?? {};
      this.baseOverrides = opts.overrides ?? {};
      this.baseSignal = opts.signal;
      this.fetchImplementation = opts.fetch ?? globalThis.fetch.bind(globalThis);
    }
    /** the URL this handle fetches — see {@link GenericFilehandle.source} */
    get source() {
      return this.url;
    }
    buildRequest(opts, extraHeaders) {
      const signal = opts.signal ?? this.baseSignal;
      return {
        // defaults first: `overrides` is documented as extra fetch params, so a
        // caller passing e.g. mode/redirect/method has to be able to win
        method: "GET",
        redirect: "follow",
        mode: "cors",
        ...this.baseOverrides,
        ...opts.overrides,
        headers: mergeHeaders(this.baseHeaders, opts.headers, extraHeaders),
        ...signal ? { signal } : {}
      };
    }
    async fetch(input, init2) {
      const wrapError = (e) => isNetworkFailure(e) && !init2?.signal?.aborted ? new Error(`${getMessage(e)} fetching ${input}`, { cause: e }) : e;
      let response;
      try {
        response = await this.fetchImplementation(input, init2);
      } catch (e) {
        if (`${e}`.includes("Failed to fetch")) {
          console.warn(`generic-filehandle: refetching ${input} to attempt to work around chrome CORS header caching bug`);
          try {
            response = await this.fetchImplementation(input, {
              ...init2,
              cache: "reload"
            });
          } catch (e2) {
            throw wrapError(e2);
          }
        } else {
          throw wrapError(e);
        }
      }
      return response;
    }
    async read(length, position, opts = {}) {
      if (!isByteOffset(length) || !isByteOffset(position)) {
        throw new TypeError(`read() called with an invalid length or position (length=${length}, position=${position}). The index file may be corrupt.`);
      }
      return length === 0 ? new Uint8Array(0) : this.fetchBytes(length, position, opts);
    }
    /**
     * The bytes for one byte range — the seam a subclass that can serve those
     * bytes some other way overrides.
     *
     * The alternative is overriding {@link fetch}, and for a subclass holding a
     * byte cache that is the wrong altitude: it has bytes, so it has to wrap them
     * in a `Response` that `read` immediately unwraps again. Both halves copy.
     * Measured against JBrowse's `RemoteFileWithRangeCache` on a fully warm cache
     * with no network at all, that round trip was **69-77% of the entire read** —
     * 6.15ms vs 1.90ms for 16MB, and the same ratio down to 256KB.
     *
     * So: override this to serve bytes, override {@link fetch} to change how
     * requests are made. Overriding neither leaves the ranged GET below, and the
     * default implementation still goes through `this.fetch`, so a subclass that
     * only wraps `fetch` keeps working untouched.
     */
    async fetchBytes(length, position, opts) {
      const res = await this.fetch(this.url, this.buildRequest(opts, {
        range: `bytes=${position}-${position + length - 1}`
      }));
      if (res.status === 416) {
        discardBody(res);
        return new Uint8Array(0);
      }
      this.checkOk(res);
      if (res.status === 200 && position === 0 || res.status === 206) {
        const size = parseContentRangeSize(res.headers.get("content-range"));
        if (size !== void 0) {
          this._stat = { size };
        }
        const resData = opts.onProgress ? await toBytesWithProgress(res, opts.onProgress) : await toBytes(res);
        if (!this._stat && res.status === 200) {
          this._stat = { size: resData.byteLength };
        }
        return resData.byteLength <= length ? resData : resData.slice(0, length);
      }
      discardBody(res);
      throw new Error(res.status === 200 ? `${this.url} fetch returned status 200, expected 206` : `HTTP ${res.status} fetching ${this.url}`);
    }
    checkOk(res) {
      if (!res.ok) {
        discardBody(res);
        throw new Error(`HTTP ${res.status} fetching ${this.url}`);
      }
    }
    async readFile(options) {
      const { encoding, opts } = splitReadFileOptions(options);
      const res = await this.fetch(this.url, this.buildRequest(opts));
      this.checkOk(res);
      const body = await this.readFileBody(res, encoding, opts.onProgress);
      if (res.status === 200 && typeof body !== "string") {
        this._stat = { size: body.byteLength };
      }
      return body;
    }
    /**
     * Reads the body of a whole-file response. A subclass overrides it to learn
     * when that body starts and ends, which `fetch` cannot tell it: `fetch`
     * returns at the headers.
     */
    readFileBody(res, encoding, onProgress) {
      return readBody(res, encoding, onProgress);
    }
    async stat() {
      if (!this._stat) {
        this.statProbe ?? (this.statProbe = this.read(10, 0).finally(() => {
          this.statProbe = void 0;
        }));
        await this.statProbe;
      }
      return this._stat ?? { size: 0 };
    }
    close() {
      return Promise.resolve();
    }
  };

  // node_modules/.pnpm/generic-filehandle2@2.5.1/node_modules/generic-filehandle2/esm/browser.js
  var LocalFile = class {
    // takes the options argument too, for the same reason it takes `source`: a
    // bundle resolving the `browser` condition must still typecheck a call
    // written against the node class, options and all
    constructor(source, _opts = {}) {
      /** the path this stub was handed — see {@link GenericFilehandle.source} */
      __publicField(this, "source");
      this.source = source;
    }
    unimplemented() {
      return Promise.reject(new Error(`LocalFile is unimplemented in the browser (${this.source})`));
    }
    readFile(_options) {
      return this.unimplemented();
    }
    read(_length, _position, _opts) {
      return this.unimplemented();
    }
    stat() {
      return this.unimplemented();
    }
    close() {
      return this.unimplemented();
    }
  };

  // node_modules/.pnpm/@gmod+tabix@3.10.2/node_modules/@gmod/tabix/esm/chunk.js
  var Chunk = class {
    constructor(minv, maxv, bin, endPosition = maxv.blockPosition + (1 << 16)) {
      __publicField(this, "minv");
      __publicField(this, "maxv");
      __publicField(this, "bin");
      // Absolute byte offset where the fetch for this chunk ends. The compressed
      // size of the final BGZF block (the one at maxv.blockPosition) is unknown
      // from the index, so this defaults to a full max-size block past maxv. It can
      // be tightened to the next known block boundary via clampChunkEnds.
      __publicField(this, "endPosition");
      this.minv = minv;
      this.maxv = maxv;
      this.bin = bin;
      this.endPosition = endPosition;
    }
    toString() {
      return `${this.minv.toString()}..${this.maxv.toString()} (bin ${this.bin}, fetchedSize ${this.fetchedSize()})`;
    }
    fetchedSize() {
      return this.endPosition - this.minv.blockPosition;
    }
  };

  // node_modules/.pnpm/@jbrowse+quick-lru@8.0.0/node_modules/@jbrowse/quick-lru/esm/index.js
  function assertPositive(name, value) {
    if (!(value > 0)) {
      throw new TypeError(`\`${name}\` must be a number greater than 0`);
    }
  }
  var _cache, _oldCache, _maxSize, _maxAge, _onEviction, _QuickLRU_instances, emitEvictions_fn, deleteIfExpired_fn, valueIfFresh_fn, moveToRecent_fn, replaceWith_fn, liveItemsAscending_fn;
  var QuickLRU = class {
    constructor(options) {
      __privateAdd(this, _QuickLRU_instances);
      __privateAdd(this, _cache, /* @__PURE__ */ new Map());
      __privateAdd(this, _oldCache, /* @__PURE__ */ new Map());
      __privateAdd(this, _maxSize);
      __privateAdd(this, _maxAge);
      __privateAdd(this, _onEviction);
      const maxAge = options.maxAge ?? Number.POSITIVE_INFINITY;
      assertPositive("maxSize", options.maxSize);
      assertPositive("maxAge", maxAge);
      __privateSet(this, _maxSize, options.maxSize);
      __privateSet(this, _maxAge, maxAge);
      __privateSet(this, _onEviction, options.onEviction);
    }
    /**
     * Get an item, marking it as recently used.
     *
     * @returns The stored item or `undefined`.
     */
    get(key) {
      const item = __privateGet(this, _cache).get(key);
      if (item) {
        return __privateMethod(this, _QuickLRU_instances, valueIfFresh_fn).call(this, key, item);
      }
      const oldItem = __privateGet(this, _oldCache).get(key);
      if (oldItem && !__privateMethod(this, _QuickLRU_instances, deleteIfExpired_fn).call(this, key, oldItem)) {
        __privateMethod(this, _QuickLRU_instances, moveToRecent_fn).call(this, key, oldItem);
        return oldItem.value;
      }
      return void 0;
    }
    /**
     * Set an item, marking it as recently used.
     *
     * The `maxAge` option overrides the cache-wide `maxAge` for this item.
     *
     * @returns The cache instance.
     */
    set(key, value, { maxAge = __privateGet(this, _maxAge) } = {}) {
      const item = {
        value,
        expiry: maxAge === Number.POSITIVE_INFINITY ? void 0 : Date.now() + maxAge
      };
      if (__privateGet(this, _cache).has(key)) {
        __privateGet(this, _cache).set(key, item);
      } else {
        __privateMethod(this, _QuickLRU_instances, moveToRecent_fn).call(this, key, item);
      }
      return this;
    }
    /** Check if an item exists, without marking it as recently used. */
    has(key) {
      const item = __privateGet(this, _cache).get(key) ?? __privateGet(this, _oldCache).get(key);
      return item !== void 0 && !__privateMethod(this, _QuickLRU_instances, deleteIfExpired_fn).call(this, key, item);
    }
    /**
     * Get an item without marking it as recently used.
     *
     * @returns The stored item or `undefined`.
     */
    peek(key) {
      const item = __privateGet(this, _cache).get(key) ?? __privateGet(this, _oldCache).get(key);
      return item ? __privateMethod(this, _QuickLRU_instances, valueIfFresh_fn).call(this, key, item) : void 0;
    }
    /**
     * Get the remaining time to live of an item, in milliseconds. Neither marks the item as recently used nor removes it if expired, so the result may be negative.
     *
     * @returns The remaining milliseconds, `Infinity` if the item never expires, or `undefined` if it is not in the cache.
     */
    expiresIn(key) {
      const item = __privateGet(this, _cache).get(key) ?? __privateGet(this, _oldCache).get(key);
      if (item) {
        return item.expiry === void 0 ? Number.POSITIVE_INFINITY : item.expiry - Date.now();
      }
      return void 0;
    }
    /**
     * Delete an item.
     *
     * @returns `true` if the item was removed, `false` if it did not exist.
     */
    delete(key) {
      return __privateGet(this, _cache).delete(key) || __privateGet(this, _oldCache).delete(key);
    }
    /** Delete all items. */
    clear() {
      __privateGet(this, _cache).clear();
      __privateGet(this, _oldCache).clear();
    }
    /** Update `maxSize` in place, evicting the least recently used items if the cache no longer fits. */
    resize(maxSize) {
      assertPositive("maxSize", maxSize);
      const items = [...__privateMethod(this, _QuickLRU_instances, liveItemsAscending_fn).call(this)];
      const removeCount = items.length - maxSize;
      if (removeCount < 0) {
        __privateSet(this, _cache, new Map(items));
        __privateSet(this, _oldCache, /* @__PURE__ */ new Map());
      } else {
        __privateMethod(this, _QuickLRU_instances, emitEvictions_fn).call(this, items.slice(0, removeCount));
        __privateMethod(this, _QuickLRU_instances, replaceWith_fn).call(this, items.slice(removeCount));
      }
      __privateSet(this, _maxSize, maxSize);
    }
    /**
     * Evict the least recently used items. Always keeps at least one item.
     *
     * @param count - The number of items to evict.
     */
    evict(count = 1) {
      if (!(count > 0)) {
        return;
      }
      const items = [...__privateMethod(this, _QuickLRU_instances, liveItemsAscending_fn).call(this)];
      const evictCount = Math.trunc(Math.min(count, items.length - 1));
      if (evictCount > 0) {
        __privateMethod(this, _QuickLRU_instances, emitEvictions_fn).call(this, items.slice(0, evictCount));
        __privateMethod(this, _QuickLRU_instances, replaceWith_fn).call(this, items.slice(evictCount));
      }
    }
    /** The stored item count, capped at `maxSize`. */
    get size() {
      return Math.min(__privateGet(this, _cache).size + __privateGet(this, _oldCache).size, __privateGet(this, _maxSize));
    }
    get maxSize() {
      return __privateGet(this, _maxSize);
    }
    get maxAge() {
      return __privateGet(this, _maxAge);
    }
    /** Iterate over all entries, oldest first. */
    *entriesAscending() {
      for (const [key, item] of __privateMethod(this, _QuickLRU_instances, liveItemsAscending_fn).call(this)) {
        yield [key, item.value];
      }
    }
    /** Iterate over all entries, newest first. */
    *entriesDescending() {
      for (const cache of [__privateGet(this, _cache), __privateGet(this, _oldCache)]) {
        for (const [key, item] of [...cache].reverse()) {
          if (!__privateMethod(this, _QuickLRU_instances, deleteIfExpired_fn).call(this, key, item)) {
            yield [key, item.value];
          }
        }
      }
    }
    /** Iterate over all entries, oldest first. Alias for `entriesAscending()`. */
    entries() {
      return this.entriesAscending();
    }
    [Symbol.iterator]() {
      return this.entriesAscending();
    }
    *keys() {
      for (const [key] of this) {
        yield key;
      }
    }
    *values() {
      for (const [, value] of this) {
        yield value;
      }
    }
    forEach(callbackFunction, thisArgument = this) {
      for (const [key, value] of this) {
        callbackFunction.call(thisArgument, value, key, this);
      }
    }
    // eslint-disable-next-line @typescript-eslint/class-literal-property-style
    get [Symbol.toStringTag]() {
      return "QuickLRU";
    }
    toString() {
      return `QuickLRU(${this.size}/${this.maxSize})`;
    }
    [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
      return this.toString();
    }
  };
  _cache = new WeakMap();
  _oldCache = new WeakMap();
  _maxSize = new WeakMap();
  _maxAge = new WeakMap();
  _onEviction = new WeakMap();
  _QuickLRU_instances = new WeakSet();
  emitEvictions_fn = function(items) {
    const onEviction = __privateGet(this, _onEviction);
    if (onEviction) {
      for (const [key, item] of items) {
        onEviction(key, item.value);
      }
    }
  };
  deleteIfExpired_fn = function(key, item) {
    var _a;
    if (item.expiry !== void 0 && item.expiry <= Date.now()) {
      (_a = __privateGet(this, _onEviction)) == null ? void 0 : _a.call(this, key, item.value);
      this.delete(key);
      return true;
    }
    return false;
  };
  valueIfFresh_fn = function(key, item) {
    return __privateMethod(this, _QuickLRU_instances, deleteIfExpired_fn).call(this, key, item) ? void 0 : item.value;
  };
  moveToRecent_fn = function(key, item) {
    __privateGet(this, _oldCache).delete(key);
    __privateGet(this, _cache).set(key, item);
    if (__privateGet(this, _cache).size >= __privateGet(this, _maxSize)) {
      const evicted = __privateGet(this, _oldCache);
      __privateSet(this, _oldCache, __privateGet(this, _cache));
      __privateSet(this, _cache, /* @__PURE__ */ new Map());
      __privateMethod(this, _QuickLRU_instances, emitEvictions_fn).call(this, evicted);
    }
  };
  replaceWith_fn = function(items) {
    __privateSet(this, _oldCache, new Map(items));
    __privateSet(this, _cache, /* @__PURE__ */ new Map());
  };
  liveItemsAscending_fn = function* () {
    for (const cache of [__privateGet(this, _oldCache), __privateGet(this, _cache)]) {
      for (const entry of cache) {
        if (!__privateMethod(this, _QuickLRU_instances, deleteIfExpired_fn).call(this, ...entry)) {
          yield entry;
        }
      }
    }
  };

  // node_modules/.pnpm/@gmod+tabix@3.10.2/node_modules/@gmod/tabix/esm/long.js
  var TWO_PWR_32_DBL = 2 ** 32;
  function longFromBytesToUnsigned(source, i = 0) {
    const low = source[i] | source[i + 1] << 8 | source[i + 2] << 16 | source[i + 3] << 24;
    const high = source[i + 4] | source[i + 5] << 8 | source[i + 6] << 16 | source[i + 7] << 24;
    return (high >>> 0) * TWO_PWR_32_DBL + (low >>> 0);
  }

  // node_modules/.pnpm/@gmod+tabix@3.10.2/node_modules/@gmod/tabix/esm/virtualOffset.js
  var VirtualOffset = class {
    constructor(blockPosition, dataPosition) {
      __publicField(this, "blockPosition");
      __publicField(this, "dataPosition");
      this.blockPosition = blockPosition;
      this.dataPosition = dataPosition;
    }
    toString() {
      return `${this.blockPosition}:${this.dataPosition}`;
    }
    compareTo(b) {
      return this.blockPosition - b.blockPosition || this.dataPosition - b.dataPosition;
    }
  };
  function fromBytes(bytes, offset = 0) {
    return new VirtualOffset(bytes[offset + 7] * 1099511627776 + bytes[offset + 6] * 4294967296 + bytes[offset + 5] * 16777216 + bytes[offset + 4] * 65536 + bytes[offset + 3] * 256 + bytes[offset + 2], bytes[offset + 1] << 8 | bytes[offset]);
  }

  // node_modules/.pnpm/@gmod+tabix@3.10.2/node_modules/@gmod/tabix/esm/util.js
  function optimizeChunks(chunks, lowest) {
    const n = chunks.length;
    if (n === 0) {
      return chunks;
    }
    let filtered;
    if (lowest) {
      const lowestBlock = lowest.blockPosition;
      const lowestData = lowest.dataPosition;
      filtered = [];
      for (let i = 0; i < n; i++) {
        const chunk = chunks[i];
        const cmp = chunk.maxv.blockPosition - lowestBlock || chunk.maxv.dataPosition - lowestData;
        if (cmp > 0) {
          filtered.push(chunk);
        }
      }
      if (filtered.length === 0) {
        return filtered;
      }
    } else {
      filtered = chunks;
    }
    filtered.sort((c0, c1) => {
      const dif = c0.minv.blockPosition - c1.minv.blockPosition;
      return dif === 0 ? c0.minv.dataPosition - c1.minv.dataPosition : dif;
    });
    const mergedChunks = [filtered[0]];
    let lastMinBlock = filtered[0].minv.blockPosition;
    let lastMaxBlock = filtered[0].maxv.blockPosition;
    for (let i = 1; i < filtered.length; i++) {
      const chunk = filtered[i];
      const chunkMinBlock = chunk.minv.blockPosition;
      const chunkMaxBlock = chunk.maxv.blockPosition;
      if (chunkMinBlock - lastMaxBlock < 65e3 && chunkMaxBlock - lastMinBlock < 5e6) {
        const lastChunk = mergedChunks.at(-1);
        const cmp = chunkMaxBlock - lastMaxBlock || chunk.maxv.dataPosition - lastChunk.maxv.dataPosition;
        if (cmp > 0) {
          mergedChunks[mergedChunks.length - 1] = new Chunk(lastChunk.minv, chunk.maxv, lastChunk.bin, chunk.endPosition);
          lastMaxBlock = chunkMaxBlock;
        }
      } else {
        mergedChunks.push(chunk);
        lastMinBlock = chunkMinBlock;
        lastMaxBlock = chunkMaxBlock;
      }
    }
    return makeDisjoint(mergedChunks);
  }
  function makeDisjoint(chunks) {
    const out = [chunks[0]];
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      const prevMax = out.at(-1).maxv;
      const cmp = chunk.minv.blockPosition - prevMax.blockPosition || chunk.minv.dataPosition - prevMax.dataPosition;
      if (cmp >= 0) {
        out.push(chunk);
        continue;
      }
      const stillHasData = chunk.maxv.blockPosition - prevMax.blockPosition || chunk.maxv.dataPosition - prevMax.dataPosition;
      if (stillHasData > 0) {
        out.push(new Chunk(prevMax, chunk.maxv, chunk.bin, chunk.endPosition));
      }
    }
    return out;
  }
  function clampChunkEnds(chunks, extraBoundaries = []) {
    const boundaries = [...extraBoundaries];
    for (const c of chunks) {
      boundaries.push(c.minv.blockPosition, c.maxv.blockPosition);
    }
    boundaries.sort((a, b) => a - b);
    for (const c of chunks) {
      const max = c.maxv.blockPosition;
      let lo = 0;
      let hi = boundaries.length;
      while (lo < hi) {
        const mid = lo + hi >>> 1;
        if (boundaries[mid] > max) {
          hi = mid;
        } else {
          lo = mid + 1;
        }
      }
      if (lo < boundaries.length) {
        c.endPosition = Math.min(c.endPosition, boundaries[lo]);
      }
    }
  }
  function minVirtualOffset(bytes, offset, count, current) {
    let minBlock = current ? current.blockPosition : Infinity;
    let minData = current ? current.dataPosition : 0;
    let found = false;
    for (let i = 0; i < count; i++) {
      const p = offset + i * 8;
      const block = bytes[p + 7] * 1099511627776 + bytes[p + 6] * 4294967296 + bytes[p + 5] * 16777216 + bytes[p + 4] * 65536 + bytes[p + 3] * 256 + bytes[p + 2];
      const data = bytes[p + 1] << 8 | bytes[p];
      if (block < minBlock || block === minBlock && data < minData) {
        minBlock = block;
        minData = data;
        found = true;
      }
    }
    return found ? new VirtualOffset(minBlock, minData) : current;
  }
  function parseNameBytes(namesBytes) {
    const decoder = new TextDecoder("utf-8");
    const refIdToName = [];
    const refNameToId = {};
    let currRefId = 0;
    let pos = 0;
    while (pos < namesBytes.length) {
      const end = namesBytes.indexOf(0, pos);
      if (end === -1) {
        break;
      }
      if (end > pos) {
        const refName = decoder.decode(namesBytes.subarray(pos, end));
        refIdToName[currRefId] = refName;
        refNameToId[refName] = currRefId;
      }
      pos = end + 1;
      currRefId++;
    }
    return { refNameToId, refIdToName };
  }
  var tabixFormats = {
    0: "generic",
    1: "SAM",
    2: "VCF",
    3: "GAF"
  };
  function parseAuxData(bytes, offset) {
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const formatFlags = dataView.getInt32(offset, true);
    const coordinateType = formatFlags & 65536 ? "zero-based-half-open" : "1-based-closed";
    const format = tabixFormats[formatFlags & 15];
    if (!format) {
      throw new Error(`invalid Tabix preset format flags ${formatFlags}`);
    }
    const columnNumbers = {
      ref: dataView.getInt32(offset + 4, true),
      start: dataView.getInt32(offset + 8, true),
      end: dataView.getInt32(offset + 12, true)
    };
    const metaValue = dataView.getInt32(offset + 16, true);
    const metaChar = metaValue ? String.fromCharCode(metaValue) : void 0;
    const skipLines = dataView.getInt32(offset + 20, true);
    const nameSectionLength = dataView.getInt32(offset + 24, true);
    const { refIdToName, refNameToId } = parseNameBytes(bytes.subarray(offset + 28, offset + 28 + nameSectionLength));
    return {
      refIdToName,
      refNameToId,
      skipLines,
      metaChar,
      columnNumbers,
      format,
      coordinateType
    };
  }
  function parsePseudoBin(bytes, offset) {
    return { lineCount: longFromBytesToUnsigned(bytes, offset) };
  }
  function memoizeByRefId(getIndices, maxSize = 5) {
    const lru = new QuickLRU({ maxSize });
    return (refId) => {
      const cached = lru.get(refId);
      if (cached !== void 0) {
        return cached;
      }
      const result = getIndices(refId);
      if (result !== void 0) {
        lru.set(refId, result);
      }
      return result;
    };
  }

  // node_modules/.pnpm/@gmod+tabix@3.10.2/node_modules/@gmod/tabix/esm/indexFile.js
  function maxOffset(binIndex, end, minShift, depth) {
    if (end > 2 ** (minShift + depth * 3)) {
      return void 0;
    }
    const binCount = (8 ** (depth + 1) - 1) / 7;
    let bin = (8 ** depth - 1) / 7 + Math.floor((end - 1) / 2 ** minShift) + 1;
    if (bin >= binCount) {
      bin = 0;
    }
    for (; ; ) {
      while (bin % 8 === 1) {
        bin = (bin - 1) / 8;
      }
      if (bin === 0) {
        return void 0;
      }
      const chunks = binIndex[bin];
      if (chunks?.length) {
        let lowest = chunks[0].minv;
        for (let i = 1; i < chunks.length; i++) {
          const minv = chunks[i].minv;
          if (minv.compareTo(lowest) < 0) {
            lowest = minv;
          }
        }
        return lowest;
      }
      bin++;
    }
  }
  function refIdFor(indexData, refName) {
    return indexData.format === "GAF" ? 0 : indexData.refNameToId[refName];
  }
  var IndexFile = class {
    constructor({ filehandle }) {
      __publicField(this, "filehandle");
      /**
       * The parsed index, as a shared read — see {@link parse}. One entry, never
       * evicted, which is what a memo is.
       */
      __publicField(this, "parseCache", new SharedReadCache({}));
      this.filehandle = filehandle;
    }
    /**
     * The whole index file, decompressed, with a DataView over it. Both .tbi and
     * .csi are bgzf-compressed and read whole, so both parsers start here.
     */
    async readIndexBytes(opts) {
      const buf = await this.filehandle.readFile({
        signal: opts.signal,
        onProgress: opts.onProgress
      });
      const bytes = await unzip(buf);
      return {
        bytes,
        dataView: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      };
    }
    /** @internal */
    async lineCount(refName, opts = {}) {
      const indexData = await this.parse(opts);
      const refId = refIdFor(indexData, refName);
      if (refId === void 0) {
        return -1;
      }
      return indexData.indices(refId)?.stats?.lineCount ?? -1;
    }
    /** @internal */
    async getMetadata(opts = {}) {
      const { indices: _indices, ...rest } = await this.parse(opts);
      return rest;
    }
    /**
     * The chunks of the data file that may hold records overlapping the region.
     * The two index formats differ only in their binning scheme and in where
     * they keep the pruning floor, which is what the two hooks above supply.
     * The ceiling, `maxOffset`, needs only the bins, so it serves both.
     *
     * @internal
     */
    async blocksForRange(refName, min, max, opts = {}) {
      const indexData = await this.parse(opts);
      const refId = refIdFor(indexData, refName);
      if (refId === void 0) {
        return [];
      }
      const ba = indexData.indices(refId);
      if (!ba) {
        return [];
      }
      if (indexData.format === "GAF") {
        min = Math.max(min - 1, 0);
      }
      const chunks = [];
      for (const [start, end] of this.reg2bins(min, max, indexData)) {
        for (let bin = start; bin <= end; bin++) {
          const binChunks = ba.binIndex[bin];
          if (binChunks) {
            for (const c of binChunks) {
              chunks.push(c);
            }
          }
        }
      }
      const merged = optimizeChunks(chunks, this.lowestOffset(ba, min, indexData));
      const past = maxOffset(ba.binIndex, max, indexData.minShift, indexData.depth);
      if (past) {
        let n = merged.length;
        while (n > 0 && merged[n - 1].minv.compareTo(past) >= 0) {
          n--;
        }
        merged.length = n;
      }
      return merged;
    }
    // SYNC: ~/src/gmod/bam-js/src/indexFile.ts parse — same shape and the same
    // reasoning below.
    /**
     * Parse the index, or join the parse already running.
     *
     * The index is downloaded and parsed once for the life of this object, so it
     * is the one read here that is shared between queries — and therefore the one
     * place a cancellation can leak from the query that asked for it to a query
     * that did not. `_parse` hands `opts` straight to `readIndexBytes`, so a bare
     * memoized promise makes the first query to arrive the owner of a read every
     * other query depends on: when it pans away, every concurrent query fails
     * with its abort.
     *
     * The same cache `ChunkCache` uses, for the same reason and with the same
     * rule: the parse runs under a signal of its own and is cancelled only once
     * every caller waiting on it has given up, so one query's abort is reported
     * to that query alone and a bystander gets the parse already in flight rather
     * than having to re-read the index. A rejection is dropped rather than
     * cached, so a transient failure does not poison the index for the life of
     * the file.
     *
     * The fill is per call rather than on the cache so that the caller who starts
     * the parse has its `onProgress` reach `readIndexBytes` — the index is a
     * whole-file read, and a determinate "downloading index" bar is what that
     * callback exists for.
     *
     * @internal
     */
    parse(opts = {}) {
      return this.parseCache.get("index", opts.signal, (signal) => this._parse({ ...opts, signal }));
    }
    /** @internal */
    async hasRefSeq(seqId, opts = {}) {
      const idx = await this.parse(opts);
      return !!idx.indices(seqId)?.binIndex;
    }
  };

  // node_modules/.pnpm/@gmod+tabix@3.10.2/node_modules/@gmod/tabix/esm/csi.js
  var CSI1_MAGIC = 21582659;
  var CSI2_MAGIC = 38359875;
  function lshift(num, bits) {
    return num * 2 ** bits;
  }
  function rshift(num, bits) {
    return Math.floor(num / 2 ** bits);
  }
  var CSI = class extends IndexFile {
    /** @internal */
    async _parse(opts = {}) {
      const { bytes, dataView } = await this.readIndexBytes(opts);
      const magic = dataView.getUint32(0, true);
      let csiVersion;
      if (magic === CSI1_MAGIC) {
        csiVersion = 1;
      } else if (magic === CSI2_MAGIC) {
        csiVersion = 2;
      } else {
        throw new Error(`Not a CSI file (magic=${magic})`);
      }
      const minShift = dataView.getInt32(4, true);
      const depth = dataView.getInt32(8, true);
      const maxBinNumber = (8 ** (depth + 1) - 1) / 7;
      const maxRefLength = 2 ** (minShift + depth * 3);
      const auxLength = dataView.getInt32(12, true);
      const isGaf = auxLength >= 28 && (dataView.getInt32(16, true) & 15) === 3;
      if (auxLength < 30 && !isGaf) {
        throw new Error("CSI index has no tabix header, so it names no references; it may be a BAM or BCF index");
      }
      const aux = parseAuxData(bytes, 16);
      const refCount = dataView.getInt32(16 + auxLength, true);
      let curr = 16 + auxLength + 4;
      let firstDataLine;
      const offsets = [];
      for (let i = 0; i < refCount; i++) {
        offsets.push(curr);
        const binCount = dataView.getInt32(curr, true);
        curr += 4;
        for (let j = 0; j < binCount; j++) {
          const bin = dataView.getUint32(curr, true);
          curr += 4;
          if (bin > maxBinNumber) {
            curr += 28 + 16;
          } else {
            firstDataLine = minVirtualOffset(bytes, curr, 1, firstDataLine);
            curr += 8;
            const chunkCount = dataView.getInt32(curr, true);
            curr += 4 + 16 * chunkCount;
          }
        }
      }
      function getIndices(refId) {
        const start = offsets[refId];
        if (start === void 0) {
          return void 0;
        }
        let pos = start;
        const binCount = dataView.getInt32(pos, true);
        pos += 4;
        const binIndex = {};
        const loffsets = {};
        let stats;
        for (let j = 0; j < binCount; j++) {
          const bin = dataView.getUint32(pos, true);
          pos += 4;
          if (bin > maxBinNumber) {
            stats = parsePseudoBin(bytes, pos + 28);
            pos += 28 + 16;
          } else {
            loffsets[bin] = fromBytes(bytes, pos);
            pos += 8;
            const chunkCount = dataView.getInt32(pos, true);
            pos += 4;
            const chunks = Array.from({ length: chunkCount });
            for (let k = 0; k < chunkCount; k++) {
              chunks[k] = new Chunk(fromBytes(bytes, pos), fromBytes(bytes, pos + 8), bin);
              pos += 16;
            }
            binIndex[bin] = chunks;
          }
        }
        clampChunkEnds(Object.values(binIndex).flat());
        return { binIndex, loffsets, stats };
      }
      return {
        ...aux,
        csi: true,
        refCount,
        maxBlockSize: 1 << 16,
        firstDataLine,
        csiVersion,
        indices: memoizeByRefId(getIndices),
        minShift,
        depth,
        maxBinNumber,
        maxRefLength
      };
    }
    /**
     * CSI's equivalent of the BAI/TBI linear index: the loffset of the deepest
     * indexed bin covering `beg` is the earliest virtual offset any record
     * overlapping `beg` can have, so chunks ending at or before it are dead.
     * Walks leaf -> previous sibling -> parent until an indexed bin is found.
     * SYNC: htslib hts_itr_query min_off computation
     */
    lowestOffset(ref, beg, { minShift, depth }) {
      const { loffsets } = ref;
      let found;
      if (loffsets) {
        let bin = (lshift(1, 3 * depth) - 1) / 7 + rshift(Math.max(beg, 0), minShift);
        while (found === void 0 && bin > 0) {
          found = loffsets[bin];
          if (found === void 0) {
            const parent = Math.floor((bin - 1) / 8);
            const firstChild = parent * 8 + 1;
            bin = bin > firstChild ? bin - 1 : parent;
          }
        }
        found ?? (found = loffsets[0]);
      }
      return found;
    }
    reg2bins(beg, end, { minShift, depth, maxBinNumber }) {
      beg = Math.max(beg, 0);
      const maxPos = 2 ** (minShift + depth * 3);
      if (end > maxPos) {
        end = maxPos;
      }
      end -= 1;
      let l = 0;
      let t = 0;
      let s = minShift + depth * 3;
      const bins = [];
      for (; l <= depth; s -= 3, t += lshift(1, l * 3), l += 1) {
        const b = t + rshift(beg, s);
        const e = t + rshift(end, s);
        if (e - b + bins.length > maxBinNumber) {
          throw new Error(`query ${beg}-${end} is too large for current binning scheme (shift ${minShift}, depth ${depth}), try a smaller query or a coarser index binning scheme`);
        }
        bins.push([b, e]);
      }
      return bins;
    }
  };

  // node_modules/.pnpm/@gmod+tabix@3.10.2/node_modules/@gmod/tabix/esm/tbi.js
  var TBI_MAGIC = 21578324;
  var TBI_DEPTH = 5;
  var TBI_MIN_SHIFT = 14;
  var TBI_MAX_REF_LENGTH = 2 ** (TBI_MIN_SHIFT + TBI_DEPTH * 3);
  function clampToRefLength(pos) {
    return Math.min(Math.max(pos, 0), TBI_MAX_REF_LENGTH);
  }
  var TabixIndex = class extends IndexFile {
    /**
     * The bins that may overlap [beg, end) (zero-based half-open). TBI's scheme
     * is CSI's with minShift/depth fixed, so this is CSI's reg2bins with the
     * levels unrolled and its float shifts replaced by int32 ones.
     */
    reg2bins(beg, end) {
      if (beg > TBI_MAX_REF_LENGTH) {
        console.warn("querying outside of possible tabix range");
      }
      const b = clampToRefLength(beg);
      const e = Math.min(end, TBI_MAX_REF_LENGTH) - 1;
      const bins = [];
      if (b <= e) {
        bins.push([0, 0], [1 + (b >> 26), 1 + (e >> 26)], [9 + (b >> 23), 9 + (e >> 23)], [73 + (b >> 20), 73 + (e >> 20)], [585 + (b >> 17), 585 + (e >> 17)], [4681 + (b >> 14), 4681 + (e >> 14)]);
      }
      return bins;
    }
    /**
     * The linear index is monotonically non-decreasing, so the minimum virtual
     * offset for chunks that could overlap [beg, ...) is its entry for beg.
     * SYNC: ~/src/gmod/bam-js/src/bai.ts getLowestChunk
     */
    lowestOffset(ref, beg) {
      const linearIndex = ref.linearIndex;
      return linearIndex?.[Math.min(clampToRefLength(beg) >> TBI_MIN_SHIFT, linearIndex.length - 1)];
    }
    /** @internal */
    async _parse(opts = {}) {
      const { bytes, dataView } = await this.readIndexBytes(opts);
      if (dataView.getUint32(0, true) !== TBI_MAGIC) {
        throw new Error("Not a TBI file");
      }
      const refCount = dataView.getUint32(4, true);
      const maxBinNumber = ((1 << (TBI_DEPTH + 1) * 3) - 1) / 7;
      const { refNameToId, refIdToName, coordinateType, format, columnNumbers, metaChar, skipLines } = parseAuxData(bytes, 8);
      const nameSectionLength = dataView.getInt32(32, true);
      let curr = 36 + nameSectionLength;
      let firstDataLine;
      const offsets = [];
      for (let i = 0; i < refCount; i++) {
        offsets.push(curr);
        const binCount = dataView.getInt32(curr, true);
        curr += 4;
        for (let j = 0; j < binCount; j++) {
          const bin = dataView.getUint32(curr, true);
          curr += 4;
          const chunkCount = dataView.getInt32(curr, true);
          curr += 4;
          if (bin > maxBinNumber + 1) {
            throw new Error("tabix index contains too many bins, please use a CSI index");
          }
          curr += 16 * chunkCount;
        }
        const linearCount = dataView.getInt32(curr, true);
        curr += 4;
        firstDataLine = minVirtualOffset(bytes, curr, linearCount, firstDataLine);
        curr += 8 * linearCount;
      }
      function getIndices(refId) {
        const start = offsets[refId];
        if (start === void 0) {
          return void 0;
        }
        let pos = start;
        const binCount = dataView.getInt32(pos, true);
        pos += 4;
        const binIndex = {};
        let stats;
        for (let j = 0; j < binCount; j++) {
          const bin = dataView.getUint32(pos, true);
          pos += 4;
          if (bin > maxBinNumber + 1) {
            throw new Error("tabix index contains too many bins, please use a CSI index");
          } else if (bin === maxBinNumber + 1) {
            const chunkCount = dataView.getInt32(pos, true);
            pos += 4;
            if (chunkCount === 2) {
              stats = parsePseudoBin(bytes, pos + 16);
            }
            pos += 16 * chunkCount;
          } else {
            const chunkCount = dataView.getInt32(pos, true);
            pos += 4;
            const chunks = Array.from({ length: chunkCount });
            for (let k = 0; k < chunkCount; k++) {
              chunks[k] = new Chunk(fromBytes(bytes, pos), fromBytes(bytes, pos + 8), bin);
              pos += 16;
            }
            binIndex[bin] = chunks;
          }
        }
        const linearCount = dataView.getInt32(pos, true);
        pos += 4;
        const linearIndex = Array.from({ length: linearCount });
        for (let k = 0; k < linearCount; k++) {
          linearIndex[k] = fromBytes(bytes, pos);
          pos += 8;
        }
        clampChunkEnds(Object.values(binIndex).flat(), linearIndex.map((v) => v.blockPosition));
        return { binIndex, linearIndex, stats };
      }
      return {
        indices: memoizeByRefId(getIndices),
        metaChar,
        minShift: TBI_MIN_SHIFT,
        depth: TBI_DEPTH,
        maxBinNumber,
        maxRefLength: TBI_MAX_REF_LENGTH,
        skipLines,
        firstDataLine,
        columnNumbers,
        coordinateType,
        format,
        refIdToName,
        refNameToId,
        maxBlockSize: 1 << 16
      };
    }
  };

  // node_modules/.pnpm/@gmod+tabix@3.10.2/node_modules/@gmod/tabix/esm/tabixIndexedFile.js
  var TAB = 9;
  var NEWLINE = 10;
  var CARRIAGE_RETURN = 13;
  var SEMICOLON = 59;
  var LESS_THAN = 60;
  var GREATER_THAN = 62;
  var MAX_READ_AHEAD_CHUNKS = 6;
  var DEFAULT_CHUNK_CACHE_BYTES = 1024 * 2 ** 20;
  var DEFAULT_CHUNK_CACHE_IDLE_TIMEOUT_MS = 3 * 60 * 1e3;
  function resolveFilehandle(filehandle, path, url) {
    if (filehandle) {
      return filehandle;
    }
    if (path) {
      return new LocalFile(path);
    }
    if (url) {
      return new RemoteFile(url);
    }
    throw new TypeError("must provide either filehandle, path, or url");
  }
  function resolveIndex({ tbiFilehandle, csiFilehandle, tbiPath, csiPath, tbiUrl, csiUrl, path, url }) {
    if (tbiFilehandle) {
      return new TabixIndex({ filehandle: tbiFilehandle });
    }
    if (csiFilehandle) {
      return new CSI({ filehandle: csiFilehandle });
    }
    if (tbiPath) {
      return new TabixIndex({ filehandle: new LocalFile(tbiPath) });
    }
    if (csiPath) {
      return new CSI({ filehandle: new LocalFile(csiPath) });
    }
    if (csiUrl) {
      return new CSI({ filehandle: new RemoteFile(csiUrl) });
    }
    if (tbiUrl) {
      return new TabixIndex({ filehandle: new RemoteFile(tbiUrl) });
    }
    if (path) {
      return new TabixIndex({ filehandle: new LocalFile(`${path}.tbi`) });
    }
    if (url) {
      return new TabixIndex({ filehandle: new RemoteFile(`${url}.tbi`) });
    }
    throw new TypeError("must provide one of tbiFilehandle, tbiPath, csiFilehandle, csiPath, tbiUrl, csiUrl");
  }
  function calculateFileOffset(cpositions, dpositions, pos, blockStart, minvDataPosition) {
    return cpositions[pos] * (1 << 8) + (blockStart - dpositions[pos]) + minvDataPosition + 1;
  }
  function getVcfEnd(buffer, startCoordinate, refStart, refEnd, infoStart, infoEnd, altEnd) {
    const refLen = refEnd - refStart;
    let endCoordinate = startCoordinate + refLen;
    let svlen = 0;
    if (buffer[infoStart] === 46) {
      return endCoordinate;
    }
    let fieldStart = infoStart;
    for (let i = infoStart; i <= infoEnd; i++) {
      if (i === infoEnd || buffer[i] === SEMICOLON) {
        const fieldLen = i - fieldStart;
        if (fieldLen >= 10 && buffer[fieldStart] === 83 && // S
        buffer[fieldStart + 1] === 86 && // V
        buffer[fieldStart + 2] === 84 && // T
        buffer[fieldStart + 3] === 89 && // Y
        buffer[fieldStart + 4] === 80 && // P
        buffer[fieldStart + 5] === 69 && // E
        buffer[fieldStart + 6] === 61 && // =
        buffer[fieldStart + 7] === 84 && // T
        buffer[fieldStart + 8] === 82 && // R
        buffer[fieldStart + 9] === 65) {
          return startCoordinate + 1;
        }
        if (fieldLen >= 4 && buffer[fieldStart] === 69 && // E
        buffer[fieldStart + 1] === 78 && // N
        buffer[fieldStart + 2] === 68 && // D
        buffer[fieldStart + 3] === 61) {
          const end = parseIntFromBytes(buffer, fieldStart + 4, i);
          if (end > startCoordinate) {
            endCoordinate = end;
          }
        } else if (fieldLen >= 6 && buffer[fieldStart] === 83 && // S
        buffer[fieldStart + 1] === 86 && // V
        buffer[fieldStart + 2] === 76 && // L
        buffer[fieldStart + 3] === 69 && // E
        buffer[fieldStart + 4] === 78 && // N
        buffer[fieldStart + 5] === 61) {
          svlen = maxSvlenOnRef(buffer, fieldStart + 6, i, refEnd + 1, altEnd);
        }
        fieldStart = i + 1;
      }
    }
    return Math.max(endCoordinate, startCoordinate + svlen);
  }
  var COMMA = 44;
  function svlenSpansRef(buffer, start, end) {
    if (end - start < 5 || buffer[start] !== 60 || buffer[end - 1] !== 62) {
      return false;
    }
    const after = buffer[start + 4];
    if (after !== 62 && after !== 58) {
      return false;
    }
    const a = buffer[start + 1];
    const b = buffer[start + 2];
    const c = buffer[start + 3];
    return a === 67 && b === 78 && c === 86 || // CNV
    a === 68 && b === 69 && c === 76 || // DEL
    a === 68 && b === 85 && c === 80 || // DUP
    a === 73 && b === 78 && c === 86;
  }
  function maxSvlenOnRef(buffer, valuesStart, valuesEnd, altStart, altEnd) {
    let max = 0;
    let value = valuesStart;
    let alt = altStart;
    while (value < valuesEnd && alt < altEnd) {
      let valueEnd = buffer.indexOf(COMMA, value);
      if (valueEnd === -1 || valueEnd > valuesEnd) {
        valueEnd = valuesEnd;
      }
      let alleleEnd = buffer.indexOf(COMMA, alt);
      if (alleleEnd === -1 || alleleEnd > altEnd) {
        alleleEnd = altEnd;
      }
      if (svlenSpansRef(buffer, alt, alleleEnd)) {
        const len = parseIntFromBytes(buffer, buffer[value] === 45 ? value + 1 : value, valueEnd);
        if (len > max) {
          max = len;
        }
      }
      value = valueEnd + 1;
      alt = alleleEnd + 1;
    }
    return max;
  }
  var textDecoder = new TextDecoder();
  function trimToMetaLines(bytes, metaChar) {
    let lastNewline = -1;
    const metaByte = metaChar.charCodeAt(0);
    for (let i = 0, l = bytes.length; i < l; i++) {
      const byte = bytes[i];
      if (i === lastNewline + 1 && byte !== metaByte) {
        break;
      }
      if (byte === NEWLINE) {
        lastNewline = i;
      }
    }
    return bytes.subarray(0, lastNewline + 1);
  }
  function firstLines(bytes, count) {
    let end = 0;
    for (let i = 0; i < count; i++) {
      const n = bytes.indexOf(NEWLINE, end);
      if (n === -1) {
        end = bytes.length;
        break;
      }
      end = n + 1;
    }
    return textDecoder.decode(bytes.subarray(0, end)).split(/\r?\n/).slice(0, count);
  }
  function parseIntFromBytes(buffer, start, end) {
    let val = 0;
    for (let i = start; i < end; i++) {
      const c = buffer[i];
      if (c >= 48 && c <= 57) {
        val = val * 10 + (c - 48);
      } else {
        break;
      }
    }
    return val;
  }
  function scanGafChunk(buffer, cpositions, dpositions, minvDataPosition, { start, end, pathCol, metaCharCode, decoder, callback }) {
    let blockStart = 0;
    let pos = 0;
    while (blockStart < buffer.length) {
      const n = buffer.indexOf(NEWLINE, blockStart);
      if (n === -1) {
        break;
      }
      const lineStart = blockStart;
      blockStart = n + 1;
      const target = lineStart + minvDataPosition;
      while (pos < dpositions.length && target >= dpositions[pos]) {
        pos++;
      }
      if (buffer[lineStart] === metaCharCode) {
        continue;
      }
      let pathStart = lineStart;
      for (let i2 = 1; i2 < pathCol; i2++) {
        const t = buffer.indexOf(TAB, pathStart);
        if (t === -1 || t >= n) {
          pathStart = n;
          break;
        }
        pathStart = t + 1;
      }
      const first = buffer[pathStart];
      if (first !== GREATER_THAN && first !== LESS_THAN) {
        continue;
      }
      let pathEnd = buffer.indexOf(TAB, pathStart);
      if (pathEnd === -1 || pathEnd > n) {
        pathEnd = n;
      }
      let min = Infinity;
      let max = -1;
      let i = pathStart;
      while (i < pathEnd) {
        let id = 0;
        let j = i + 1;
        for (; j < pathEnd; j++) {
          const digit = buffer[j] - 48;
          if (digit < 0 || digit > 9) {
            break;
          }
          id = id * 10 + digit;
        }
        if (id < min) {
          min = id;
        }
        if (id > max) {
          max = id;
        }
        i = j;
      }
      if (min >= end) {
        return true;
      }
      if (max >= start) {
        const lineEnd = buffer[n - 1] === CARRIAGE_RETURN ? n - 1 : n;
        callback(decoder.decode(buffer.subarray(lineStart, lineEnd)), calculateFileOffset(cpositions, dpositions, pos, lineStart, minvDataPosition), min, max + 1);
      }
    }
    return false;
  }
  var TabixIndexedFile = class {
    constructor({ path, filehandle, url, tbiPath, tbiUrl, tbiFilehandle, csiPath, csiUrl, csiFilehandle, chunkCacheSize = DEFAULT_CHUNK_CACHE_BYTES, chunkCacheIdleTimeoutMs = DEFAULT_CHUNK_CACHE_IDLE_TIMEOUT_MS, chunkCacheBudget, bgzfWorkerPool }) {
      __publicField(this, "filehandle");
      __publicField(this, "index");
      __publicField(this, "chunkCache");
      /**
       * The parsed header, as a shared read — see {@link getParsedHeader}. One
       * entry, never evicted, which is what a memo is.
       */
      __publicField(this, "headerCache", new SharedReadCache({}));
      /** see the constructor option of the same name */
      __publicField(this, "bgzfWorkerPool");
      this.bgzfWorkerPool = bgzfWorkerPool;
      this.filehandle = resolveFilehandle(filehandle, path, url);
      this.index = resolveIndex({
        tbiFilehandle,
        csiFilehandle,
        tbiPath,
        csiPath,
        tbiUrl,
        csiUrl,
        path,
        url
      });
      this.chunkCache = new SharedReadCache({
        maxSize: chunkCacheSize,
        // decompressed bytes, not entry count: we fetch compressed and cache
        // decompressed, and an entry is a whole chunk
        sizeOf: (read) => read.buffer.byteLength,
        cacheKey: (chunk) => chunk.toString(),
        idleTimeoutMs: chunkCacheIdleTimeoutMs,
        budget: chunkCacheBudget,
        fill: (chunk, signal) => this.readChunk(chunk, { signal })
      });
    }
    /**
     * Drops every decompressed chunk held by the cache, and stops the idle sweep
     * until something is cached again.
     *
     * `chunkCacheIdleTimeoutMs` reclaims a view the user has wandered away from;
     * this is for a consumer that knows it is finished — a closed track, a
     * changed assembly — and should not have to wait it out.
     */
    clearChunkCache() {
      this.chunkCache.clear();
    }
    /**
     * Estimates the compressed byte size of the index chunks covering the given
     * regions. Useful for byte budgeting before issuing a `getLines` call to
     * decide whether a region is too large to fetch.
     */
    async bytesForRegions(regions, opts = {}) {
      const all = [];
      for (const { refName, start, end } of regions) {
        const chunks = await this.index.blocksForRange(refName, start, end, opts);
        for (const chunk of chunks) {
          all.push(chunk);
        }
      }
      let bytes = 0;
      for (const chunk of optimizeChunks(all)) {
        bytes += chunk.fetchedSize();
      }
      return bytes;
    }
    /**
     * @param refName name of the reference sequence
     * @param s start of the region (0-based half-open)
     * @param e end of the region (0-based half-open)
     * @param opts callback invoked for each line, or an options object with `lineCallback` and optional `signal`
     */
    async getLines(refName, s, e, opts) {
      let signal;
      let options = {};
      let callback;
      let onProgress;
      if (typeof opts === "function") {
        callback = opts;
      } else {
        options = opts;
        callback = opts.lineCallback;
        signal = opts.signal;
        onProgress = opts.onProgress;
      }
      const metadata = await this.index.getMetadata(options);
      const start = s ?? 0;
      const end = e ?? metadata.maxRefLength;
      if (start > end) {
        throw new TypeError("invalid start and end coordinates. start must be less than or equal to end");
      }
      if (start === end) {
        return;
      }
      const chunks = await this.index.blocksForRange(refName, start, end, options);
      const isVCF = metadata.format === "VCF";
      const refCol = metadata.columnNumbers.ref || 0;
      const startCol = metadata.columnNumbers.start || 0;
      const endCol = isVCF ? 8 : metadata.columnNumbers.end || 0;
      const maxColumn = Math.max(refCol, startCol, endCol);
      const metaCharCode = metadata.metaChar?.charCodeAt(0);
      const coordinateOffset = metadata.coordinateType === "1-based-closed" ? -1 : 0;
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const regionRefNameBytes = encoder.encode(refName);
      const tabs = new Int32Array(maxColumn + 1);
      const gaf = metadata.format === "GAF" ? { start, end, pathCol: startCol, metaCharCode, decoder, callback } : void 0;
      let totalBytes = 0;
      for (const c of chunks) {
        totalBytes += c.fetchedSize();
      }
      let downloadedBytes = 0;
      onProgress?.(0, totalBytes);
      let readAhead = 1;
      const reads = [];
      const ensureReadsStarted = (count) => {
        while (reads.length < Math.min(count, chunks.length)) {
          const c = chunks[reads.length];
          const read = this.chunkCache.get(c, signal);
          void read.catch(() => {
          });
          reads.push(read);
        }
      };
      ensureReadsStarted(1);
      for (let ci = 0, cl = chunks.length; ci < cl; ci++) {
        const c = chunks[ci];
        const { buffer, cpositions, dpositions } = await reads[ci];
        downloadedBytes += c.fetchedSize();
        onProgress?.(downloadedBytes, totalBytes);
        const minvDataPosition = c.minv.dataPosition;
        if (gaf) {
          if (scanGafChunk(buffer, cpositions, dpositions, minvDataPosition, gaf)) {
            return;
          }
        } else {
          let blockStart = 0;
          let pos = 0;
          while (blockStart < buffer.length) {
            const n = buffer.indexOf(NEWLINE, blockStart);
            if (n === -1) {
              break;
            }
            const target = blockStart + minvDataPosition;
            while (pos < dpositions.length && target >= dpositions[pos]) {
              pos++;
            }
            if (metaCharCode !== void 0 && buffer[blockStart] === metaCharCode) {
              blockStart = n + 1;
              continue;
            }
            tabs[0] = blockStart - 1;
            for (let i = 0; i < maxColumn; i++) {
              const prev = tabs[i];
              const tabPos = prev < n ? buffer.indexOf(TAB, prev + 1) : -1;
              tabs[i + 1] = tabPos === -1 || tabPos >= n ? n : tabPos;
            }
            const refStart = tabs[refCol - 1] + 1;
            const refEnd = tabs[refCol];
            const refLen = refEnd - refStart;
            if (refLen !== regionRefNameBytes.length) {
              blockStart = n + 1;
              continue;
            }
            let isRefMatch = true;
            for (let i = 0; i < refLen; i++) {
              if (buffer[refStart + i] !== regionRefNameBytes[i]) {
                isRefMatch = false;
                break;
              }
            }
            if (!isRefMatch) {
              blockStart = n + 1;
              continue;
            }
            const startCoordinate = parseIntFromBytes(buffer, tabs[startCol - 1] + 1, tabs[startCol]) + coordinateOffset;
            if (startCoordinate >= end) {
              return;
            }
            let endCoordinate;
            if (endCol === 0 || endCol === startCol) {
              endCoordinate = startCoordinate + 1;
            } else if (isVCF) {
              endCoordinate = getVcfEnd(buffer, startCoordinate, tabs[3] + 1, tabs[4], tabs[endCol - 1] + 1, tabs[endCol], tabs[5]);
            } else {
              endCoordinate = parseIntFromBytes(buffer, tabs[endCol - 1] + 1, tabs[endCol]);
            }
            if (endCoordinate > start) {
              const lineEnd = buffer[n - 1] === CARRIAGE_RETURN ? n - 1 : n;
              const line = decoder.decode(buffer.subarray(blockStart, lineEnd));
              callback(line, calculateFileOffset(cpositions, dpositions, pos, blockStart, minvDataPosition), startCoordinate, endCoordinate);
            }
            blockStart = n + 1;
          }
        }
        readAhead = Math.min(readAhead * 2, MAX_READ_AHEAD_CHUNKS);
        ensureReadsStarted(ci + 1 + readAhead);
      }
    }
    async getMetadata(opts = {}) {
      return this.index.getMetadata(opts);
    }
    /**
     * The file's leading blocks, decompressed: everything from the start through
     * the end of the block holding the first data line.
     */
    async readHeaderBytes(opts) {
      const { firstDataLine, maxBlockSize } = await this.getMetadata(opts);
      const maxFetch = (firstDataLine?.blockPosition ?? 0) + maxBlockSize;
      const buf = await this.filehandle.read(maxFetch, 0, opts);
      return unzip(buf);
    }
    /**
     * Both header forms, from one read of the same bytes: the commented block
     * `tabix -H` prints, and the rows `tabix -S N` counted.
     *
     * Memoized, because asking for one and then the other is the normal way to
     * find a header whichever way the file keeps it (see `getHeaderLines`), and
     * that used to fetch and decompress the file's leading blocks twice. Only
     * the parsed results are retained — the decompressed bytes are dropped,
     * which matters for a VCF header that can run to megabytes.
     */
    async parseHeader(opts) {
      const { metaChar, skipLines = 0 } = await this.getMetadata(opts);
      const bytes = await this.readHeaderBytes(opts);
      return {
        header: textDecoder.decode(metaChar ? trimToMetaLines(bytes, metaChar) : bytes),
        skippedLines: skipLines > 0 ? firstLines(bytes, skipLines) : []
      };
    }
    /**
     * Parse the header, or join the parse already running.
     *
     * `parseHeader` threads `opts` into both `getMetadata` and the header read,
     * so memoizing it on the first caller's opts put that caller's signal in
     * charge of a read every later caller joins: when it aborted, they failed
     * with its cancellation, their own signals untouched.
     *
     * The same cache the chunk reads use, and the same rule: the parse runs under
     * a signal of its own and is cancelled only once every caller waiting on it
     * has given up, so one caller's abort is reported to that caller alone and a
     * bystander gets the parse already in flight. There is no retry here because
     * there is nothing to retry — the parse a bystander joined is not cancelled by
     * someone else's abort. A rejection is dropped rather than cached, so a
     * transient failure does not poison the header for the life of the file.
     *
     * The fill is per call rather than on the cache, so the caller that starts the
     * parse has its `onProgress` reach the index download inside `getMetadata`.
     *
     * SYNC: ~/src/gmod/bam-js/src/bamFile.ts getHeader — same shape for the same
     * reason, on the header rather than the index.
     */
    getParsedHeader(opts = {}) {
      return this.headerCache.get("header", opts.signal, (signal) => this.parseHeader({ ...opts, signal }));
    }
    /**
     * The bytes of the commented header. Deliberately not memoized, unlike the
     * string form: this hands back the buffer, and holding one for the lifetime
     * of the file is the caller's decision to make.
     */
    async getHeaderBuffer(opts = {}) {
      const { metaChar } = await this.getMetadata(opts);
      const bytes = await this.readHeaderBytes(opts);
      return metaChar ? trimToMetaLines(bytes, metaChar) : bytes;
    }
    /**
     * The leading lines the index says to skip — `tabix -S N` — which is where a
     * file whose header row is not commented keeps it. Empty when the index
     * records no skipped lines.
     *
     * Deliberately not part of `getHeader`. htslib draws the same distinction:
     * its indexer treats a line as non-data when `lineno <= line_skip` OR it
     * begins with the meta character (tbx.c), while `tabix -H` prints only the
     * leading meta-character lines and never consults line_skip (tabix.c).
     * `getHeader` mirrors `-H`, so a bare header row is absent from it, and
     * callers that need one were left re-reading the file themselves — guessing
     * at a read size, and unable to tell a headerless file from an uncommented
     * one. PLINK `.ld`, bedGraph and BED deflines are all routinely written this
     * way.
     */
    async getSkippedLines(opts = {}) {
      const { skipLines = 0 } = await this.getMetadata(opts);
      if (skipLines <= 0) {
        return [];
      }
      return (await this.getParsedHeader(opts)).skippedLines;
    }
    async getHeader(opts = {}) {
      return (await this.getParsedHeader(opts)).header;
    }
    /**
     * The file's header lines, however that file keeps them: the meta-character
     * block when there is one, and otherwise the rows the index counted. Empty
     * lines are dropped.
     *
     * The two halves answer different questions (see `getSkippedLines`), but
     * "what are this file's header lines" is nearly always the question a caller
     * actually has, and answering it from `getHeader` alone is wrong in a way
     * that doesn't announce itself: a bare header row comes back as the empty
     * string, indistinguishable from a file that has no header, so callers fall
     * back to an assumed column layout and quietly mis-name columns. Deciding it
     * here also means one read of the leading blocks instead of two.
     */
    async getHeaderLines(opts = {}) {
      const { header, skippedLines } = await this.getParsedHeader(opts);
      return (header ? header.split(/\r?\n/) : skippedLines).filter(Boolean);
    }
    async getReferenceSequenceNames(opts = {}) {
      const metadata = await this.getMetadata(opts);
      return metadata.refIdToName;
    }
    /** @param refName reference sequence name */
    async lineCount(refName, opts = {}) {
      return this.index.lineCount(refName, opts);
    }
    /** @internal */
    async readChunk(c, opts = {}) {
      const ret = await this.filehandle.read(c.fetchedSize(), c.minv.blockPosition, opts);
      const pool = await this.bgzfWorkerPool;
      return unzipChunkSlice(ret, c, pool);
    }
  };

  // node_modules/.pnpm/@jbrowse+graph-walks@1.1.0/node_modules/@jbrowse/graph-walks/esm/util.js
  var RegionTooLargeError = class extends Error {
    constructor(message, limit, windowBp, fitsBp) {
      super(message);
      this.regionTooLarge = true;
      this.name = "NodeLimitError";
      this.limit = limit;
      this.windowBp = windowBp;
      this.fitsBp = fitsBp;
    }
  };
  var SEP = "#";
  function panSNSample(refName) {
    return refName.split(SEP)[0];
  }
  function panSNContig(refName) {
    const parts = refName.split(SEP);
    return parts.length >= 3 ? parts.slice(2).join(SEP) : parts.length === 2 ? parts[1] : refName;
  }
  function panSNHaplotype(refName) {
    const parts = refName.split(SEP);
    return parts.length >= 3 ? `${parts[0]}${SEP}${parts[1]}` : void 0;
  }
  function panSNMatchesPrefix(refName, prefix) {
    return prefix !== void 0 && (refName === prefix || refName.startsWith(prefix + SEP));
  }
  var precise = (n) => Number.parseFloat(n.toPrecision(3));
  function bpString(bp) {
    const mb = precise(bp / 1e6);
    return mb >= 1 ? `${mb.toLocaleString("en-US")}Mbp` : bp >= 1e3 ? `${precise(bp / 1e3).toLocaleString("en-US")}Kbp` : `${Math.floor(bp)}bp`;
  }

  // node_modules/.pnpm/@jbrowse+graph-walks@1.1.0/node_modules/@jbrowse/graph-walks/esm/walkChunk.js
  var NONE = -1;
  var idOf = (handle) => (handle - (handle & 1)) / 2;
  var otherStrand = (handle) => handle & 1 ? handle - 1 : handle + 1;
  function tokens(field, previous, out) {
    if (field === ".") {
      return out;
    }
    let v = 0;
    let neg = false;
    for (let p = 0; p <= field.length; p++) {
      const ch = p < field.length ? field.charCodeAt(p) : 44;
      if (ch === 44) {
        const d = neg ? -v : v;
        const r = d & 1;
        previous.id += (d - r) / 2;
        out.push(previous.id * 2 + r);
        v = 0;
        neg = false;
      } else if (ch === 45) {
        neg = true;
      } else {
        v = v * 10 + (ch - 48);
      }
    }
    return out;
  }
  function numbers(field) {
    return field === "." ? [] : field.split(",").map(Number);
  }
  function canonicalLink(a, b) {
    return a > otherStrand(b) ? [otherStrand(b), otherStrand(a)] : [a, b];
  }
  function tags(cols, from, anchor) {
    let prev;
    let next;
    for (let k = from; k < cols.length; k++) {
      const tag = cols[k];
      if (tag.startsWith("pv:") || tag.startsWith("nx:")) {
        const at = tag.lastIndexOf(":");
        const chunk = {
          refName: tag[3] === "Z" ? tag.slice(5, at) : anchor,
          start: +tag.slice(at + 1)
        };
        if (tag.startsWith("pv:")) {
          prev = chunk;
        } else {
          next = chunk;
        }
      }
    }
    return { prev, next };
  }
  var RefPath = class {
    constructor() {
      this.handles = [];
      this.before = [0];
      this.occurrences = /* @__PURE__ */ new Map();
    }
    add(handles, lengths) {
      for (let k = 0; k < handles.length; k++) {
        const h = handles[k];
        const i = this.handles.length;
        this.handles.push(h);
        this.before.push(this.before[i] + lengths[k]);
        const id = idOf(h);
        const list = this.occurrences.get(id);
        if (list) {
          list.push(i);
        } else {
          this.occurrences.set(id, [i]);
        }
      }
    }
    // bp of R's steps before position i
    bp(i) {
      return this.before[i];
    }
    first(handle) {
      var _a;
      return (_a = this.occurrences.get(idOf(handle))) === null || _a === void 0 ? void 0 : _a[0];
    }
    nearest(handle, i) {
      var _a;
      let best;
      for (const j of (_a = this.occurrences.get(idOf(handle))) !== null && _a !== void 0 ? _a : []) {
        if (best === void 0 || Math.abs(j - i) <= Math.abs(best - i)) {
          best = j;
        }
      }
      return best;
    }
    // The position a stretch along R from position i, reading R the way `h`
    // does there, first holds `target`, i itself included
    reach(i, h, target) {
      var _a;
      const forward2 = this.handles[i] === h;
      let found;
      for (const j of (_a = this.occurrences.get(idOf(target))) !== null && _a !== void 0 ? _a : []) {
        if (forward2 && j >= i && this.handles[j] === target) {
          if (found === void 0 || j < found) {
            found = j;
          }
        } else if (!forward2 && j <= i && otherStrand(this.handles[j]) === target) {
          if (found === void 0 || j > found) {
            found = j;
          }
        }
      }
      return found;
    }
    handleAt(i, forward2) {
      return forward2 ? this.handles[i] : otherStrand(this.handles[i]);
    }
  };
  var WalkRowError = class extends Error {
  };
  var orientedEntry = (route, flip2) => flip2 ? route.exit === NONE ? NONE : otherStrand(route.exit) : route.entry;
  var orientedExit = (route, flip2) => flip2 ? route.entry === NONE ? NONE : otherStrand(route.entry) : route.exit;
  var interiorAt = (route, flip2, k) => flip2 ? otherStrand(route.interior[route.interior.length - 1 - k]) : route.interior[k];
  function parseChoices(field) {
    const choices = [];
    if (field !== ".") {
      let previous = 0;
      let v = 0;
      let neg = false;
      let tok = 0;
      let colonSeen = false;
      for (let p = 0; p <= field.length; p++) {
        const ch = p < field.length ? field.charCodeAt(p) : 44;
        if (ch === 44) {
          const value = neg ? -v : v;
          const d = colonSeen ? tok : value;
          const r = d & 1;
          previous += (d - r) / 2;
          choices.push(previous, r, colonSeen ? value : 0);
          v = 0;
          neg = false;
          colonSeen = false;
        } else if (ch === 58) {
          tok = neg ? -v : v;
          v = 0;
          neg = false;
          colonSeen = true;
        } else if (ch === 45) {
          neg = true;
        } else {
          v = v * 10 + (ch - 48);
        }
      }
    }
    return choices;
  }
  function traverse(path, routes, start, endField, choices, visit) {
    const colon = endField.indexOf(":");
    const end = start + +(colon < 0 ? endField : endField.slice(0, colon));
    const counted2 = colon >= 0;
    const tail = counted2 ? +endField.slice(colon + 1) : 0;
    const routeOf = (index) => {
      const route = routes[index];
      if (!route) {
        throw new WalkRowError(`route ${index} is not in the chunk`);
      }
      return route;
    };
    let k = 0;
    if (choices.length > 0 && orientedEntry(routeOf(choices[0]), choices[1] === 1) === NONE) {
      if (!visit.route(choices[0], choices[1] === 1)) {
        return;
      }
      k = 3;
    }
    let h = start;
    let i = path.first(h);
    if (i === void 0) {
      throw new WalkRowError("a walk row starts off its chunk");
    }
    visit.step(h);
    const follow = (target, count) => {
      const forward2 = path.handles[i] === h;
      const j = counted2 ? i + (forward2 ? count : -count) : path.reach(i, h, target);
      if (j === void 0 || j < 0 || j >= path.handles.length) {
        throw new WalkRowError("a walk row runs off its chunk");
      }
      if (j !== i) {
        visit.stretch(i, j, forward2);
      }
      i = j;
      h = path.handleAt(j, forward2);
    };
    for (; k < choices.length; k += 3) {
      const index = choices[k];
      const flip2 = choices[k + 1] === 1;
      const route = routeOf(index);
      const entry = orientedEntry(route, flip2);
      if (entry === NONE) {
        throw new WalkRowError("an open route after the first choice");
      }
      follow(entry, choices[k + 2]);
      if (!visit.route(index, flip2)) {
        return;
      }
      const exit = orientedExit(route, flip2);
      if (exit === NONE) {
        return;
      }
      h = exit;
      i = path.nearest(h, i);
      if (i === void 0) {
        throw new WalkRowError("a route lands off its chunk");
      }
      visit.step(h);
    }
    follow(end, tail);
    if (h !== end) {
      throw new WalkRowError("a walk row misses its last handle");
    }
  }
  function decodeWalk(path, routes, cols, choices, n) {
    const ids = new Int32Array(n);
    const rev = new Uint8Array(n);
    let at = 0;
    const push = (h) => {
      if (at >= n) {
        throw new WalkRowError("a walk row decodes to more steps than it states");
      }
      ids[at] = idOf(h);
      rev[at++] = h & 1;
    };
    traverse(path, routes, +cols[9], cols[10], choices, {
      step: push,
      stretch(from, to, forward2) {
        if (forward2) {
          for (let j = from + 1; j <= to; j++) {
            push(path.handles[j]);
          }
        } else {
          for (let j = from - 1; j >= to; j--) {
            push(otherStrand(path.handles[j]));
          }
        }
      },
      route(index, flip2) {
        const route = routes[index];
        for (let k = 0; k < route.interior.length; k++) {
          push(interiorAt(route, flip2, k));
        }
        return true;
      }
    });
    if (at !== n) {
      throw new WalkRowError(`a walk row decodes to ${at} steps, not ${n}`);
    }
    return { ids, rev };
  }
  function sliceBases(cols, from, ids, lengths, out) {
    const tag = cols.slice(from).find((c) => c.startsWith("SQ:Z:"));
    if (tag === void 0) {
      return;
    }
    let at = 5;
    for (let k = 0; k < ids.length; k++) {
      const length = lengths[k];
      out.set(ids[k], tag.slice(at, at + length));
      at += length;
    }
  }
  function decodeChunk(rows, keep, withSequences = false) {
    var _a, _b, _c;
    const path = new RefPath();
    const lengths = /* @__PURE__ */ new Map();
    const routes = [];
    const out = {
      sequences: /* @__PURE__ */ new Map(),
      rows: [],
      nodes: /* @__PURE__ */ new Map(),
      ends: [],
      chunk: { path, routes, walks: [], lengths }
    };
    const previous = { id: 0 };
    const refs = rows.filter((c) => c[3] === "ref").sort((a, b) => +a[6] - +b[6]);
    for (const cols of refs) {
      const anchor = cols[0];
      const handles = tokens(cols[9], { id: 0 }, []);
      const nodeLengths = numbers(cols[10]);
      const hapOffset = +cols[6];
      path.add(handles, nodeLengths);
      if (withSequences) {
        sliceBases(cols, 11, handles.map(idOf), nodeLengths, out.sequences);
      }
      let start = hapOffset;
      for (let k = 0; k < handles.length; k++) {
        const id = idOf(handles[k]);
        const length = nodeLengths[k];
        lengths.set(id, length);
        if (!out.nodes.has(id)) {
          out.nodes.set(id, {
            refName: cols[4],
            start,
            end: start + length,
            rank: 0
          });
        }
        start += length;
      }
      out.ends.push({
        name: cols[4],
        fragStart: +cols[5],
        piece: +cols[7],
        first: handles[0],
        last: handles.at(-1)
      });
      if (keep === void 0 || keep(cols[4])) {
        out.rows.push({
          chunkStart: +cols[1],
          name: cols[4],
          fragStart: +cols[5],
          hapOffset,
          piece: +cols[7],
          n: handles.length,
          steps: {
            ids: Int32Array.from(handles, idOf),
            rev: Uint8Array.from(handles, (h) => h & 1)
          },
          ...tags(cols, 11, anchor)
        });
      }
    }
    for (const cols of rows) {
      if (cols[3] === "nodes") {
        const ids = numbers(cols[4]);
        const nodeLengths = numbers(cols[5]);
        let id = 0;
        for (let k = 0; k < ids.length; k++) {
          id += ids[k];
          ids[k] = id;
          lengths.set(id, nodeLengths[k]);
        }
        if (withSequences) {
          sliceBases(cols, 6, ids, nodeLengths, out.sequences);
        }
      } else if (cols[3] === "route") {
        const entry = tokens(cols[4], previous, []);
        const interior = tokens(cols[5], previous, []);
        const exit = tokens(cols[6], previous, []);
        routes.push({ entry: (_a = entry[0]) !== null && _a !== void 0 ? _a : NONE, interior, exit: (_b = exit[0]) !== null && _b !== void 0 ? _b : NONE });
      }
    }
    const routeOf = (index) => {
      const route = routes[index];
      if (!route) {
        throw new WalkRowError(`route ${index} is not in the chunk`);
      }
      return route;
    };
    for (const cols of rows) {
      if (cols[3] !== "walk") {
        continue;
      }
      const choices = parseChoices(cols[11]);
      out.chunk.walks.push({ cols, choices });
      const name = cols[4];
      const start = +cols[9];
      const endField = cols[10];
      const colon = endField.indexOf(":");
      let first = start;
      let last = start + +(colon < 0 ? endField : endField.slice(0, colon));
      if (choices.length > 0) {
        const lead = routeOf(choices[0]);
        const leadFlip = choices[1] === 1;
        if (orientedEntry(lead, leadFlip) === NONE) {
          first = interiorAt(lead, leadFlip, 0);
        }
        const at = choices.length - 3;
        const tail = routeOf(choices[at]);
        const tailFlip = choices[at + 1] === 1;
        if (orientedExit(tail, tailFlip) === NONE) {
          last = interiorAt(tail, tailFlip, tail.interior.length - 1);
        }
      }
      out.ends.push({
        name,
        fragStart: +cols[5],
        piece: +cols[7],
        first,
        last
      });
      if (keep === void 0 || keep(name)) {
        const n = +cols[8];
        for (let k = 0; k < choices.length; k += 3) {
          for (const h of routeOf(choices[k]).interior) {
            const id = idOf(h);
            if (!out.nodes.has(id)) {
              const length = (_c = lengths.get(id)) !== null && _c !== void 0 ? _c : 0;
              out.nodes.set(id, { refName: name, start: 0, end: length, rank: 1 });
            }
          }
        }
        out.rows.push({
          chunkStart: +cols[1],
          name,
          fragStart: +cols[5],
          hapOffset: +cols[6],
          piece: +cols[7],
          n,
          steps: decodeWalk(path, routes, cols, choices, n),
          ...tags(cols, 12, cols[0])
        });
      }
    }
    return out;
  }
  function placeAndLink(chunks, kept, place2, link) {
    const best = /* @__PURE__ */ new Map();
    for (const { path, routes, walks, lengths } of chunks) {
      const handles = path.handles;
      for (let k = 1; k < handles.length; k++) {
        if (kept.has(idOf(handles[k - 1])) && kept.has(idOf(handles[k]))) {
          link(...canonicalLink(handles[k - 1], handles[k]));
        }
      }
      const wanted = new Uint8Array(routes.length);
      for (let index = 0; index < routes.length; index++) {
        const { entry, interior, exit } = routes[index];
        let any = false;
        let from = entry;
        for (const h of interior) {
          const inCut = kept.has(idOf(h));
          any || (any = inCut);
          if (inCut && from !== NONE && kept.has(idOf(from))) {
            link(...canonicalLink(from, h));
          }
          from = h;
        }
        if (from !== NONE && exit !== NONE && kept.has(idOf(from)) && kept.has(idOf(exit))) {
          link(...canonicalLink(from, exit));
        }
        wanted[index] = any ? 1 : 0;
      }
      const lengthOf = (h) => {
        var _a;
        return (_a = lengths.get(idOf(h))) !== null && _a !== void 0 ? _a : 0;
      };
      const bp = new Float64Array(routes.length).fill(-1);
      const routeBp = (index) => {
        if (bp[index] < 0) {
          bp[index] = routes[index].interior.reduce((s, h) => s + lengthOf(h), 0);
        }
        return bp[index];
      };
      const taken = new Uint8Array(routes.length);
      for (const { cols, choices } of walks) {
        let remaining = 0;
        for (let k = 0; k < choices.length; k += 3) {
          const index = choices[k];
          if (wanted[index] && !taken[index]) {
            remaining++;
          }
        }
        if (remaining === 0) {
          continue;
        }
        const name = cols[4];
        let offset = +cols[6];
        traverse(path, routes, +cols[9], cols[10], choices, {
          step(h) {
            offset += lengthOf(h);
          },
          stretch(from, to, forward2) {
            offset += forward2 ? path.bp(to + 1) - path.bp(from + 1) : path.bp(from) - path.bp(to);
          },
          route(index, flip2) {
            if (!wanted[index] || taken[index]) {
              offset += routeBp(index);
              return true;
            }
            taken[index] = 1;
            const route = routes[index];
            for (let k = 0; k < route.interior.length; k++) {
              const h = interiorAt(route, flip2, k);
              const id = idOf(h);
              const length = lengthOf(h);
              if (kept.has(id)) {
                const held = best.get(id);
                if (!held || name < held.refName || name === held.refName && offset < held.start) {
                  best.set(id, {
                    refName: name,
                    start: offset,
                    end: offset + length,
                    rank: 1
                  });
                }
              }
              offset += length;
            }
            remaining--;
            return remaining > 0;
          }
        });
      }
    }
    for (const [id, node] of best) {
      place2(id, node);
    }
  }
  function pieceLinks(ends) {
    const byPath = /* @__PURE__ */ new Map();
    for (const e of ends) {
      const key = `${e.name}	${e.fragStart}`;
      let pieces = byPath.get(key);
      if (!pieces) {
        pieces = /* @__PURE__ */ new Map();
        byPath.set(key, pieces);
      }
      pieces.set(e.piece, e);
    }
    const links = [];
    for (const pieces of byPath.values()) {
      for (const [piece, e] of pieces) {
        const next = pieces.get(piece + 1);
        if (next) {
          links.push(canonicalLink(e.last, next.first));
        }
      }
    }
    return links;
  }

  // node_modules/.pnpm/@jbrowse+graph-walks@1.1.0/node_modules/@jbrowse/graph-walks/esm/walkRows.js
  function integerTag(line, tag) {
    const match = new RegExp(`(?:^|\\t)${tag}:i:(\\d+)`).exec(line);
    return match ? +match[1] : void 0;
  }
  function walkHeader(lines) {
    var _a, _b, _c;
    const header = { references: [], haplotypes: [] };
    for (const line of lines) {
      const [key, value = ""] = line.split("	");
      if (key === "#reference") {
        header.references.push(value);
      } else if (key === "#haplotype") {
        header.haplotypes.push(value);
      } else {
        (_a = header.format) !== null && _a !== void 0 ? _a : header.format = integerTag(line, "format");
        (_b = header.chunk) !== null && _b !== void 0 ? _b : header.chunk = integerTag(line, "chunk");
        (_c = header.maxNode) !== null && _c !== void 0 ? _c : header.maxNode = integerTag(line, "maxnode");
      }
    }
    return header;
  }
  function lookbackChunks(maxNode, chunk) {
    return maxNode === void 0 ? 1 : Math.max(1, Math.ceil(maxNode / chunk));
  }
  function chunkQueryStart(start, chunk, lookback = 1) {
    return Math.max(0, (Math.floor(start / chunk) - lookback) * chunk);
  }
  function walkNameFilter(wanted, referenceHaplotype) {
    return wanted === void 0 || wanted.length === 0 ? void 0 : (name) => panSNMatchesPrefix(name, referenceHaplotype) || wanted.some((prefix) => panSNMatchesPrefix(name, prefix));
  }
  function walksKept(wanted, refName) {
    var _a;
    return walkNameFilter(wanted, (_a = panSNHaplotype(refName)) !== null && _a !== void 0 ? _a : refName);
  }
  function joinPieces(rows) {
    const byPath = /* @__PURE__ */ new Map();
    for (const row of rows) {
      const key = `${row.name}	${row.fragStart}`;
      const list = byPath.get(key);
      if (list) {
        list.push(row);
      } else {
        byPath.set(key, [row]);
      }
    }
    const runs = [];
    for (const pieces of byPath.values()) {
      pieces.sort((a, b) => a.piece - b.piece);
      let from = 0;
      for (let i = 1; i <= pieces.length; i++) {
        if (i === pieces.length || pieces[i].piece !== pieces[i - 1].piece + 1) {
          runs.push(decodeRun(pieces.slice(from, i)));
          from = i;
        }
      }
    }
    return runs;
  }
  function decodeRun(pieces) {
    const n = pieces.reduce((sum, p) => sum + p.n, 0);
    const ids = new Int32Array(n);
    const rev = new Uint8Array(n);
    let at = 0;
    for (const p of pieces) {
      ids.set(p.steps.ids, at);
      rev.set(p.steps.rev, at);
      at += p.n;
    }
    const first = pieces[0];
    return {
      name: first.name,
      hapOffset: first.hapOffset,
      ids,
      rev,
      prev: first.prev,
      next: pieces.at(-1).next
    };
  }
  function walkCut(runs, nodes, refName) {
    const onWindow = (id) => {
      var _a;
      return ((_a = nodes.get(id)) === null || _a === void 0 ? void 0 : _a.onWindow) === true;
    };
    const reference = (id) => {
      const node = nodes.get(id);
      return (node === null || node === void 0 ? void 0 : node.rank) === 0 ? node : void 0;
    };
    const open = /* @__PURE__ */ new Map();
    const goesOn = (chunk) => {
      if (chunk) {
        open.set(`${chunk.refName}:${chunk.start}`, chunk);
      }
    };
    const rejoin = (run, at, dir) => {
      const { ids } = run;
      let i = at + dir;
      while (i >= 0 && i < ids.length && reference(ids[i]) === void 0) {
        i += dir;
      }
      if (i < 0 || i >= ids.length) {
        goesOn(dir < 0 ? run.prev : run.next);
        return i - dir;
      }
      const from = reference(ids[at]);
      const to = reference(ids[i]);
      if (to.refName !== refName) {
        return i - dir;
      }
      const adjacent = i === at + dir && (to.start === from.end || to.end === from.start);
      return adjacent ? at : i;
    };
    let reachStart = Infinity;
    let reachEnd = -Infinity;
    const spans = [];
    for (const run of runs) {
      const { ids } = run;
      let first = -1;
      let last = -1;
      for (let i = 0; i < ids.length; i++) {
        if (onWindow(ids[i])) {
          if (first < 0) {
            first = i;
          }
          last = i;
        }
      }
      if (first >= 0) {
        if (run.name !== refName) {
          first = rejoin(run, first, -1);
          last = rejoin(run, last, 1);
          for (const i of [first, last]) {
            const node = reference(ids[i]);
            if (node) {
              reachStart = Math.min(reachStart, node.start);
              reachEnd = Math.max(reachEnd, node.end);
            }
          }
        }
        spans.push({ run, first, last });
      }
    }
    const inReach = (id) => {
      const node = reference(id);
      return onWindow(id) || (node === null || node === void 0 ? void 0 : node.refName) === refName && node.end > reachStart && node.start < reachEnd;
    };
    const kept = /* @__PURE__ */ new Set();
    for (const [id, node] of nodes) {
      if (node.onWindow) {
        kept.add(id);
      }
    }
    for (const span of spans) {
      const { ids } = span.run;
      if (span.run.name === refName) {
        while (span.first > 0 && inReach(ids[span.first - 1])) {
          span.first--;
        }
        while (span.last < ids.length - 1 && inReach(ids[span.last + 1])) {
          span.last++;
        }
      }
      for (let i = span.first; i <= span.last; i++) {
        kept.add(ids[i]);
      }
    }
    const length = (id) => {
      const node = nodes.get(id);
      return node === void 0 ? 0 : node.end - node.start;
    };
    const fragments = [];
    for (const { run, first: f, last: l } of spans) {
      const { ids, rev } = run;
      let first = f;
      let last = l;
      while (first > 0 && kept.has(ids[first - 1])) {
        first--;
      }
      while (last < ids.length - 1 && kept.has(ids[last + 1])) {
        last++;
      }
      let hapStart = run.hapOffset;
      for (let i = 0; i < first; i++) {
        hapStart += length(ids[i]);
      }
      let hapEnd = hapStart;
      for (let i = first; i <= last; i++) {
        hapEnd += length(ids[i]);
      }
      fragments.push({
        name: run.name,
        hapStart,
        hapEnd,
        ids: ids.subarray(first, last + 1),
        rev: rev.subarray(first, last + 1)
      });
    }
    return { kept, fragments, open: [...open.values()] };
  }
  var WalkGraph = class {
    constructor(window) {
      this.nodes = /* @__PURE__ */ new Map();
      this.sequences = /* @__PURE__ */ new Map();
      this.links = [];
      this.chunks = [];
      this.window = window;
    }
    // A node with its position, unless the cut already holds it
    placeNode(id, node) {
      if (this.nodes.has(id)) {
        return;
      }
      const { window } = this;
      this.nodes.set(id, {
        ...node,
        onWindow: node.rank === 0 && node.refName === window.refName && node.end > window.start - window.context && node.start < window.end + window.context
      });
    }
    // A link between two endpoints, each id * 2 + 1 when reversed
    addLinkEnds(source, target) {
      this.links.push(source, target);
    }
    addChunk(chunk) {
      this.chunks.push(chunk);
    }
    // Bases of nodes a chunk's rows give, for a window that asks for them
    addSequences(sequences) {
      if (this.window.sequences) {
        for (const [id, bases] of sequences) {
          this.sequences.set(id, bases);
        }
      }
    }
    /**
     * The cut as typed arrays, which the worker transfers rather than copies:
     * nodes by reference position, each link once in the order its L line
     * sorts, then a walk per fragment, the reference's first and the rest by
     * name. graphTablesGFA writes them as the GFA they stand for, the same bytes
     * for the same rows.
     */
    tables(kept, fragments) {
      if (this.chunks.length > 0) {
        placeAndLink(this.chunks, kept, (id, node) => {
          const held2 = this.nodes.get(id);
          if (held2) {
            this.nodes.set(id, { ...held2, ...node });
          }
        }, (a, b) => {
          this.links.push(a, b);
        });
      }
      const held = [];
      for (const id of kept) {
        const node = this.nodes.get(id);
        if (node) {
          held.push({ ...node, id });
        }
      }
      held.sort((x, y) => x.refName < y.refName ? -1 : x.refName > y.refName ? 1 : x.start - y.start || x.id - y.id);
      const index = /* @__PURE__ */ new Map();
      const names = [];
      const refNames = [];
      const refIndex = /* @__PURE__ */ new Map();
      const lengths = new Int32Array(held.length);
      const refs = new Int32Array(held.length);
      const starts = new Float64Array(held.length);
      const ranks = new Int32Array(held.length);
      held.forEach(({ id, refName, start, end, rank }, i) => {
        index.set(id, i);
        names.push(String(id));
        let ref = refIndex.get(refName);
        if (ref === void 0) {
          ref = refNames.length;
          refIndex.set(refName, ref);
          refNames.push(refName);
        }
        lengths[i] = end - start;
        refs[i] = ref;
        starts[i] = start;
        ranks[i] = rank;
      });
      const nodeIndex = (id) => {
        let i = index.get(id);
        if (i === void 0) {
          i = names.length;
          index.set(id, i);
          names.push(String(id));
        }
        return i;
      };
      const byLine = /* @__PURE__ */ new Map();
      for (let i = 0; i < this.links.length; i += 2) {
        const a = this.links[i];
        const b = this.links[i + 1];
        const source = Math.floor(a / 2);
        const target = Math.floor(b / 2);
        if (kept.has(source) && kept.has(target)) {
          byLine.set(`${source}	${a % 2 ? "-" : "+"}	${target}	${b % 2 ? "-" : "+"}`, i);
        }
      }
      const lines = [...byLine.keys()].sort();
      const from = new Int32Array(lines.length);
      const to = new Int32Array(lines.length);
      const strands = new Uint8Array(lines.length);
      lines.forEach((line, k) => {
        const i = byLine.get(line);
        const a = this.links[i];
        const b = this.links[i + 1];
        from[k] = nodeIndex(Math.floor(a / 2));
        to[k] = nodeIndex(Math.floor(b / 2));
        strands[k] = a % 2 | b % 2 << 1;
      });
      const walks = this.referenceFirst(fragments);
      const offsets = new Int32Array(walks.length + 1);
      walks.forEach(({ ids }, p) => {
        offsets[p + 1] = offsets[p] + ids.length;
      });
      const steps = new Int32Array(offsets[walks.length]);
      const reversed = new Uint8Array(steps.length);
      walks.forEach(({ ids, rev }, p) => {
        const at = offsets[p];
        for (let j = 0; j < ids.length; j++) {
          steps[at + j] = nodeIndex(ids[j]);
        }
        reversed.set(rev, at);
      });
      return {
        nodes: { names, lengths, refs, starts, ranks, refNames },
        links: { from, to, strands },
        walks: {
          names: walks.map((f) => f.name),
          starts: Float64Array.from(walks, (f) => f.hapStart),
          ends: Float64Array.from(walks, (f) => f.hapEnd),
          offsets,
          steps,
          reversed
        }
      };
    }
    // The view anchors on the first walk when no walk names the assembly, as
    // gbz-base's cut has it; in file order that was whichever haplotype the
    // chunk listed first, CHM13 on a GRCh38 window
    referenceFirst(fragments) {
      const { refName } = this.window;
      return [...fragments].sort((a, b) => Number(b.name === refName) - Number(a.name === refName) || (a.name < b.name ? -1 : a.name > b.name ? 1 : a.hapStart - b.hapStart));
    }
  };
  var BUDGET_NAMES = {
    steps: "the step budget",
    bytes: "a byte budget of"
  };
  function stepBudgetError(rows, stepBudget, readPerKept, window, chunk, filtered, names = BUDGET_NAMES) {
    var _a;
    let total = 0;
    const perChunk = /* @__PURE__ */ new Map();
    const walks = /* @__PURE__ */ new Set();
    for (const row of rows) {
      total += row.n;
      perChunk.set(row.chunkStart, ((_a = perChunk.get(row.chunkStart)) !== null && _a !== void 0 ? _a : 0) + row.n);
      walks.add(row.name);
    }
    const budget = stepBudget * readPerKept;
    if (total <= budget) {
      return void 0;
    }
    const windowBp = window.end - window.start;
    let read = 0;
    let fitsBp = 0;
    for (const cs of [...perChunk.keys()].sort((a, b) => a - b)) {
      read += perChunk.get(cs);
      if (read > budget) {
        break;
      }
      fitsBp = Math.max(fitsBp, cs + chunk - window.start);
    }
    const fewerFit = !filtered && walks.size > 2 && 2 * total / walks.size <= budget;
    return new RegionTooLargeError(fitsBp > 0 ? `Zoom in to about ${bpString(fitsBp)}${fewerFit ? ", or choose fewer haplotypes," : ""} to see the graph` : `Too many haplotype steps here to draw ${filtered ? "these haplotypes" : "every haplotype"} (${read.toLocaleString()} steps read, over ${readPerKept} \xD7 ${names.steps} of ${stepBudget.toLocaleString()}); choose fewer haplotypes`, budget, windowBp, Math.max(fitsBp, 1));
  }
  function keptStepsError(fragments, budget, window, filtered) {
    const total = fragments.reduce((sum, f) => sum + f.ids.length, 0);
    if (total <= budget) {
      return void 0;
    }
    const windowBp = window.end - window.start;
    const fitsBp = Math.max(1, Math.floor(windowBp * budget / total));
    return new RegionTooLargeError(`Zoom in to about ${bpString(fitsBp)}${filtered ? "" : ", or choose fewer haplotypes,"} to see the graph`, budget, windowBp, fitsBp);
  }
  async function byteBudgetError(bytesTo, budget, window, chunk, names = BUDGET_NAMES) {
    const bytes = await bytesTo(window.end);
    if (bytes <= budget) {
      return void 0;
    }
    let fitsBp = 0;
    let least;
    for (let cs = Math.floor(window.start / chunk) * chunk; cs < window.end; cs += chunk) {
      const read = await bytesTo(cs + 1);
      least !== null && least !== void 0 ? least : least = read;
      if (read > budget) {
        break;
      }
      fitsBp = cs + chunk - window.start;
    }
    const windowBp = window.end - window.start;
    return new RegionTooLargeError(fitsBp > 0 ? `Zoom in to about ${bpString(fitsBp)} to see the graph` : `Too much graph here to fetch (${megabytes(least !== null && least !== void 0 ? least : bytes)} against ${names.bytes} ${megabytes(budget)})`, budget, windowBp, Math.max(fitsBp, 1));
  }
  var megabytes = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`;

  // node_modules/.pnpm/@jbrowse+graph-walks@1.1.0/node_modules/@jbrowse/graph-walks/esm/refNames.js
  function qualifiedKey(assemblyName, refName) {
    return `${assemblyName}	${refName}`;
  }
  function refNameLookup(names) {
    const lookup = /* @__PURE__ */ new Map();
    for (const name of names) {
      lookup.set(name, name);
      const sample = panSNSample(name);
      if (sample !== name) {
        const contig = panSNContig(name);
        lookup.set(qualifiedKey(sample, contig), name);
        const haplotype = panSNHaplotype(name);
        if (haplotype !== void 0) {
          lookup.set(qualifiedKey(haplotype, contig), name);
        }
      }
    }
    return lookup;
  }
  function resolveRefName(lookup, assemblyName, refName) {
    var _a;
    return (_a = lookup.get(qualifiedKey(assemblyName, refName))) !== null && _a !== void 0 ? _a : lookup.get(refName);
  }

  // node_modules/.pnpm/@jbrowse+graph-walks@1.1.0/node_modules/@jbrowse/graph-walks/esm/walkReader.js
  var READ_STEPS_PER_KEPT = 8;
  var FOLLOW_ROUNDS = 3;
  var FOLLOW_CHUNKS = 4;
  var WALK_CONTEXT = 1e3;
  var WalkFormatError = class extends Error {
    constructor() {
      super(...arguments);
      this.name = "WalkFormatError";
    }
  };
  function checkRange(refName, start, end) {
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new Error(`${refName}:${start}-${end} is not a finite range to query the graph's index for`);
    }
  }
  function raceAbort(promise, signal) {
    if (!signal) {
      return promise;
    }
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        reject(signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason)));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      promise.then(resolve, reject).finally(() => {
        signal.removeEventListener("abort", onAbort);
      });
    });
  }
  var WalkReader = class {
    constructor(walks) {
      this.walks = walks;
    }
    // The header, read once for every caller: one caller giving up stops only
    // its own wait, and a read that fails is tried again by the next caller
    header(opts = {}) {
      if (!this.headerRead) {
        const read = this.walks.getHeaderLines().then((lines) => {
          var _a;
          const header = walkHeader(lines);
          if (header.format !== 2) {
            throw new WalkFormatError("This walk file is format 1, from gfa-to-tabix 0.12 or earlier; rebuild it with gfa-to-tabix 1.0 or later");
          }
          const chunk = (_a = header.chunk) !== null && _a !== void 0 ? _a : 65536;
          return {
            ...header,
            chunk,
            lookback: lookbackChunks(header.maxNode, chunk)
          };
        });
        read.catch(() => {
          if (this.headerRead === read) {
            this.headerRead = void 0;
          }
        });
        this.headerRead = read;
      }
      return raceAbort(this.headerRead, opts.signal);
    }
    // The reference sequences the walk file holds windows on
    referenceSequences(opts = {}) {
      return this.walks.getReferenceSequenceNames(opts);
    }
    /**
     * The walk file's sequence for `refName` on `sample`, or for `refName` as
     * the file spells it: `chr6` on `GRCh38` is `GRCh38#0#chr6`. Undefined when
     * the file holds neither.
     */
    async sequenceFor(sample, refName, opts = {}) {
      if (!this.lookupRead) {
        const read = this.walks.getReferenceSequenceNames().then(refNameLookup);
        read.catch(() => {
          if (this.lookupRead === read) {
            this.lookupRead = void 0;
          }
        });
        this.lookupRead = read;
      }
      const lookup = await raceAbort(this.lookupRead, opts.signal);
      return resolveRefName(lookup, sample, refName);
    }
    async queryStart(start, opts = {}) {
      const { chunk, lookback } = await this.header(opts);
      return chunkQueryStart(start, chunk, lookback);
    }
    async cut(refName, region, opts = {}) {
      var _a;
      const { signal, keep, context = WALK_CONTEXT, stepBudget = Infinity, byteBudget = Infinity, links = true } = opts;
      const { chunk, lookback } = await this.header({ signal });
      const from = chunkQueryStart(region.start, chunk, lookback);
      const bytesForRegions = (_a = this.walks.bytesForRegions) === null || _a === void 0 ? void 0 : _a.bind(this.walks);
      const budgeted = Number.isFinite(byteBudget) && bytesForRegions !== void 0;
      const bytesFor = async (spans) => budgeted ? bytesForRegions(spans.map((span) => ({ refName, ...span })), { signal }) : 0;
      const tooLarge = budgeted ? await byteBudgetError(async (end) => {
        checkRange(refName, from, end);
        return bytesFor([{ start: from, end }]);
      }, byteBudget, region, chunk, opts.budgetNames) : void 0;
      if (tooLarge) {
        throw tooLarge;
      }
      const reads = new AbortController();
      const stop = () => {
        reads.abort(signal === null || signal === void 0 ? void 0 : signal.reason);
      };
      signal === null || signal === void 0 ? void 0 : signal.throwIfAborted();
      signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", stop, { once: true });
      const rows = [];
      let cut;
      const graph = new WalkGraph({
        refName,
        start: region.start,
        end: region.end,
        context,
        sequences: opts.sequences
      });
      const decoded = /* @__PURE__ */ new Set();
      const ends = [];
      const readChunks = async (start, end) => {
        checkRange(refName, start, end);
        const byChunk = /* @__PURE__ */ new Map();
        await this.walks.getLines(refName, start, end, {
          signal: reads.signal,
          lineCallback: (line) => {
            const cols = line.split("	");
            const cs = +cols[1];
            const held = byChunk.get(cs);
            if (held) {
              held.push(cols);
            } else {
              byChunk.set(cs, [cols]);
            }
          }
        });
        for (const [cs, chunkRows] of byChunk) {
          if (decoded.has(cs)) {
            continue;
          }
          decoded.add(cs);
          const chunkCut = decodeChunk(chunkRows, keep, opts.sequences);
          rows.push(...chunkCut.rows);
          for (const [id, node] of chunkCut.nodes) {
            graph.placeNode(id, node);
          }
          graph.addSequences(chunkCut.sequences);
          graph.addChunk(chunkCut.chunk);
          ends.push(...chunkCut.ends);
        }
        if (links) {
          for (const [a, b] of pieceLinks(ends)) {
            graph.addLinkEnds(a, b);
          }
        }
      };
      try {
        await readChunks(from, region.end);
        const tooManyRead = stepBudgetError(rows, stepBudget, READ_STEPS_PER_KEPT, region, chunk, keep !== void 0, opts.budgetNames);
        if (tooManyRead) {
          throw tooManyRead;
        }
        let first = from;
        let last = Math.floor((region.end - 1) / chunk) * chunk;
        const reach = FOLLOW_CHUNKS * chunk;
        const [lo, hi] = [first - reach, last + reach];
        cut = walkCut(joinPieces(rows), graph.nodes, refName);
        let spent = await bytesFor([{ start: from, end: region.end }]);
        for (let round = 0; round < FOLLOW_ROUNDS; round++) {
          const starts = cut.open.filter((c) => c.refName === refName && c.start >= lo && c.start <= hi).map((c) => c.start);
          const spans = [
            { start: Math.min(first, ...starts), end: first },
            { start: last + chunk, end: Math.max(last, ...starts) + 1 }
          ].filter((span) => span.end > span.start);
          if (spans.length === 0) {
            break;
          }
          spent += await bytesFor(spans);
          if (spent > byteBudget) {
            break;
          }
          first = Math.min(first, ...starts);
          last = Math.max(last, ...starts);
          await Promise.all(spans.map(({ start, end }) => readChunks(start, end)));
          cut = walkCut(joinPieces(rows), graph.nodes, refName);
        }
      } catch (error) {
        reads.abort();
        throw error;
      } finally {
        signal === null || signal === void 0 ? void 0 : signal.removeEventListener("abort", stop);
      }
      const tooMany = keptStepsError(cut.fragments, stepBudget, region, keep !== void 0);
      if (tooMany) {
        throw tooMany;
      }
      return { graph, ...cut };
    }
  };

  // tools/walks.js
  function rangeFile(location) {
    const bytes = (position, length) => {
      const [value] = console.r.call("ggtubemap:::fetch_range", [location, position, length]);
      return fromBase64(value ?? "");
    };
    return {
      read: async (length, position) => bytes(position, length),
      readFile: async () => bytes(0, -1),
      close: async () => {
      }
    };
  }
  function tracksOf({ nodes, walks }, reference) {
    const tracks = [];
    for (let p = 0; p < walks.names.length; p++) {
      const sequence = [];
      for (let s = walks.offsets[p]; s < walks.offsets[p + 1]; s++) {
        const name = nodes.names[walks.steps[s]];
        sequence.push(walks.reversed[s] ? `-${name}` : name);
      }
      tracks.push({
        name: walks.names[p],
        sequence,
        index_of_first_base: walks.starts[p]
      });
    }
    return tracks.sort((a, b) => (b.name === reference) - (a.name === reference));
  }
  globalThis.cutWalks = async function({
    file,
    index,
    refName,
    start,
    end,
    haplotypes,
    context
  }) {
    const reader = new WalkReader(
      new TabixIndexedFile({
        filehandle: rangeFile(file),
        tbiFilehandle: rangeFile(index),
        chunkCacheIdleTimeoutMs: 0
      })
    );
    const { references: references2 } = await reader.header();
    const sample = references2[0] ?? "";
    const anchor = await reader.sequenceFor(sample, refName);
    if (anchor === void 0) {
      const names = await reader.referenceSequences();
      throw new Error(
        `the walk file has no sequence ${refName} on ${sample}; it holds ${names.slice(0, 5).join(", ")}${names.length > 5 ? ", ..." : ""}`
      );
    }
    const { graph, kept, fragments } = await reader.cut(
      anchor,
      { start, end },
      { context, keep: walksKept(haplotypes, anchor), sequences: true, links: false }
    );
    const tables = graph.tables(kept, fragments);
    const seq = tables.nodes.names.map((name) => graph.sequences.get(Number(name)) ?? null);
    return JSON.stringify({
      nodes: {
        name: tables.nodes.names,
        seq,
        sequence_length: [...tables.nodes.lengths]
      },
      tracks: tracksOf(tables, anchor)
    });
  };

  // node_modules/.pnpm/@jbrowse+tubemap-core@2.0.1/node_modules/@jbrowse/tubemap-core/esm/groupBy.js
  function groupBy(items, key) {
    const groups = /* @__PURE__ */ new Map();
    for (const item of items) {
      const k = key(item);
      const group = groups.get(k);
      if (group === void 0) {
        groups.set(k, [item]);
      } else {
        group.push(item);
      }
    }
    return groups;
  }

  // node_modules/.pnpm/@jbrowse+tubemap-core@2.0.1/node_modules/@jbrowse/tubemap-core/esm/panSN.js
  var NOT_SAMPLES = /* @__PURE__ */ new Set(["_gbwt_ref", "unknown"]);
  function parsePanSN(name) {
    const [sample, haplotype, contig] = name?.split("#") ?? [];
    if (sample === void 0 || sample === "" || NOT_SAMPLES.has(sample) || haplotype === void 0 || !/^\d+$/.test(haplotype) || contig === void 0 || contig === "") {
      return void 0;
    }
    return { sample, haplotype: Number(haplotype), contig };
  }

  // node_modules/.pnpm/@jbrowse+tubemap-core@2.0.1/node_modules/@jbrowse/tubemap-core/esm/layout.js
  var READ_FACET_FIELDS = ["read_group", "sample_name"];
  var FACET_FIELDS = [...READ_FACET_FIELDS, "haplotype_sample"];
  var DEFAULT_CHAR_WIDTH = 8.401;
  function layersFrom({ layers, coarsenedReadView = false, showReads = true }, hasReads) {
    if (layers !== void 0) {
      return layers;
    }
    const coarsen = coarsenedReadView && showReads;
    const stat = (banded) => banded ? { stat: "coarsen" } : {};
    return [
      { data: "haplotypes", ...stat(coarsen && !hasReads) },
      { data: "reads", ...stat(coarsen && hasReads) }
    ];
  }
  function statOf(layers, data) {
    return layers.find((layer) => layer.data === data)?.stat;
  }
  function configFrom(options, hasReads) {
    return {
      mergeNodes: options.mergeNodes ?? true,
      showReads: options.showReads ?? true,
      coarsenedReadView: options.coarsenedReadView ?? false,
      layers: layersFrom(options, hasReads),
      ignoreStrand: options.ignoreStrand ?? false,
      nodeWidthOption: options.nodeWidthOption ?? "normal",
      charWidth: options.charWidth ?? DEFAULT_CHAR_WIDTH,
      trackWidth: options.trackWidth ?? 15,
      freqWidth: options.freqWidth ?? "log"
    };
  }
  function emptyTrackShapes() {
    return {
      rectangles: [],
      curves: [],
      corners: [],
      verticalRectangles: []
    };
  }
  function emptyState(config) {
    return {
      config,
      nodes: [],
      tracks: [],
      reads: [],
      nodeMap: /* @__PURE__ */ new Map(),
      nodesPerOrder: [],
      nodeOrders: [],
      assignments: [],
      extraLeft: [],
      extraRight: [],
      maxOrder: -1,
      shapes: emptyTrackShapes(),
      trackForRuler: void 0,
      coarsenedEdgeMeta: /* @__PURE__ */ new Map()
    };
  }
  var measurements = /* @__PURE__ */ new WeakMap();
  function layoutTopology(inputNodes, inputTracks, inputReads = [], options = {}) {
    const topology = arrangeTopology(inputNodes, inputTracks, inputReads, options);
    if (topology === void 0) {
      return void 0;
    }
    const everything = place(topology, topology.tracks, topology.reads, "measure");
    everything.nodes.forEach((node, i) => {
      if (node.order >= 0) {
        topology.nodes[i].x = node.x;
      }
    });
    measurements.set(topology, everything);
    return topology;
  }
  function placeTubeMap(topology, options = {}) {
    return placeSubset(topology, selectTracks(topology, options.facet), selectReads(topology, options));
  }
  function placeSubset(topology, tracks, reads, bandIdBase) {
    const measured = measurements.get(topology);
    return measured !== void 0 && tracks.length === topology.tracks.length && reads.length === topology.reads.length ? measured : place(topology, tracks, reads, "topology", bandIdBase);
  }
  function arrangeTopology(inputNodes, inputTracks, inputReads, options) {
    const state = emptyState(configFrom(options, inputReads.length > 0));
    if (inputNodes.length === 0 || inputTracks.length === 0) {
      return void 0;
    }
    structuredClone(inputNodes).forEach((node, i) => {
      node.seq ?? (node.seq = "");
      node.sequenceLength ?? (node.sequenceLength = node.seq.length);
      state.nodes[i + 1] = node;
    });
    state.tracks = structuredClone(inputTracks);
    state.reads = state.config.showReads ? structuredClone(inputReads.filter((read) => read.is_secondary !== true)) : [];
    for (let i = state.tracks.length - 1; i >= 0; i -= 1) {
      const t = state.tracks[i];
      t.type ?? (t.type = "haplotype");
      if (t.hidden === true) {
        state.tracks.splice(i, 1);
        continue;
      }
      if (t.indexOfFirstBase !== void 0) {
        state.trackForRuler = t.name;
      }
    }
    if (state.tracks.length === 0) {
      return void 0;
    }
    straightenTrack(state, 0);
    state.nodeMap = generateNodeMap(state);
    generateTrackIndexSequences(state, state.tracks);
    generateTrackIndexSequences(state, state.reads);
    generateNodeWidth(state);
    if (state.config.mergeNodes) {
      generateNodeSuccessors(state);
      generateNodeOrder(state);
      reverseReversedReads(state);
      mergeNodes(state);
      state.nodeMap = generateNodeMap(state);
      generateNodeWidth(state);
      generateTrackIndexSequences(state, state.tracks);
      generateTrackIndexSequences(state, state.reads);
    }
    generateNodeSuccessors(state);
    generateNodeDegree(state);
    generateNodeOrder(state);
    switchNodeOrientation(state);
    generateNodeOrder(state);
    reverseReversedReads(state);
    generateTrackIndexSequences(state, state.reads);
    return {
      options: state.config,
      nodes: state.nodes,
      tracks: state.tracks,
      reads: state.reads,
      nodeMap: state.nodeMap,
      maxOrder: getMaxOrder(state),
      trackForRuler: state.trackForRuler
    };
  }
  function selectReads(topology, { mappingQualityCutoff = 0, focusReadNames = null, facet }) {
    const focus = focusReadNames ? new Set(focusReadNames) : null;
    return topology.reads.filter((read) => (read.mapping_quality ?? 0) >= mappingQualityCutoff && (focus === null || read.name !== void 0 && focus.has(read.name)) && (facet === void 0 || facetHoldsRead(facet, read)));
  }
  function facetHoldsRead(facet, read) {
    return facet.by === "haplotype_sample" ? "reads" in facet : (read[facet.by] ?? null) === facet.key;
  }
  function references(topology) {
    return new Set(topology.tracks.filter((track, i) => i === 0 || track.name === topology.trackForRuler));
  }
  function selectTracks(topology, facet) {
    if (facet?.by !== "haplotype_sample") {
      return topology.tracks;
    }
    const kept = references(topology);
    return topology.tracks.filter((track) => kept.has(track) || !("reads" in facet) && sampleOf(track) === facet.key);
  }
  function sampleOf(track) {
    return parsePanSN(track.name)?.sample ?? null;
  }
  function haplotypeCount(topology, tracks) {
    const skip = references(topology);
    return new Set(tracks.flatMap((track) => {
      if (skip.has(track)) {
        return [];
      }
      const name = parsePanSN(track.name);
      return [name ? `${name.sample}#${name.haplotype}` : track];
    })).size;
  }
  function sortedGroups(items, keyOf) {
    return [...groupBy(items, keyOf)].sort(([a], [b]) => a === null || b === null ? Number(a === null) - Number(b === null) : a.localeCompare(b, void 0, { numeric: true }));
  }
  function facetReads(topology, by, options = {}) {
    return sortedGroups(selectReads(topology, { ...options, facet: void 0 }), (read) => read[by] ?? null).map(([key, reads]) => ({
      facet: { by, key },
      tracks: topology.tracks,
      reads
    }));
  }
  function facetHaplotypes(topology, options = {}) {
    const kept = references(topology);
    const samples = sortedGroups(topology.tracks.filter((track) => !kept.has(track)), sampleOf);
    if (samples.length === 0) {
      return [];
    }
    const ofSample = samples.map(([key]) => {
      const facet2 = { by: "haplotype_sample", key };
      return { facet: facet2, tracks: selectTracks(topology, facet2), reads: [] };
    });
    const facet = { by: "haplotype_sample", reads: true };
    const reads = selectReads(topology, { ...options, facet });
    return reads.length === 0 ? ofSample : [...ofSample, { facet, tracks: selectTracks(topology, facet), reads }];
  }
  var FACET_LABEL_HEIGHT = 30;
  var FACET_GAP = 40;
  function placeFacets(topology, options = {}) {
    const { facetBy, ...placement } = options;
    const subsets = facetBy === void 0 || facetBy === null ? [] : facetBy === "haplotype_sample" ? facetHaplotypes(topology, placement) : facetReads(topology, facetBy, placement);
    if (subsets.length === 0) {
      const layout = placeTubeMap(topology, placement);
      return {
        panels: [
          {
            layout,
            readCount: layout.reads.length,
            haplotypeCount: haplotypeCount(topology, topology.tracks),
            offsetY: 0
          }
        ],
        bounds: layout.bounds
      };
    }
    const banded = facetBy === "haplotype_sample" ? "haplotypes" : "reads";
    let nextBandId;
    let bottom = 0;
    const panels = subsets.map(({ facet, tracks, reads }, i) => {
      const layout = placeSubset(topology, tracks, reads, nextBandId === void 0 ? void 0 : { [banded]: nextBandId });
      for (const id of layout.coarsenedEdgeMeta.keys()) {
        if (nextBandId === void 0 || id >= nextBandId) {
          nextBandId = id + 1;
        }
      }
      const offsetY = i === 0 ? 0 : bottom + FACET_GAP + FACET_LABEL_HEIGHT - layout.bounds.minY;
      bottom = offsetY + layout.bounds.maxY;
      return {
        facet,
        readCount: reads.length,
        haplotypeCount: haplotypeCount(topology, tracks),
        layout,
        offsetY
      };
    });
    return {
      panels,
      bounds: {
        minX: Math.min(...panels.map((p) => p.layout.bounds.minX)),
        maxX: Math.max(...panels.map((p) => p.layout.bounds.maxX)),
        minY: panels[0].layout.bounds.minY - FACET_LABEL_HEIGHT,
        maxY: bottom
      }
    };
  }
  function place(topology, tracks, reads, x, bandIdBase = {}) {
    const state = emptyState(topology.options);
    topology.nodes.forEach((node, i) => {
      state.nodes[i] = { ...node };
    });
    state.tracks = tracks.map((track) => ({ ...track }));
    state.reads = reads.map((read) => ({ ...read }));
    state.nodeMap = topology.nodeMap;
    state.maxOrder = topology.maxOrder;
    state.trackForRuler = topology.trackForRuler;
    const { layers, ignoreStrand } = state.config;
    const haplotypeBandIdBase = bandIdBase.haplotypes ?? COARSENED_ID_BASE;
    const haplotypeBands = statOf(layers, "haplotypes") === "coarsen" ? bandHaplotypes(state, haplotypeBandIdBase) : void 0;
    if (haplotypeBands !== void 0) {
      state.tracks = [haplotypeBands.ref];
    }
    calculateTrackWidth(state);
    generateLaneAssignment(state);
    generateReadOnlyNodeAttributes(state);
    const readBands = statOf(layers, "reads") === "coarsen" && state.reads.length > 0 ? buildCoarsenedSyntheticBands(state, state.reads, "read", bandIdBase.reads ?? haplotypeBandIdBase + (haplotypeBands?.bands.length ?? 0)) : void 0;
    if (readBands !== void 0) {
      state.reads = readBands.bands;
    }
    const coarsened = {};
    for (const [data, unit, banding] of [
      ["haplotypes", "haplotype", haplotypeBands],
      ["reads", "read", readBands]
    ]) {
      if (banding !== void 0) {
        reverseReversedReads(state, banding.bands);
        generateTrackIndexSequences(state, banding.bands);
        coarsened[data] = {
          unit,
          total: banding.total,
          reverse: !ignoreStrand && banding.bands.some((b) => b.is_reverse)
        };
      }
    }
    if (haplotypeBands !== void 0) {
      state.reads = haplotypeBands.bands.concat(state.reads);
    }
    placeReads(state);
    state.tracks = state.tracks.concat(state.reads);
    if (x === "measure") {
      generateNodeXCoords(state);
    }
    generateSVGShapesFromPath(state);
    return {
      nodes: state.nodes,
      tracks: state.tracks,
      reads: state.reads,
      nodeMap: state.nodeMap,
      shapes: state.shapes,
      bounds: getImageDimensions(state),
      maxOrder: state.maxOrder,
      trackForRuler: state.trackForRuler,
      coarsenedEdgeMeta: state.coarsenedEdgeMeta,
      coarsened
    };
  }
  function isReverse(nodeName) {
    return nodeName.startsWith("-");
  }
  function forward(nodeName) {
    return isReverse(nodeName) ? nodeName.substring(1) : nodeName;
  }
  function reverse(nodeName) {
    return isReverse(nodeName) ? nodeName : `-${nodeName}`;
  }
  function flip(nodeName) {
    return isReverse(nodeName) ? forward(nodeName) : reverse(nodeName);
  }
  function isForwardIndex(n) {
    return n > 0;
  }
  function straightenTrack(state, index) {
    const nodesToInvert = /* @__PURE__ */ new Set();
    const visitedForward = /* @__PURE__ */ new Set();
    for (const visit of state.tracks[index].sequence) {
      if (!isReverse(visit)) {
        visitedForward.add(visit);
      } else if (!visitedForward.has(forward(visit))) {
        nodesToInvert.add(forward(visit));
      }
    }
    if (nodesToInvert.size === 0) {
      return;
    }
    for (const { sequence } of [...state.tracks, ...state.reads]) {
      for (let j = 0; j < sequence.length; j += 1) {
        if (nodesToInvert.has(forward(sequence[j]))) {
          sequence[j] = flip(sequence[j]);
        }
      }
    }
    state.nodes.forEach((node) => {
      if (nodesToInvert.has(node.name)) {
        node.seq = getReverseComplement(node.seq);
      }
    });
  }
  function generateReadOnlyNodeAttributes(state) {
    state.nodesPerOrder = Array.from({ length: state.maxOrder + 1 }, () => []);
    const orderY = /* @__PURE__ */ new Map();
    state.nodes.forEach((node) => {
      if (node.y !== void 0) {
        setMapToMax(orderY, node.order, node.y + node.contentHeight);
      }
    });
    state.tracks.forEach((track) => {
      if (track.type === "haplotype") {
        track.path.forEach((step) => {
          setMapToMax(orderY, step.order, (step.y ?? 0) + track.width);
        });
      }
    });
    state.nodes.forEach((node, i) => {
      if (node.order >= 0 && node.y === void 0) {
        node.y = (orderY.get(node.order) ?? 0) + 25;
        node.contentHeight = 0;
        state.nodesPerOrder[node.order].push(i);
      }
    });
  }
  function setMapToMax(map, key, value) {
    const existing = map.get(key);
    if (existing === void 0) {
      map.set(key, value);
    } else {
      map.set(key, Math.max(existing, value));
    }
  }
  var READ_WIDTH = 7;
  function assignReadsToNodes(state) {
    state.nodes.forEach((node) => {
      node.incomingReads = [];
      node.outgoingReads = [];
      node.internalReads = [];
    });
    state.reads.forEach((read, idx) => {
      if (read.width === void 0 || read.width === 0) {
        read.width = READ_WIDTH;
      }
      read.path.forEach((segment, pathIdx) => {
        if (segment.node === null) {
          return;
        }
        const node = state.nodes[segment.node];
        if (read.path.length === 1) {
          node.internalReads.push(idx);
        } else if (pathIdx === 0) {
          node.outgoingReads.push([idx, pathIdx]);
        } else {
          node.incomingReads.push([idx, pathIdx]);
        }
      });
    });
  }
  function placeReads(state) {
    state.reads.forEach((read) => {
      read.path = basicPath(state, read);
    });
    assignReadsToNodes(state);
    const sortedNodes = state.nodes.filter((node) => node.order >= 0);
    sortedNodes.sort(compareNodesByOrder);
    const sets = /* @__PURE__ */ new Map();
    for (let i = 0; i < state.reads.length; i++) {
      const read = state.reads[i];
      const layer = read.haplotypeShare === void 0 ? 1 : 0;
      const source = read.sourceTrackID;
      const key = `${layer}:${source}`;
      const set = sets.get(key);
      if (set === void 0) {
        sets.set(key, { layer, source, reads: /* @__PURE__ */ new Set([i]) });
      } else {
        set.reads.add(i);
      }
    }
    const orderedSets = [...sets.values()].sort((a, b) => a.layer - b.layer || a.source - b.source);
    const topMargin = orderedSets.length > 1 ? READ_WIDTH : 0;
    sortedNodes.forEach((node) => {
      for (const { reads } of orderedSets) {
        placeReadSet(state, reads, node, topMargin);
      }
    });
    const bottomY = calculateBottomY(state);
    const elementsWithoutNode = [];
    state.reads.forEach((read, idx) => {
      const prevSegment = [];
      const nextSegment = [];
      let visit;
      read.path.forEach((seg, i) => {
        prevSegment[i] = visit;
        if (seg.node !== null) {
          visit = seg;
        }
      });
      visit = void 0;
      for (let i = read.path.length - 1; i >= 0; i -= 1) {
        nextSegment[i] = visit;
        if (read.path[i].node !== null) {
          visit = read.path[i];
        }
      }
      read.path.forEach((element, pathIdx) => {
        if (element.y === void 0) {
          const previousVisitToNode = prevSegment[pathIdx];
          const nextVisitToNode = nextSegment[pathIdx];
          const betweenCycleReverseTraversal = Boolean(
            // A segment can be between a cycle if it there are nodes on both sides
            nextVisitToNode && previousVisitToNode && // A segment is between a cycle if the next node it visits is behind the previous node it visited
            (previousVisitToNode.order > nextVisitToNode.order || // A segment can also be between a cycle if it's visiting the same node it just visited in the same direction
            nextVisitToNode.order === previousVisitToNode.order && nextVisitToNode.isForward === previousVisitToNode.isForward)
          );
          element.betweenCycleReverseTraversal = betweenCycleReverseTraversal;
          elementsWithoutNode.push({
            readIndex: idx,
            pathIndex: pathIdx,
            previousY: previousVisitToNode?.y,
            previousNode: previousVisitToNode?.node
          });
        }
      });
    });
    elementsWithoutNode.sort((a, b) => compareNoNodeReads(state, a, b));
    elementsWithoutNode.forEach((element) => {
      const read = state.reads[element.readIndex];
      const segment = read.path[element.pathIndex];
      segment.y = bottomY[segment.order];
      bottomY[segment.order] += read.width;
    });
  }
  function placeReadSet(state, toPlace, node, topMargin) {
    let incomingReads = node.incomingReads.filter(([readID]) => toPlace.has(readID));
    const outgoingReads = node.outgoingReads.filter(([readID]) => toPlace.has(readID));
    const internalReads = node.internalReads.filter((readID) => toPlace.has(readID));
    if (incomingReads.length === 0 && outgoingReads.length === 0 && internalReads.length === 0) {
      topMargin = 0;
    }
    const startY = node.y + node.contentHeight + topMargin * 2;
    const incomingKeys = incomingReads.map((entry) => {
      const [readID, pathIdx] = entry;
      const path = state.reads[readID].path;
      let decisionStep = pathIdx + 1;
      let foundY;
      for (let k = 1; k <= pathIdx; k++) {
        const y = path[pathIdx - k]?.y;
        if (y !== void 0) {
          decisionStep = k;
          foundY = y;
          break;
        }
      }
      return { entry, decisionStep, y: foundY };
    });
    incomingKeys.sort(compareIncomingReadKeys);
    incomingReads = incomingKeys.map((k) => k.entry);
    let currentY = startY;
    const occupiedUntil = /* @__PURE__ */ new Map();
    incomingReads.forEach((readElement) => {
      const read = state.reads[readElement[0]];
      read.path[readElement[1]].y = currentY;
      setOccupiedUntil(occupiedUntil, read, readElement[1], currentY, node);
      currentY += read.width;
    });
    let maxY = currentY;
    outgoingReads.sort((a, b) => compareReadOutgoingSegmentsByGoingTo(state, a, b));
    const occupiedFrom = /* @__PURE__ */ new Map();
    currentY = startY;
    outgoingReads.forEach((readElement) => {
      const read = state.reads[readElement[0]];
      const firstNodeOffset = read.firstNodeOffset ?? 0;
      read.path[readElement[1]].y = currentY;
      occupiedFrom.set(currentY, firstNodeOffset);
      const occUntil = occupiedUntil.get(currentY);
      if (occUntil === void 0 || occUntil + 1 <= firstNodeOffset) {
        currentY += read.width;
        maxY = Math.max(maxY, currentY);
      } else {
        occupiedUntil.set(currentY, 0);
        incomingReads.forEach((incReadElementIndices) => {
          const incRead = state.reads[incReadElementIndices[0]];
          const incReadPathElement = incRead.path[incReadElementIndices[1]];
          if (incReadPathElement.y !== void 0 && incReadPathElement.y >= currentY) {
            incReadPathElement.y += read.width;
            setOccupiedUntil(occupiedUntil, incRead, incReadElementIndices[1], incReadPathElement.y, node);
          }
        });
        currentY += read.width;
        maxY += read.width;
      }
    });
    internalReads.sort((a, b) => compareInternalReads(state, a, b));
    internalReads.forEach((readIdx) => {
      const currentRead = state.reads[readIdx];
      const firstNodeOffset = currentRead.firstNodeOffset ?? 0;
      const finalNodeCoverLength = currentRead.finalNodeCoverLength ?? 0;
      currentY = startY;
      while (firstNodeOffset < (occupiedUntil.get(currentY) ?? -Infinity) + 2 || finalNodeCoverLength > (occupiedFrom.get(currentY) ?? Infinity) - 3) {
        currentY += currentRead.width;
      }
      currentRead.path[0].y = currentY;
      occupiedUntil.set(currentY, finalNodeCoverLength);
      maxY = Math.max(maxY, currentY);
    });
    const heightIncrease = maxY - node.y - node.contentHeight;
    node.contentHeight += heightIncrease;
    adjustVertically3(state, node, heightIncrease);
  }
  function compareIncomingReadKeys(a, b) {
    if (a.decisionStep !== b.decisionStep) {
      return a.decisionStep - b.decisionStep;
    }
    if (a.y === void 0 || b.y === void 0) {
      return (a.y === void 0 ? 0 : 1) - (b.y === void 0 ? 0 : 1);
    }
    return a.y - b.y;
  }
  function setOccupiedUntil(map, read, pathIndex, y, node) {
    map.set(y, pathIndex === read.path.length - 1 ? read.finalNodeCoverLength ?? 0 : node.sequenceLength);
  }
  function compareNoNodeReads(state, a, b) {
    const readA = state.reads[a.readIndex];
    const readB = state.reads[b.readIndex];
    const segmentA = readA.path[a.pathIndex];
    const segmentB = readB.path[b.pathIndex];
    if (segmentA.order !== segmentB.order) {
      return segmentA.order - segmentB.order;
    }
    if (readA.sourceTrackID !== readB.sourceTrackID) {
      return readA.sourceTrackID - readB.sourceTrackID;
    }
    if (a.previousNode && b.previousNode) {
      const prevNodeA = state.nodes[a.previousNode];
      const prevNodeB = state.nodes[b.previousNode];
      if (prevNodeA && prevNodeB && prevNodeA.order !== prevNodeB.order) {
        return prevNodeA.order - prevNodeB.order;
      }
    }
    const aPrev = a.previousY ?? 0;
    const bPrev = b.previousY ?? 0;
    const aReverse = segmentA.betweenCycleReverseTraversal === true;
    const bReverse = segmentB.betweenCycleReverseTraversal === true;
    if (aReverse !== bReverse) {
      return aReverse ? 1 : -1;
    }
    return aReverse ? bPrev - aPrev : aPrev - bPrev;
  }
  function compareReadOutgoingSegmentsByGoingTo(state, [readIndexA, pathIndexA], [readIndexB, pathIndexB]) {
    const readA = state.reads[readIndexA];
    const readB = state.reads[readIndexB];
    const lastYA = readA.path.findLast((seg) => seg.y !== void 0)?.y;
    const lastYB = readB.path.findLast((seg) => seg.y !== void 0)?.y;
    if (lastYA !== void 0 && lastYB !== void 0) {
      return lastYA - lastYB;
    }
    const nodeAt = (read, i) => {
      const node = read.path[i]?.node;
      return node === null || node === void 0 ? null : state.nodes[node] ?? null;
    };
    const nextVisit = (read, i) => {
      let next = i + 1;
      while (read.path[next]?.node === null) {
        next += 1;
      }
      return next;
    };
    let nodeA = nodeAt(readA, pathIndexA);
    let nodeB = nodeAt(readB, pathIndexB);
    while (nodeA !== null && nodeA === nodeB) {
      pathIndexA = nextVisit(readA, pathIndexA);
      pathIndexB = nextVisit(readB, pathIndexB);
      nodeA = nodeAt(readA, pathIndexA);
      nodeB = nodeAt(readB, pathIndexB);
    }
    if (nodeA !== null && nodeB !== null) {
      return compareNodesByOrder(nodeA, nodeB);
    }
    if (nodeA !== null || nodeB !== null) {
      return nodeA === null ? -1 : 1;
    }
    return (readA.firstNodeOffset ?? 0) - (readB.firstNodeOffset ?? 0) || (readA.finalNodeCoverLength ?? 0) - (readB.finalNodeCoverLength ?? 0);
  }
  function compareTrackByInitialOrdering(trackA, trackB) {
    const pathA = trackA.path;
    const pathB = trackB.path;
    let AIndex = 0;
    let BIndex = 0;
    while (AIndex < pathA.length && BIndex < pathB.length) {
      const a = pathA[AIndex];
      const b = pathB[BIndex];
      const trackAOrder = a.order;
      const trackBOrder = b.order;
      if (trackAOrder === trackBOrder && a.node && b.node) {
        return (b.y ?? 0) - (a.y ?? 0);
      } else if (trackAOrder < trackBOrder) {
        AIndex += 1;
      } else if (trackAOrder > trackBOrder) {
        BIndex += 1;
      } else {
        AIndex += 1;
        BIndex += 1;
      }
    }
    return 0;
  }
  function compareInternalReads(state, idxA, idxB) {
    const a = state.reads[idxA];
    const b = state.reads[idxB];
    return (a.firstNodeOffset ?? 0) - (b.firstNodeOffset ?? 0) || (a.finalNodeCoverLength ?? 0) - (b.finalNodeCoverLength ?? 0);
  }
  function calculateBottomY(state) {
    const bottomY = new Array(state.maxOrder + 1).fill(0);
    state.nodes.forEach((node) => {
      if (node.y !== void 0) {
        bottomY[node.order] = Math.max(bottomY[node.order], node.y + node.contentHeight + 20);
      }
    });
    state.tracks.forEach((track) => {
      track.path.forEach((element) => {
        bottomY[element.order] = Math.max(bottomY[element.order], (element.y ?? 0) + track.width);
      });
    });
    return bottomY;
  }
  function basicPath(state, track) {
    const path = [];
    const pass = (order, isForward) => {
      path.push({ order, isForward, node: null });
    };
    const visit = (order, isForward, node) => {
      path.push({ order, isForward, node });
    };
    let currentNodeIndex = Math.abs(track.indexSequence[0]);
    let currentNodeIsForward = isForwardIndex(track.indexSequence[0]);
    let currentNode = state.nodes[currentNodeIndex];
    visit(currentNode.order, currentNodeIsForward, currentNodeIndex);
    for (let i = 1; i < track.sequence.length; i += 1) {
      const previousNode = currentNode;
      const previousNodeIsForward = currentNodeIsForward;
      currentNodeIndex = Math.abs(track.indexSequence[i]);
      currentNodeIsForward = isForwardIndex(track.indexSequence[i]);
      currentNode = state.nodes[currentNodeIndex];
      const { order } = currentNode;
      if (order > previousNode.order) {
        if (!previousNodeIsForward) {
          pass(previousNode.order, true);
        }
        for (let j = previousNode.order + 1; j < order; j += 1) {
          pass(j, true);
        }
        if (!currentNodeIsForward) {
          pass(order, true);
        }
      } else if (order < previousNode.order) {
        if (previousNodeIsForward) {
          pass(previousNode.order, false);
        }
        for (let j = previousNode.order - 1; j > order; j -= 1) {
          pass(j, false);
        }
        if (currentNodeIsForward) {
          pass(order, false);
        }
      } else if (currentNodeIsForward === previousNodeIsForward) {
        pass(order, !currentNodeIsForward);
      }
      visit(order, currentNodeIsForward, currentNodeIndex);
    }
    return path;
  }
  function reverseReversedReads(state, reads = state.reads) {
    reads.forEach((read) => {
      if (!read.sequence.every(isReverse)) {
        return;
      }
      read.is_reverse = read.is_reverse !== true;
      read.sequence = read.sequence.toReversed().map(forward);
      if (read.sequenceNew !== void 0) {
        read.sequenceNew = read.sequenceNew.toReversed();
      }
      for (const entry of read.sequenceNew ?? []) {
        entry.nodeName = forward(entry.nodeName);
        const { sequenceLength } = nodeByName(state, entry.nodeName);
        entry.mismatches = entry.mismatches.map((mm) => mirroredMismatch(mm, sequenceLength));
      }
      const firstOffset = read.firstNodeOffset ?? 0;
      const firstLen = nodeByName(state, read.sequence[0]).sequenceLength;
      const lastLen = nodeByName(state, read.sequence.at(-1)).sequenceLength;
      read.firstNodeOffset = firstLen - (read.finalNodeCoverLength ?? 0);
      read.finalNodeCoverLength = lastLen - firstOffset;
    });
  }
  function mirroredMismatch(mm, sequenceLength) {
    const span = mm.type === "insertion" ? 0 : mm.type === "deletion" ? mm.length ?? 0 : mm.seq?.length ?? 0;
    return {
      ...mm,
      pos: sequenceLength - mm.pos - span,
      ...mm.seq !== void 0 && { seq: getReverseComplement(mm.seq) }
    };
  }
  var COMPLEMENT = { A: "T", T: "A", C: "G", G: "C" };
  function getReverseComplement(s) {
    let result = "";
    for (let i = s.length - 1; i >= 0; i -= 1) {
      result += COMPLEMENT[s.charAt(i)] ?? "N";
    }
    return result;
  }
  function generateTrackIndexSequences(state, tracksOrReads) {
    const signedIndexOf = /* @__PURE__ */ new Map();
    tracksOrReads.forEach((track) => {
      track.indexSequence = track.sequence.map((nodeName) => {
        let signed = signedIndexOf.get(nodeName);
        if (signed === void 0) {
          const index = state.nodeMap.get(forward(nodeName));
          if (index === void 0) {
            throw new Error(`Track ${track.name ?? track.id} visits unknown node ${nodeName}`);
          }
          signed = isReverse(nodeName) ? -index : index;
          signedIndexOf.set(nodeName, signed);
        }
        return signed;
      });
    });
  }
  var NODE_HORIZONTAL_SLACK = 20;
  function getImageDimensions(state) {
    const bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity
    };
    const { rectangles, verticalRectangles, curves } = state.shapes;
    for (const shapes of [rectangles, verticalRectangles, curves]) {
      for (const { xStart, xEnd } of shapes) {
        bounds.minX = Math.min(bounds.minX, xStart, xEnd);
        bounds.maxX = Math.max(bounds.maxX, xStart, xEnd);
      }
    }
    state.nodes.forEach((node) => {
      if (node.x !== void 0) {
        bounds.minX = Math.min(bounds.minX, node.x - 9);
        bounds.maxX = Math.max(bounds.maxX, node.x + NODE_HORIZONTAL_SLACK + node.pixelWidth);
      }
      if (node.y !== void 0) {
        bounds.minY = Math.min(bounds.minY, node.y - 10);
        bounds.maxY = Math.max(bounds.maxY, node.y + node.contentHeight + 10);
      }
    });
    state.tracks.forEach((track) => {
      track.path.forEach((segment) => {
        const y = segment.y ?? 0;
        bounds.maxY = Math.max(bounds.maxY, y + track.width);
        bounds.minY = Math.min(bounds.minY, y);
      });
    });
    return bounds;
  }
  function nodeByName(state, nodeName) {
    const index = state.nodeMap.get(forward(nodeName));
    const node = index === void 0 ? void 0 : state.nodes[index];
    if (node === void 0) {
      throw new Error(`Unknown node ${nodeName}`);
    }
    return node;
  }
  function generateNodeMap(state) {
    const nodeMap = /* @__PURE__ */ new Map();
    state.nodes.forEach((node, index) => {
      nodeMap.set(node.name, index);
    });
    return nodeMap;
  }
  function generateNodeSuccessors(state) {
    const successorSets = state.nodes.map(() => /* @__PURE__ */ new Set());
    const predecessorSets = state.nodes.map(() => /* @__PURE__ */ new Set());
    const addEdges = (track) => {
      for (let i = 0; i < track.indexSequence.length - 1; i += 1) {
        const current = Math.abs(track.indexSequence[i]);
        const follower = Math.abs(track.indexSequence[i + 1]);
        successorSets[current].add(follower);
        predecessorSets[follower].add(current);
      }
    };
    state.tracks.forEach(addEdges);
    state.reads.forEach(addEdges);
    state.nodes.forEach((node, i) => {
      node.successors = Array.from(successorSets[i]);
      node.predecessors = Array.from(predecessorSets[i]);
    });
  }
  function generateNodeOrderOfSingleTrack(state, sequence) {
    let forwardOrder = 0;
    let backwardOrder = 0;
    let minOrder = 0;
    sequence.forEach((nodeIndex) => {
      var _a, _b;
      const idx = Math.abs(nodeIndex);
      if (nodeIndex < 0) {
        const order = (_a = state.nodeOrders)[idx] ?? (_a[idx] = backwardOrder);
        if (order < minOrder) {
          minOrder = order;
        }
        forwardOrder = order;
        backwardOrder = order - 1;
      } else {
        const order = (_b = state.nodeOrders)[idx] ?? (_b[idx] = forwardOrder);
        forwardOrder = order + 1;
        backwardOrder = order;
      }
    });
    if (minOrder < 0) {
      increaseOrderForAllNodes(state, -minOrder);
    }
  }
  function generateNodeOrderTrackBeginning(state, sequence) {
    let anchorIndex = 0;
    let minOrder = 0;
    while (anchorIndex < sequence.length && state.nodeOrders[Math.abs(sequence[anchorIndex])] === void 0) {
      anchorIndex += 1;
    }
    if (anchorIndex >= sequence.length) {
      return null;
    }
    const anchorSeqVal = sequence[anchorIndex];
    let currentOrder;
    let increment;
    if (anchorSeqVal >= 0) {
      currentOrder = state.nodeOrders[anchorSeqVal] - 1;
      increment = -1;
    } else {
      currentOrder = state.nodeOrders[-anchorSeqVal] + 1;
      increment = 1;
    }
    for (let j = anchorIndex - 1; j >= 0; j -= 1) {
      const idx = Math.abs(sequence[j]);
      if (state.nodeOrders[idx] === void 0) {
        state.nodeOrders[idx] = currentOrder;
        minOrder = Math.min(minOrder, currentOrder);
        currentOrder += increment;
      }
    }
    if (minOrder < 0) {
      increaseOrderForAllNodes(state, -minOrder);
    }
    return anchorIndex;
  }
  var UNREACHABLE_ORDER = -1;
  function fillUnassignedOrders(orders) {
    return Array.from(orders, (order) => order ?? UNREACHABLE_ORDER);
  }
  function compactOrders(orders) {
    const used = [...new Set(orders.filter((order) => order >= 0))].sort((a, b) => a - b);
    const rank = new Map(used.map((order, i) => [order, i]));
    return orders.map((order) => rank.get(order) ?? order);
  }
  function generateNodeOrder(state) {
    let modifiedSequence;
    let currentOrder;
    let rightIndex;
    let leftIndex;
    let minOrder = 0;
    const tracksAndReads = state.tracks.concat(state.reads);
    const reachability = {
      stamp: new Int32Array(state.nodes.length),
      generation: 0
    };
    state.nodeOrders = new Array(state.nodes.length).fill(void 0);
    state.nodes.forEach((node) => {
      node.order = void 0;
    });
    generateNodeOrderOfSingleTrack(state, state.tracks[0].indexSequence);
    for (let i = 1; i < tracksAndReads.length; i += 1) {
      rightIndex = generateNodeOrderTrackBeginning(state, tracksAndReads[i].indexSequence);
      if (rightIndex === null) {
        if (i < state.tracks.length) {
          generateNodeOrderOfSingleTrack(state, tracksAndReads[i].indexSequence);
        } else {
          tracksAndReads.splice(i, 1);
          state.reads.splice(i - state.tracks.length, 1);
          i -= 1;
        }
        continue;
      }
      modifiedSequence = uninvert(tracksAndReads[i].indexSequence);
      while (rightIndex < modifiedSequence.length) {
        leftIndex = rightIndex;
        rightIndex += 1;
        while (rightIndex < modifiedSequence.length && state.nodeOrders[modifiedSequence[rightIndex]] === void 0) {
          rightIndex += 1;
        }
        if (rightIndex < modifiedSequence.length) {
          currentOrder = state.nodeOrders[modifiedSequence[leftIndex]] + 1;
          for (let j = leftIndex + 1; j < rightIndex; j += 1) {
            state.nodeOrders[modifiedSequence[j]] = currentOrder;
            currentOrder += 1;
          }
          if (state.nodeOrders[modifiedSequence[rightIndex]] > state.nodeOrders[modifiedSequence[leftIndex]]) {
            if (state.nodeOrders[modifiedSequence[rightIndex]] < currentOrder) {
              increaseOrderForSuccessors(state, modifiedSequence[rightIndex], modifiedSequence[rightIndex - 1], currentOrder);
            }
          } else {
            if (tracksAndReads[i].indexSequence[rightIndex] >= 0 && !isSuccessor(state, modifiedSequence[rightIndex], modifiedSequence[leftIndex], reachability)) {
              increaseOrderForSuccessors(state, modifiedSequence[rightIndex], modifiedSequence[rightIndex - 1], currentOrder);
            } else {
              if (tracksAndReads[i].indexSequence[leftIndex] < 0 || state.nodes[modifiedSequence[leftIndex + 1]].degree < 2 && state.nodeOrders[modifiedSequence[rightIndex]] < state.nodeOrders[modifiedSequence[leftIndex]]) {
                currentOrder = state.nodeOrders[modifiedSequence[leftIndex]] - 1;
                for (let j = leftIndex + 1; j < rightIndex; j += 1) {
                  state.nodeOrders[modifiedSequence[j]] = currentOrder;
                  minOrder = Math.min(minOrder, currentOrder);
                  currentOrder -= 1;
                }
              }
            }
          }
        } else {
          if (tracksAndReads[i].indexSequence[leftIndex] >= 0) {
            currentOrder = state.nodeOrders[modifiedSequence[leftIndex]] + 1;
            for (let j = leftIndex + 1; j < modifiedSequence.length; j += 1) {
              const idx = modifiedSequence[j];
              if (state.nodeOrders[idx] === void 0) {
                state.nodeOrders[idx] = currentOrder;
                currentOrder += 1;
              }
            }
          } else {
            currentOrder = state.nodeOrders[modifiedSequence[leftIndex]] - 1;
            for (let j = leftIndex + 1; j < modifiedSequence.length; j += 1) {
              const idx = modifiedSequence[j];
              if (state.nodeOrders[idx] === void 0) {
                state.nodeOrders[idx] = currentOrder;
                minOrder = Math.min(minOrder, currentOrder);
                currentOrder -= 1;
              }
            }
          }
        }
      }
    }
    if (minOrder < 0) {
      increaseOrderForAllNodes(state, -minOrder);
    }
    state.nodeOrders = compactOrders(fillUnassignedOrders(state.nodeOrders));
    state.nodes.forEach((node, i) => {
      node.order = state.nodeOrders[i];
    });
  }
  function isSuccessor(state, first, second, scratch) {
    scratch.generation += 1;
    const { stamp, generation } = scratch;
    const stack = [first];
    stamp[first] = generation;
    while (stack.length > 0) {
      const current = stack.pop();
      if (current === second) {
        return true;
      }
      for (const childIndex of state.nodes[current].successors) {
        if (stamp[childIndex] !== generation) {
          stamp[childIndex] = generation;
          stack.push(childIndex);
        }
      }
    }
    return false;
  }
  function getMaxOrder(state) {
    let max = -1;
    state.nodeOrders.forEach((order) => {
      if (order !== void 0 && order > max) {
        max = order;
      }
    });
    return max;
  }
  function uninvert(sequence) {
    return sequence.map((v) => Math.abs(v));
  }
  function increaseOrderForAllNodes(state, amount) {
    state.nodeOrders.forEach((order, i) => {
      if (order !== void 0) {
        state.nodeOrders[i] = order + amount;
      }
    });
  }
  function increaseOrderForSuccessors(state, startingNode, tabuNode, newOrder) {
    const increasedOrders = /* @__PURE__ */ new Map();
    const queue = [[startingNode, newOrder]];
    let head = 0;
    while (head < queue.length) {
      const [currentNode, currentOrder] = queue[head];
      head += 1;
      const currentNodeOrder = state.nodeOrders[currentNode];
      if (currentNodeOrder !== void 0 && currentNodeOrder < currentOrder) {
        if ((increasedOrders.get(currentNode) ?? -Infinity) < currentOrder) {
          increasedOrders.set(currentNode, currentOrder);
          state.nodes[currentNode].successors.forEach((successor) => {
            if (state.nodeOrders[successor] > currentNodeOrder && successor !== tabuNode) {
              queue.push([successor, currentOrder + 1]);
            }
          });
          if (currentNode !== startingNode) {
            state.nodes[currentNode].predecessors.forEach((predecessor) => {
              if (state.nodeOrders[predecessor] > currentNodeOrder && predecessor !== tabuNode) {
                queue.push([predecessor, currentOrder + 1]);
              }
            });
          }
        }
      }
    }
    increasedOrders.forEach((value, key) => {
      state.nodeOrders[key] = value;
    });
  }
  function generateNodeDegree(state) {
    state.nodes.forEach((node) => {
      node.tracks = [];
    });
    state.tracks.forEach((track) => {
      track.indexSequence.forEach((nodeIndex) => {
        state.nodes[Math.abs(nodeIndex)].tracks.push(track.id);
      });
    });
    state.nodes.forEach((node) => {
      node.degree = node.tracks.length;
    });
  }
  function switchNodeOrientation(state) {
    switchNodeOrientationForPaths(state, [...state.tracks.slice(1), ...state.reads], state.tracks[0]);
  }
  function switchNodeOrientationForPaths(state, paths, pivotPath) {
    const scores = new Int32Array(state.nodes.length);
    const onPivot = new Uint8Array(state.nodes.length);
    for (const nodeName of pivotPath.sequence) {
      const index = isReverse(nodeName) ? void 0 : state.nodeMap.get(nodeName);
      if (index !== void 0) {
        onPivot[index] = 1;
      }
    }
    for (const path of paths) {
      const { sequence, indexSequence } = path;
      const last = indexSequence.length - 1;
      for (let j = 0; j <= last; j += 1) {
        const index = Math.abs(indexSequence[j]);
        if (onPivot[index] === 1) {
          continue;
        }
        const order = state.nodes[index].order;
        const prevOrder = j > 0 ? state.nodes[Math.abs(indexSequence[j - 1])].order : void 0;
        const nextOrder = j < last ? state.nodes[Math.abs(indexSequence[j + 1])].order : void 0;
        const vote = isReverse(sequence[j]) ? 1 : -1;
        if ((prevOrder === void 0 || prevOrder < order) && (nextOrder === void 0 || order < nextOrder)) {
          scores[index] += vote;
        }
        if ((prevOrder === void 0 || prevOrder > order) && (nextOrder === void 0 || order > nextOrder)) {
          scores[index] -= vote;
        }
      }
    }
    for (const path of paths) {
      const { sequence, indexSequence } = path;
      for (let j = 0; j < indexSequence.length; j += 1) {
        if (scores[Math.abs(indexSequence[j])] > 0) {
          sequence[j] = flip(sequence[j]);
          indexSequence[j] = -indexSequence[j];
        }
      }
    }
    state.nodes.forEach((node, index) => {
      if (scores[index] > 0) {
        node.seq = getReverseComplement(node.seq);
        node.switched = true;
      }
    });
  }
  function generateNodeXCoords(state) {
    let currentX = 0;
    let nextX = 20;
    let currentOrder = -1;
    const sortedNodes = state.nodes.slice();
    sortedNodes.sort(compareNodesByOrder);
    const extra = calculateExtraSpace(state);
    sortedNodes.forEach((node) => {
      if (node.order >= 0) {
        if (node.order > currentOrder) {
          currentOrder = node.order;
          currentX = nextX + 10 * extra[node.order];
        }
        node.x = currentX;
        nextX = Math.max(nextX, currentX + 40 + node.pixelWidth);
      }
    });
  }
  var RISE_KNEE = 35;
  function riseExtra(rise) {
    return rise <= RISE_KNEE ? rise / 17.5 : RISE_KNEE / 17.5 * Math.sqrt(rise / RISE_KNEE);
  }
  function calculateExtraSpace(state) {
    const slots = state.maxOrder + 1;
    const leftSideEdges = new Array(slots).fill(0);
    const rightSideEdges = new Array(slots).fill(0);
    const fallAngleAdjustment = new Array(slots).fill(0);
    const extra = [];
    state.tracks.forEach((track) => {
      for (let i = 1; i < track.path.length; i += 1) {
        const seg = track.path[i];
        const prevSeg = track.path[i - 1];
        if (seg.order === prevSeg.order) {
          if (seg.isForward) {
            leftSideEdges[seg.order] += 1;
          } else {
            rightSideEdges[seg.order] += 1;
          }
        } else {
          fallAngleAdjustment[seg.order] = Math.max(riseExtra(Math.abs((seg.y ?? 0) - (prevSeg.y ?? 0))), fallAngleAdjustment[seg.order]);
        }
      }
    });
    extra.push(Math.max(0, leftSideEdges[0] - 1));
    for (let i = 1; i <= state.maxOrder; i += 1) {
      extra.push(Math.max(Math.max(0, leftSideEdges[i] - 1) + Math.max(0, rightSideEdges[i - 1] - 1), fallAngleAdjustment[i]));
    }
    return extra;
  }
  function generateLaneAssignment(state) {
    state.assignments = Array.from({ length: state.maxOrder + 1 }, () => []);
    const byNode = /* @__PURE__ */ new Map();
    state.tracks.forEach((track, trackID) => {
      track.path = basicPath(state, track);
      track.path.forEach(({ order, node }, segmentID) => {
        const segment = { trackID, segmentID };
        const existing = node === null ? void 0 : byNode.get(node);
        if (existing === void 0) {
          const assignment = { node, tracks: [segment] };
          state.assignments[order].push(assignment);
          if (node !== null) {
            byNode.set(node, assignment);
          }
        } else {
          existing.tracks.push(segment);
        }
      });
    });
    for (let i = 0; i <= state.maxOrder; i += 1) {
      generateSingleLaneAssignment(state, state.assignments[i], i);
    }
  }
  function getIdealLanesAndCoords(state, assignment, order) {
    assignment.forEach((node) => {
      let laneSum = 0;
      node.tracks.forEach((track) => {
        const from = segmentToTheLeft(state.tracks[track.trackID].path, track.segmentID, order - 1);
        track.idealLane = from === void 0 ? track.trackID : from.lane;
        track.idealY = from === void 0 ? null : from.y;
        laneSum += track.idealLane;
      });
      node.idealLane = laneSum / node.tracks.length;
    });
  }
  function segmentToTheLeft(path, segmentID, leftOrder) {
    if (segmentID === 0) {
      return void 0;
    }
    if (path[segmentID - 1].order === leftOrder) {
      return path[segmentID - 1];
    }
    if (path[segmentID + 1]?.order === leftOrder) {
      return path[segmentID + 1];
    }
    return path.slice(0, segmentID).findLast((seg) => seg.order === leftOrder);
  }
  function generateSingleLaneAssignment(state, assignment, order) {
    let currentLane = 0;
    const potentialAdjustmentValues = /* @__PURE__ */ new Set();
    let currentY = 20;
    let prevNameIsNull = false;
    let prevTrack = -1;
    getIdealLanesAndCoords(state, assignment, order);
    assignment.sort(compareByIdealLane);
    assignment.forEach((node) => {
      const placed = node.node === null ? void 0 : state.nodes[node.node];
      if (placed !== void 0) {
        if (prevNameIsNull) {
          currentY -= 10;
        }
        placed.y = currentY;
        placed.contentHeight = 0;
        prevNameIsNull = false;
      } else {
        if (prevNameIsNull) {
          currentY -= 25;
        } else if (currentY > 20) {
          currentY -= 10;
        }
        prevNameIsNull = true;
      }
      node.tracks.sort(compareByIdealLane);
      node.tracks.forEach((track) => {
        const { path, width } = state.tracks[track.trackID];
        if (track.trackID === prevTrack && placed === void 0 && prevNameIsNull) {
          currentY += 10;
        }
        path[track.segmentID].lane = currentLane;
        path[track.segmentID].y = currentY;
        if (typeof track.idealY === "number") {
          potentialAdjustmentValues.add(track.idealY - currentY);
        }
        currentLane += 1;
        currentY += width;
        if (placed !== void 0) {
          placed.contentHeight += width;
        }
        prevTrack = track.trackID;
      });
      currentY += 25;
    });
    adjustVertically(state, assignment, potentialAdjustmentValues);
  }
  function adjustVertically(state, assignment, potentialAdjustmentValues) {
    let verticalAdjustment = 0;
    let minAdjustmentCost = Number.MAX_SAFE_INTEGER;
    potentialAdjustmentValues.forEach((moveBy) => {
      const cost = getVerticalAdjustmentCost(state, assignment, moveBy);
      if (cost < minAdjustmentCost) {
        minAdjustmentCost = cost;
        verticalAdjustment = moveBy;
      }
    });
    assignment.forEach((node) => {
      if (node.node !== null) {
        state.nodes[node.node].y += verticalAdjustment;
      }
      node.tracks.forEach((track) => {
        const seg = state.tracks[track.trackID].path[track.segmentID];
        seg.y = seg.y + verticalAdjustment;
      });
    });
  }
  function adjustVertically3(state, node, adjustBy) {
    if (node.order < 0 || state.assignments[node.order] === void 0) {
      return;
    }
    state.assignments[node.order].forEach((assignmentNode) => {
      if (assignmentNode.node !== null) {
        const aNode = state.nodes[assignmentNode.node];
        if (aNode !== node && aNode.y > node.y) {
          aNode.y += adjustBy;
          assignmentNode.tracks.forEach((track) => {
            const seg = state.tracks[track.trackID].path[track.segmentID];
            seg.y = seg.y + adjustBy;
          });
        }
      } else {
        assignmentNode.tracks.forEach((track) => {
          const seg = state.tracks[track.trackID].path[track.segmentID];
          if (seg.y >= node.y) {
            seg.y = seg.y + adjustBy;
          }
        });
      }
    });
    state.nodesPerOrder[node.order].forEach((nodeIndex) => {
      const other = state.nodes[nodeIndex];
      if (other !== node && other.y > node.y) {
        other.y += adjustBy;
      }
    });
  }
  function getVerticalAdjustmentCost(state, assignment, moveBy) {
    let result = 0;
    assignment.forEach((node) => {
      node.tracks.forEach((track) => {
        const { type, path, width } = state.tracks[track.trackID];
        if (typeof track.idealY === "number" && type !== "read") {
          result += Math.abs(track.idealY - moveBy - path[track.segmentID].y) * width;
        }
      });
    });
    return result;
  }
  function compareByIdealLane(a, b) {
    if (a.idealLane === void 0 || b.idealLane === void 0) {
      return Number(a.idealLane === void 0) - Number(b.idealLane === void 0);
    }
    return a.idealLane - b.idealLane;
  }
  function compareNodesByOrder(a, b) {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    if (a.y !== void 0 && b.y !== void 0) {
      return a.y - b.y;
    }
    return 0;
  }
  function calculateTrackWidth(state) {
    const NARROW_WIDTH = 4;
    const WIDE_WIDTH = state.config.trackWidth;
    if (state.config.freqWidth === "linear") {
      for (const track of state.tracks) {
        track.width = track.type === "read" ? NARROW_WIDTH : Math.max(1, Math.round(track.freq ?? 1)) * WIDE_WIDTH;
      }
      return;
    }
    for (const track of state.tracks) {
      track.width = track.freq !== void 0 ? Math.round((Math.log(Math.max(track.freq, 1)) + 1) * NARROW_WIDTH) : track.type === "read" ? NARROW_WIDTH : WIDE_WIDTH;
    }
    if (state.tracks.every((track) => track.width === NARROW_WIDTH)) {
      state.tracks.forEach((track) => {
        if (track.freq !== void 0) {
          track.width = WIDE_WIDTH;
        }
      });
    }
  }
  function readBaseX(state, seg, base) {
    const node = state.nodes[seg.node];
    return clampedXCoordinateOfBaseWithinNode(node, seg.isForward ? base : node.sequenceLength - base);
  }
  function getXCoordinateOfBaseWithinNode(node, base) {
    if (base > node.sequenceLength) {
      return null;
    }
    return clampedXCoordinateOfBaseWithinNode(node, base);
  }
  function clampedXCoordinateOfBaseWithinNode(node, base) {
    const [nodeLeftX, nodeRightX] = nodePixelCoordinatesInX(node);
    if (node.sequenceLength === 0) {
      return nodeLeftX;
    }
    const clamped = Math.min(Math.max(base, 0), node.sequenceLength);
    return nodeLeftX + clamped / node.sequenceLength * (nodeRightX - nodeLeftX);
  }
  function generateSVGShapesFromPath(state) {
    state.extraLeft = new Array(state.maxOrder + 1).fill(0);
    state.extraRight = new Array(state.maxOrder + 1).fill(0);
    const orderStartX = [];
    const orderEndX = [];
    state.nodes.forEach((node) => {
      if (node.x !== void 0) {
        orderStartX[node.order] = node.x;
        orderEndX[node.order] = Math.max(orderEndX[node.order] ?? -Infinity, node.x + node.pixelWidth);
      }
    });
    const reference = state.tracks[0];
    state.tracks.sort(compareTrackByInitialOrdering);
    state.tracks.forEach((track) => {
      const { id, name, type, width, path } = track;
      const rectangle = (xStart2, xEnd2, yStart2) => {
        state.shapes.rectangles.push({
          xStart: Math.min(xStart2, xEnd2),
          yStart: yStart2,
          xEnd: Math.max(xStart2, xEnd2),
          yEnd: yStart2 + width - 1,
          id,
          name,
          type
        });
      };
      const exitX = (seg) => seg.isForward ? orderEndX[seg.order] : orderStartX[seg.order];
      const first = path[0];
      let yStart = first.y;
      let xStart = type === "read" ? readBaseX(state, first, track.firstNodeOffset ?? 0) : first.isForward ? orderStartX[first.order] - 20 : orderEndX[first.order] + 20;
      for (let i = 1; i < path.length; i += 1) {
        const prev = path[i - 1];
        const seg = path[i];
        if (seg.y === yStart) {
          continue;
        }
        const xEnd2 = exitX(prev);
        if (xEnd2 !== xStart) {
          rectangle(xStart, xEnd2, yStart);
        }
        const yEnd = seg.y;
        const step = seg.order - prev.order;
        if (step === 1 || step === -1) {
          const xNext = step === 1 ? orderStartX[seg.order] : orderEndX[seg.order];
          state.shapes.curves.push({
            xStart: step === 1 ? xEnd2 : xEnd2 + 1,
            yStart,
            xEnd: step === 1 ? xNext + 1 : xNext,
            yEnd,
            width,
            id,
            name,
            type,
            nodeStart: prev.node,
            nodeEnd: seg.node,
            orderStart: prev.order,
            orderEnd: seg.order,
            ...track === reference ? { reference: true } : {}
          });
          xStart = xNext;
        } else {
          generateTurnaround(state, track, prev.isForward ? 1 : -1, xEnd2, yStart, yEnd, seg.order);
          xStart = xEnd2;
        }
        yStart = yEnd;
      }
      const last = path[path.length - 1];
      const xEnd = type === "read" ? readBaseX(state, last, track.finalNodeCoverLength ?? 0) : exitX(last) + (last.isForward ? 20 : -20);
      rectangle(xStart, xEnd, yStart);
    });
  }
  var COARSENED_ID_BASE = 1e9;
  function buildCoarsenedSyntheticBands(state, source, unit, firstId) {
    const edges = /* @__PURE__ */ new Map();
    let total = 0;
    const span = state.nodes.length;
    const edgeKey = (s, d) => (s + span) * (2 * span + 1) + d + span;
    const ignoreStrand = state.config.ignoreStrand;
    for (const [sourceIndex, item] of source.entries()) {
      const weight = Math.max(item.freq ?? 1, 1);
      total += weight;
      const seq = item.indexSequence;
      if (seq.length < 2) {
        continue;
      }
      for (let i2 = 0; i2 < seq.length - 1; i2 += 1) {
        const sSigned = seq[i2];
        const dSigned = seq[i2 + 1];
        const srcNode = state.nodes[Math.abs(sSigned)];
        const dstNode = state.nodes[Math.abs(dSigned)];
        const key = ignoreStrand ? Math.min(edgeKey(sSigned, dSigned), edgeKey(-dSigned, -sSigned)) : edgeKey(sSigned, dSigned);
        const existing = edges.get(key);
        if (existing === void 0) {
          edges.set(key, {
            sSigned,
            dSigned,
            sName: sSigned < 0 ? `-${srcNode.name}` : srcNode.name,
            dName: dSigned < 0 ? `-${dstNode.name}` : dstNode.name,
            count: weight,
            crossings: weight,
            sourceTrackID: item.sourceTrackID,
            lastSource: sourceIndex
          });
        } else {
          existing.crossings += weight;
          if (existing.lastSource !== sourceIndex) {
            existing.count += weight;
            existing.lastSource = sourceIndex;
          }
        }
      }
    }
    let maxEdgeCount = 0;
    for (const e of edges.values()) {
      if (e.crossings > maxEdgeCount) {
        maxEdgeCount = e.crossings;
      }
    }
    const BAND_MIN_WIDTH = READ_WIDTH;
    const BAND_MAX_WIDTH = 60;
    const widthForCount = (c) => {
      if (maxEdgeCount <= 1) {
        return BAND_MIN_WIDTH;
      }
      return BAND_MIN_WIDTH + (BAND_MAX_WIDTH - BAND_MIN_WIDTH) * Math.sqrt(c / maxEdgeCount);
    };
    const synthetic = [];
    let i = 0;
    for (const edge of edges.values()) {
      const id = firstId + i;
      const share = unit === "haplotype" ? { count: edge.count, total } : void 0;
      const shareText = share === void 0 ? "" : ` (${formatShare(share)})`;
      const crossingsText = edge.crossings === edge.count ? "" : `, ${edge.crossings.toLocaleString()} crossings`;
      const label = `${edge.count.toLocaleString()} ${unit}${edge.count === 1 ? "" : "s"}${shareText}${crossingsText}: Node ${edge.sName} \u2192 Node ${edge.dName}`;
      state.coarsenedEdgeMeta.set(id, { count: edge.count, label });
      const srcLen = state.nodes[Math.abs(edge.sSigned)].sequenceLength;
      synthetic.push({
        id,
        sourceTrackID: edge.sourceTrackID,
        type: "read",
        // Human-readable so the name surfaces sensibly in any UI that uses it
        // (right-click → add to group, etc.) — and so trackTooltipText fallback
        // shows something meaningful.
        name: label,
        sequence: [edge.sName, edge.dName],
        indexSequence: [],
        path: [],
        // assignReadsToNodes keeps a width already set
        width: widthForCount(edge.crossings),
        firstNodeOffset: srcLen,
        finalNodeCoverLength: 0,
        sequenceNew: [
          { nodeName: edge.sName, mismatches: [] },
          { nodeName: edge.dName, mismatches: [] }
        ],
        mapping_quality: 0,
        is_secondary: false,
        sample_name: null,
        read_group: null,
        score: edge.count,
        haplotypeShare: share
      });
      i += 1;
    }
    return { bands: synthetic, total };
  }
  function bandHaplotypes(state, firstId) {
    const rulerIndex = state.trackForRuler === void 0 ? -1 : state.tracks.findIndex((t) => t.name === state.trackForRuler);
    const refIndex = rulerIndex === -1 ? 0 : rulerIndex;
    const ref = state.tracks[refIndex];
    const refDuplicates = (ref.freq ?? 1) - 1;
    const refSigns = firstVisitSigns(state, ref);
    const altHaplotypes = state.tracks.filter((_, i) => i !== refIndex).map((walk) => orientedLike(refSigns, walk));
    if (refDuplicates > 0) {
      altHaplotypes.push({ ...ref, freq: refDuplicates });
    }
    if (altHaplotypes.length === 0) {
      return void 0;
    }
    const { bands, total } = buildCoarsenedSyntheticBands(state, altHaplotypes, "haplotype", firstId);
    return bands.length > 0 ? { ref, bands, total } : void 0;
  }
  function orientedLike(refSigns, walk) {
    let agreement = 0;
    for (const visit of walk.indexSequence) {
      const sign = refSigns[Math.abs(visit)];
      if (sign !== void 0 && sign !== 0) {
        agreement += sign === Math.sign(visit) ? 1 : -1;
      }
    }
    return agreement >= 0 ? walk : {
      ...walk,
      sequence: walk.sequence.map(flip).reverse(),
      indexSequence: walk.indexSequence.map((visit) => -visit).reverse()
    };
  }
  function firstVisitSigns(state, ref) {
    const signs = new Int8Array(state.nodes.length);
    for (const visit of ref.indexSequence) {
      const node = Math.abs(visit);
      if (signs[node] === 0) {
        signs[node] = Math.sign(visit);
      }
    }
    return signs;
  }
  function formatShare({ count, total }) {
    const share = count / total;
    if (share < 0.01) {
      return "<1%";
    }
    if (share > 0.99 && count < total) {
      return ">99%";
    }
    return `${Math.round(share * 100)}%`;
  }
  var MIN_BEND_WIDTH = 7;
  function generateTurnaround(state, { width: trackWidth, id: trackID, name: trackName, type }, dir, x, yStart, yEnd, order) {
    const extra = dir === 1 ? state.extraRight : state.extraLeft;
    const offset = 10 * extra[order];
    const apex = x + dir * (offset + 5);
    const radius = MIN_BEND_WIDTH;
    const stem = Math.min(MIN_BEND_WIDTH, trackWidth);
    const yTop = Math.min(yStart, yEnd);
    const yBottom = Math.max(yStart, yEnd);
    const stubNear = dir === 1 ? x : apex - 1;
    const stubFar = dir === 1 ? apex : x;
    const horizontal = (segTop) => {
      state.shapes.verticalRectangles.push({
        xStart: stubNear,
        yStart: segTop,
        xEnd: stubFar,
        yEnd: segTop + trackWidth - 1,
        id: trackID,
        name: trackName,
        type
      });
    };
    horizontal(yStart);
    state.shapes.verticalRectangles.push({
      xStart: dir === 1 ? apex + radius : apex - radius - stem,
      yStart: yTop + trackWidth + radius - 1,
      xEnd: dir === 1 ? apex + radius + stem - 1 : apex - radius - 1,
      yEnd: yBottom - radius + 1,
      id: trackID,
      name: trackName,
      type
    });
    horizontal(yEnd);
    const inner = apex + dir * radius;
    const outer = apex + dir * (radius + stem);
    let d = `M ${apex} ${yBottom}`;
    d += ` Q ${inner} ${yBottom} ${inner} ${yBottom - radius}`;
    d += ` H ${outer}`;
    d += ` Q ${outer} ${yBottom + trackWidth} ${apex} ${yBottom + trackWidth}`;
    d += " Z ";
    state.shapes.corners.push({ path: d, id: trackID, name: trackName, type });
    d = `M ${apex} ${yTop}`;
    d += ` Q ${outer} ${yTop} ${outer} ${yTop + trackWidth + radius}`;
    d += ` H ${inner}`;
    d += ` Q ${inner} ${yTop + trackWidth} ${apex} ${yTop + trackWidth}`;
    d += " Z ";
    state.shapes.corners.push({ path: d, id: trackID, name: trackName, type });
    extra[order] += 1;
  }
  function nodePixelCoordinatesInX(node) {
    const nodeLeftX = node.x - 4;
    const nodeRightX = node.x + node.pixelWidth + 4;
    return [nodeLeftX, nodeRightX];
  }
  function generateNodeWidth(state) {
    switch (state.config.nodeWidthOption) {
      case "compressed":
        state.nodes.forEach((node) => {
          node.width = 1 + Math.log2(Math.max(node.sequenceLength, 1));
          node.pixelWidth = Math.round((node.width - 1) * DEFAULT_CHAR_WIDTH);
        });
        break;
      case "small":
        state.nodes.forEach((node) => {
          node.width = node.sequenceLength / 100;
          node.pixelWidth = Math.max(Math.round((node.width - 1) * DEFAULT_CHAR_WIDTH), 0);
        });
        break;
      case "fixed":
        state.nodes.forEach((node) => {
          node.width = 10;
          node.pixelWidth = Math.round(node.width * DEFAULT_CHAR_WIDTH);
        });
        break;
      case "normal": {
        const charWidth = state.config.charWidth;
        state.nodes.forEach((node) => {
          node.width = node.sequenceLength;
          node.pixelWidth = Math.round(charWidth * Math.max(node.sequenceLength - 1, 0));
        });
        break;
      }
      default:
        throw new Error(`${state.config.nodeWidthOption} not implemented`);
    }
  }
  var TRACK_END = 0;
  function noNeighbors(nodeCount) {
    return { first: new Int32Array(nodeCount), count: new Uint8Array(nodeCount) };
  }
  function addNeighbor(neighbors, index, neighbor) {
    const count = neighbors.count[index];
    if (count === 0) {
      neighbors.first[index] = neighbor;
      neighbors.count[index] = 1;
    } else if (count === 1 && neighbors.first[index] !== neighbor) {
      neighbors.count[index] = 2;
    }
  }
  function soleNeighbor(neighbors, index) {
    return neighbors.count[index] === 1 ? Math.abs(neighbors.first[index]) : 0;
  }
  function mergeNodes(state) {
    const pred = noNeighbors(state.nodes.length);
    const succ = noNeighbors(state.nodes.length);
    const signedIndexOf = /* @__PURE__ */ new Map();
    const visit = (nodeName) => {
      let signed = signedIndexOf.get(nodeName);
      if (signed === void 0) {
        const index = state.nodeMap.get(forward(nodeName));
        signed = isReverse(nodeName) ? -index : index;
        signedIndexOf.set(nodeName, signed);
      }
      return signed;
    };
    const tracksAndReads = state.tracks.concat(state.reads);
    tracksAndReads.forEach((track) => {
      const { sequence } = track;
      const isHaplotype = track.type === "haplotype";
      const last = sequence.length - 1;
      let previous = TRACK_END;
      let current = last >= 0 ? visit(sequence[0]) : TRACK_END;
      for (let i = 0; i <= last; i += 1) {
        const next = i < last ? visit(sequence[i + 1]) : TRACK_END;
        if (current > 0) {
          if (i > 0) {
            addNeighbor(pred, current, previous);
            if (previous < 0) {
              addNeighbor(pred, current, -previous);
            }
          } else if (isHaplotype) {
            addNeighbor(pred, current, TRACK_END);
          }
          if (i < last) {
            addNeighbor(succ, current, next);
            if (next < 0) {
              addNeighbor(succ, current, -next);
            }
          } else if (isHaplotype) {
            addNeighbor(succ, current, TRACK_END);
          }
        } else {
          const index = -current;
          if (i > 0) {
            addNeighbor(succ, index, -previous);
            if (previous > 0) {
              addNeighbor(succ, index, previous);
            }
          } else if (isHaplotype) {
            addNeighbor(succ, index, TRACK_END);
          }
          if (i < last) {
            addNeighbor(pred, index, -next);
            if (next > 0) {
              addNeighbor(pred, index, next);
            }
          } else if (isHaplotype) {
            addNeighbor(pred, index, TRACK_END);
          }
        }
        previous = current;
        current = next;
      }
    });
    const absorbed = new Uint8Array(state.nodes.length);
    state.nodes.forEach((_, i) => {
      if (mergeableWithPred(i, pred, succ)) {
        absorbed[i] = 1;
      }
    });
    const origin = new Int32Array(state.nodes.length);
    const start = new Float64Array(state.nodes.length);
    const end = new Float64Array(state.nodes.length);
    state.nodes.forEach((node, head) => {
      if (absorbed[head] === 1) {
        return;
      }
      origin[head] = head;
      end[head] = node.sequenceLength;
      for (let donor = head; mergeableWithSucc(donor, pred, succ); ) {
        donor = soleNeighbor(succ, donor);
        origin[donor] = head;
        start[donor] = node.sequenceLength;
        node.sequenceLength += state.nodes[donor].sequenceLength;
        node.seq += state.nodes[donor].seq;
        end[donor] = node.sequenceLength;
      }
    });
    state.reads.forEach((read) => {
      const { sequence } = read;
      const entries = read.sequenceNew ?? sequence.map((nodeName) => ({ nodeName, mismatches: [] }));
      const shift = (nodeName) => {
        const index = Math.abs(visit(nodeName));
        return isReverse(nodeName) ? state.nodes[origin[index]].sequenceLength - end[index] : start[index];
      };
      const last = sequence.length - 1;
      read.firstNodeOffset = (read.firstNodeOffset ?? 0) + shift(sequence[0]);
      read.finalNodeCoverLength = (read.finalNodeCoverLength ?? 0) + shift(sequence[last]);
      const mergedSequence = [];
      const mergedEntries = [];
      let carried = [];
      sequence.forEach((nodeName, i) => {
        const index = Math.abs(visit(nodeName));
        const { mismatches } = entries[i];
        const by = shift(nodeName);
        mismatches.forEach((mismatch) => {
          mismatch.pos += by;
        });
        if (absorbed[index] === 1 && !isReverse(nodeName) && i > 0) {
          mergedEntries.at(-1).mismatches.push(...mismatches);
        } else if (absorbed[index] === 1 && isReverse(nodeName) && i < last) {
          carried.push(...mismatches);
        } else {
          const name = state.nodes[origin[index]].name;
          const merged = isReverse(nodeName) ? reverse(name) : name;
          mergedSequence.push(merged);
          mergedEntries.push({
            nodeName: merged,
            mismatches: carried.concat(mismatches)
          });
          carried = [];
        }
      });
      read.sequence = mergedSequence;
      if (read.sequenceNew !== void 0) {
        read.sequenceNew = mergedEntries;
      }
    });
    state.tracks.forEach((track) => {
      const { sequence } = track;
      let kept2 = 0;
      for (const nodeName of sequence) {
        if (absorbed[Math.abs(visit(nodeName))] === 0) {
          sequence[kept2] = nodeName;
          kept2 += 1;
        }
      }
      sequence.length = kept2;
    });
    let kept = 1;
    for (let i = 1; i < state.nodes.length; i += 1) {
      if (absorbed[i] === 0) {
        state.nodes[kept] = state.nodes[i];
        kept += 1;
      }
    }
    state.nodes.length = kept;
  }
  function mergeableWithPred(index, pred, succ) {
    const predecessor = soleNeighbor(pred, index);
    return predecessor !== 0 && soleNeighbor(succ, predecessor) !== 0;
  }
  function mergeableWithSucc(index, pred, succ) {
    const successor = soleNeighbor(succ, index);
    return successor !== 0 && soleNeighbor(pred, successor) !== 0;
  }

  // node_modules/.pnpm/@jbrowse+tubemap-core@2.0.1/node_modules/@jbrowse/tubemap-core/esm/geometry.js
  function compareCurvesByXYStartValue(a, b) {
    return b.xStart - a.xStart || a.yStart - b.yStart;
  }
  function curveEnds(curve) {
    return [
      curve.nodeStart ?? -1,
      curve.nodeEnd ?? -1,
      curve.nodeStart === null ? curve.orderStart : -1,
      curve.nodeEnd === null ? curve.orderEnd : -1
    ];
  }
  function compareTuples(a, b) {
    for (let i = 0; i < a.length; i += 1) {
      const d = a[i] - b[i];
      if (d !== 0) {
        return d;
      }
    }
    return 0;
  }
  var STEEP_SHARE = 0.75;
  var MAX_SPREAD = 0.8;
  function spreads(group, gapWidth) {
    const first = group[0];
    const span = Math.min(Math.abs(first.xEnd - first.xStart), gapWidth);
    if (span === 0) {
      return group.map(() => 0);
    }
    const floor = group.length > 5 ? 0.4 / group.length : 0;
    const wanted = group.map((c) => {
      const rise = Math.abs(c.yEnd - c.yStart);
      const across = rise / Math.hypot(rise, span) * Math.min(c.width, MAX_SPREAD * STEEP_SHARE * span);
      return Math.max(floor, across / (STEEP_SHARE * span));
    });
    const sum = (pick) => wanted.reduce((total, w, i) => total + (pick(group[i]) ? w : 0), 0);
    const reference = sum((c) => c.reference === true);
    const others = sum((c) => c.reference !== true);
    const referenceScale = reference > MAX_SPREAD ? MAX_SPREAD / reference : 1;
    const room = MAX_SPREAD - reference * referenceScale;
    const othersScale = others > room ? room / others : 1;
    return wanted.map((w, i) => w * (group[i].reference ? referenceScale : othersScale));
  }
  function curvePaths(curves, type, { gapWidth = Infinity } = {}) {
    const groupedCurves = groupBy(curves.filter((curve) => curve.type === type), (curve) => curveEnds(curve).join(","));
    groupedCurves.forEach((curveGroup) => {
      curveGroup.sort(compareCurvesByXYStartValue);
      const spread = spreads(curveGroup, gapWidth);
      let adjustValue = 0.5 - spread.reduce((sum, s) => sum + s, 0) / 2;
      curveGroup.forEach((curve, i) => {
        const at = (share) => curve.xStart + (curve.xEnd - curve.xStart) * (curve.yStart < curve.yEnd ? 1 - share : share);
        const xAdjusted = at(adjustValue);
        adjustValue += spread[i];
        const xNextAdjusted = at(adjustValue);
        let d = `M ${curve.xStart} ${curve.yStart}`;
        d += ` C ${xAdjusted} ${curve.yStart} ${xAdjusted} ${curve.yEnd} ${curve.xEnd} ${curve.yEnd}`;
        d += ` V ${curve.yEnd + curve.width}`;
        d += ` C ${xNextAdjusted} ${curve.yEnd + curve.width} ${xNextAdjusted} ${curve.yStart + curve.width} ${curve.xStart} ${curve.yStart + curve.width}`;
        d += " Z";
        curve.path = d;
      });
    });
    return [...groupedCurves.values()].sort((a, b) => compareTuples(curveEnds(a[0]), curveEnds(b[0]))).flat();
  }
  function flattenPath(d, steps = 16) {
    const tokens2 = d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
    const points = [];
    let x = 0;
    let y = 0;
    let i = 0;
    const num = () => Number(tokens2[i++]);
    while (i < tokens2.length) {
      const command = tokens2[i++];
      if (command === "M" || command === "L") {
        x = num();
        y = num();
        points.push([x, y]);
      } else if (command === "H") {
        x = num();
        points.push([x, y]);
      } else if (command === "V") {
        y = num();
        points.push([x, y]);
      } else if (command === "C") {
        const [x1, y1, x2, y2, x3, y3] = [
          num(),
          num(),
          num(),
          num(),
          num(),
          num()
        ];
        for (let s = 1; s <= steps; s += 1) {
          const t = s / steps;
          const u = 1 - t;
          const a = u * u * u;
          const b = 3 * u * u * t;
          const c = 3 * u * t * t;
          const e = t * t * t;
          points.push([
            a * x + b * x1 + c * x2 + e * x3,
            a * y + b * y1 + c * y2 + e * y3
          ]);
        }
        x = x3;
        y = y3;
      } else if (command === "Q") {
        const [x1, y1, x2, y2] = [num(), num(), num(), num()];
        for (let s = 1; s <= steps; s += 1) {
          const t = s / steps;
          const u = 1 - t;
          points.push([
            u * u * x + 2 * u * t * x1 + t * t * x2,
            u * u * y + 2 * u * t * y1 + t * t * y2
          ]);
        }
        x = x2;
        y = y2;
      } else if (command !== "Z") {
        throw new Error(`flattenPath: unsupported path command ${command}`);
      }
    }
    return points;
  }
  function nodeOutlinePath(node) {
    let d = `M ${node.x - 9} ${node.y} Q ${node.x - 9} ${node.y - 9} ${node.x} ${node.y - 9}`;
    let x = node.x;
    let y = node.y - 9;
    if (node.width > 1) {
      x += node.pixelWidth;
      d += ` L ${x} ${y}`;
    }
    d += ` Q ${x + 9} ${y} ${x + 9} ${y + 9}`;
    x += 9;
    y += 9;
    if (node.contentHeight > 0) {
      y += node.contentHeight;
      d += ` L ${x} ${y}`;
    }
    d += ` Q ${x} ${y + 9} ${x - 9} ${y + 9}`;
    x -= 9;
    y += 9;
    if (node.width > 1) {
      x -= node.pixelWidth;
      d += ` L ${x} ${y}`;
    }
    d += ` Q ${x - 9} ${y} ${x - 9} ${y - 9}`;
    x -= 9;
    y -= 9;
    if (node.contentHeight > 0) {
      y -= node.contentHeight;
      d += ` L ${x} ${y}`;
    }
    return d;
  }

  // node_modules/.pnpm/@jbrowse+tubemap-core@2.0.1/node_modules/@jbrowse/tubemap-core/esm/mismatches.js
  function readMismatches(layout) {
    const { nodes, nodeMap } = layout;
    const out = [];
    for (const read of layout.tracks) {
      const entries = read.sequenceNew;
      if (read.type !== "read" || entries === void 0) {
        continue;
      }
      let from = 0;
      entries.forEach((entry, i) => {
        const nodeIndex = nodeMap.get(forward(entry.nodeName));
        const node = nodeIndex === void 0 ? void 0 : nodes[nodeIndex];
        const pathIndex = read.path.findIndex((s, j) => j >= from && s.node === nodeIndex);
        const segment = read.path[pathIndex];
        if (node === void 0 || segment?.y === void 0) {
          return;
        }
        from = pathIndex + 1;
        for (const edit of entry.mismatches) {
          const mm = segment.isForward ? edit : mirroredMismatch(edit, node.sequenceLength);
          const span = mm.type === "deletion" ? mm.length : mm.type === "substitution" ? mm.seq?.length : 0;
          if (span === void 0) {
            continue;
          }
          const x = getXCoordinateOfBaseWithinNode(node, mm.pos);
          const xEnd = getXCoordinateOfBaseWithinNode(node, mm.pos + span);
          if (x === null || xEnd === null) {
            continue;
          }
          out.push({
            type: mm.type,
            readId: read.id,
            x,
            xEnd,
            y: segment.y,
            height: read.width,
            nodeY: node.y,
            seq: mm.seq,
            softClip: mm.type === "insertion" && (i === 0 && edit.pos === read.firstNodeOffset || i === entries.length - 1 && edit.pos === read.finalNodeCoverLength)
          });
        }
      });
    }
    return out;
  }

  // tools/bridge.js
  function columns(names) {
    const table = {};
    for (const name of names) {
      table[name] = [];
    }
    return table;
  }
  function pushRow(table, row) {
    for (const key in table) {
      table[key].push(row[key] ?? null);
    }
  }
  var rectPoints = (r) => [
    [r.xStart, r.yStart],
    [r.xEnd + 1, r.yStart],
    [r.xEnd + 1, r.yEnd + 1],
    [r.xStart, r.yEnd + 1]
  ];
  function counted(count, noun) {
    return `${count.toLocaleString("en-US")} ${noun}${count === 1 ? "" : "s"}`;
  }
  var READ_FACET_NOUNS = { read_group: "read group", sample_name: "sample" };
  function facetLabel(facet, panel) {
    if (facet.by === "haplotype_sample") {
      if ("reads" in facet) {
        return `Reads \xB7 ${counted(panel.readCount, "read")}`;
      }
      const name2 = facet.key === null ? "No PanSN sample" : `Sample ${facet.key}`;
      return `${name2} \xB7 ${counted(panel.haplotypeCount, "haplotype")}`;
    }
    const noun = READ_FACET_NOUNS[facet.by];
    const name = facet.key === null ? `No ${noun}` : `${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${facet.key}`;
    return `${name} \xB7 ${counted(panel.readCount, "read")}`;
  }
  function trackShapes(layout, steps, emit) {
    const { rectangles, curves, corners, verticalRectangles } = layout.shapes;
    for (const type of ["haplotype", "read"]) {
      for (const r of rectangles) {
        if (r.type === type) {
          emit(r.id, type, "rectangle", rectPoints(r));
        }
      }
      for (const c of curvePaths(curves, type)) {
        emit(c.id, type, "curve", flattenPath(c.path, steps));
      }
      const turns = /* @__PURE__ */ new Map();
      const addTurn = (id, points) => {
        turns.set(id, [...turns.get(id) ?? [], points]);
      };
      for (const r of verticalRectangles) {
        if (r.type === type) {
          addTurn(r.id, rectPoints(r));
        }
      }
      for (const c of corners) {
        if (c.type === type) {
          addTurn(c.id, flattenPath(c.path, steps));
        }
      }
      for (const [id, pieces] of turns) {
        for (const points of pieces) {
          emit(id, type, "turn", points);
        }
      }
    }
  }
  function rulerVisits(layout, emit) {
    if (layout.trackForRuler === void 0) {
      return;
    }
    const track = layout.tracks.find((t) => t.name === layout.trackForRuler);
    const steps = track.indexSequence;
    let start = track.indexOfFirstBase ?? 0;
    for (let i = 0; i < steps.length; i += 1) {
      const step = track.isCompletelyReverse ? steps.length - 1 - i : i;
      const node = layout.nodes[Math.abs(steps[step])];
      const [left, right] = nodePixelCoordinatesInX(node);
      emit({
        track: track.name,
        node: node.name,
        start,
        length: node.sequenceLength,
        reverse: isForwardIndex(steps[step]) === Boolean(track.isCompletelyReverse),
        left,
        right
      });
      start += node.sequenceLength;
    }
  }
  globalThis.tubemapLayout = function(requestJson) {
    const { nodes, tracks, reads, topology, placement, steps } = JSON.parse(requestJson);
    const arranged = layoutTopology(nodes, tracks, reads, topology);
    if (arranged === void 0) {
      return JSON.stringify(null);
    }
    const faceted = placeFacets(arranged, placement);
    const shapes = columns(["panel", "group", "track_id", "type", "shape", "x", "y"]);
    const trackTable = columns([
      "id",
      "name",
      "type",
      "source_track_id",
      "freq",
      "width",
      "is_reverse",
      "mapping_quality",
      "sample_name",
      "read_group",
      "band_count",
      "band_label"
    ]);
    const nodeTable = columns([
      "panel",
      "name",
      "x",
      "y",
      "pixel_width",
      "content_height",
      "left",
      "right",
      "seq",
      "sequence_length",
      "order"
    ]);
    const outlines = columns(["panel", "group", "name", "x", "y"]);
    const mismatches = columns([
      "panel",
      "read_id",
      "type",
      "x",
      "x_end",
      "y",
      "height",
      "seq",
      "soft_clip"
    ]);
    const panels = columns(["panel", "label", "top", "bottom", "offset_y"]);
    const ruler = columns(["track", "node", "start", "length", "reverse", "left", "right"]);
    rulerVisits(faceted.panels[0].layout, (row) => pushRow(ruler, row));
    let group = 0;
    const seenTracks = /* @__PURE__ */ new Set();
    faceted.panels.forEach((p, i) => {
      const panel = i + 1;
      const { layout, offsetY } = p;
      const dy = (y) => y + offsetY;
      trackShapes(layout, steps, (id, type, shape, points) => {
        group += 1;
        for (const [x, y] of points) {
          pushRow(shapes, { panel, group, track_id: id, type, shape, x, y: dy(y) });
        }
      });
      for (const t of layout.tracks) {
        if (seenTracks.has(t.id)) {
          continue;
        }
        seenTracks.add(t.id);
        const band = layout.coarsenedEdgeMeta.get(t.id);
        pushRow(trackTable, {
          id: t.id,
          name: t.name ?? "",
          type: t.type ?? "haplotype",
          source_track_id: t.sourceTrackID,
          freq: t.freq,
          width: t.width,
          is_reverse: t.is_reverse,
          mapping_quality: t.mapping_quality,
          sample_name: t.sample_name,
          read_group: t.read_group,
          band_count: band?.count,
          band_label: band?.label
        });
      }
      layout.nodes.forEach((n) => {
        if (n.x === void 0) {
          return;
        }
        pushRow(nodeTable, {
          panel,
          name: n.name,
          x: n.x,
          y: dy(n.y),
          pixel_width: n.pixelWidth,
          content_height: n.contentHeight,
          left: n.x - 4,
          right: n.x + n.pixelWidth + 4,
          seq: n.seq,
          sequence_length: n.sequenceLength,
          order: n.order
        });
        group += 1;
        for (const [x, y] of flattenPath(nodeOutlinePath(n), steps)) {
          pushRow(outlines, { panel, group, name: n.name, x, y: dy(y) });
        }
      });
      for (const m of readMismatches(layout)) {
        pushRow(mismatches, {
          panel,
          read_id: m.readId,
          type: m.type,
          x: m.x,
          x_end: m.xEnd,
          y: dy(m.y),
          height: m.height,
          seq: m.seq,
          soft_clip: m.softClip
        });
      }
      pushRow(panels, {
        panel,
        label: p.facet === void 0 ? null : facetLabel(p.facet, p),
        top: dy(layout.bounds.minY),
        bottom: dy(layout.bounds.maxY),
        offset_y: offsetY
      });
    });
    return JSON.stringify({
      bounds: faceted.bounds,
      shapes,
      tracks: trackTable,
      nodes: nodeTable,
      outlines,
      mismatches,
      panels,
      ruler
    });
  };
})();
