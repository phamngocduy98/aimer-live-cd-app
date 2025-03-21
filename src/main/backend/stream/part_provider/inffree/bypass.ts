import axios from "axios";
import { slowAES, toHex, toNumbers } from "./aes.js";

const regex = /a=toNumbers\("(\w+)"\),b=toNumbers\("(\w+)"\),c=toNumbers\("(\w+)"\)/m;

export function decryptToken(htmlResRaw: string) {
  const m = regex.exec(htmlResRaw);
  if (m == null) throw Error("Regex is out date.");
  const [strA, strB, strC] = m.slice(1);
  const a = toNumbers(strA);
  const b = toNumbers(strB);
  const c = toNumbers(strC);
  return toHex(slowAES.decrypt(c, 2, a, b));
}

class ByPassHosting {
  tokens: {
    [host: string]: {
      value: string;
    };
  };
  constructor() {
    this.tokens = {};
  }
  async refreshToken(host: string) {
    let token = this.tokens[host]?.value ?? "undefined";

    const mres = await axios.get(`${host}/alive`, {
      headers: {
        cookie: `__test=${token}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
      },
      maxRedirects: 0,
      validateStatus: function (status) {
        return status < 500; // Resolve only if the status code is less than 500
      }
    });
    if (typeof mres.data != "string" || !mres.data.includes("aes.js")) {
      // contains this: <script type="text/javascript" src="/aes.js"></script>
      console.log(`[Refresh token] ${host}: valid ${token}`);
      this.tokens[host] = {
        value: token
      };
      return token;
    }
    token = decryptToken(mres.data);
    this.tokens[host] = {
      value: token
    };
    console.log(`[ ${`Refresh token`.padStart(15)} ] ${host} token=${token}`);
    return token;
  }
}

export const byPassHosting = new ByPassHosting();
