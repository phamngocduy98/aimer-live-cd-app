declare const slowAES: {
  /**
   * Mode of Operation Encryption
   *
   * bytesIn - Input String as array of bytes
   *
   * mode - mode of type modeOfOperation
   *
   * key - a number array of length 'size'
   *
   * size - the bit length of the key
   *
   * iv - the 128 bit number array Initialization Vector
   */
  encrypt: (bytesIn: number[], mode: ModeOfOperation, key: number[], iv: number[]) => number[];
  /**
   * Mode of Operation Decryption
   *
   * cipherIn - Encrypted String as array of bytes
   *
   * originalsize - The unencrypted string length - required for CBC
   *
   * mode - mode of type modeOfOperation
   *
   * key - a number array of length 'size'
   *
   * size - the bit length of the key
   *
   * iv - the 128 bit number array Initialization Vector
   *
   **/
  decrypt: (cipherIn: number[], mode: ModeOfOperation, key: number[], iv: number[]) => number[];
};

export declare enum ModeOfOperation {
  OFB = 0,
  CFB = 1,
  CBC = 2
}

export declare function toNumbers(d: string): number[];
export declare function toHex(...args: any[]): string;
