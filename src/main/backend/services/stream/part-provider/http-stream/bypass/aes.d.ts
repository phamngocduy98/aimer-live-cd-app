declare const slowAES: {
  encrypt: (bytesIn: number[], mode: ModeOfOperation, key: number[], iv: number[]) => number[];
  decrypt: (cipherIn: number[], mode: ModeOfOperation, key: number[], iv: number[]) => number[];
};

export declare enum ModeOfOperation {
  OFB = 0,
  CFB = 1,
  CBC = 2
}

export declare function toNumbers(d: string): number[];
export declare function toHex(...args: any[]): string;
