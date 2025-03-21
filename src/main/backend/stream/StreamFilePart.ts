export class StreamFilePart {
  static BLOCK_SIZE = 16;
  constructor(
    public partIndex: number,
    public partSize: number,
    public fileName: string,
    public partByteStart: number,
    public partByteEnd: number
  ) {}

  getBlockStart(byteStart = this.partByteStart) {
    return Math.floor(this.partByteStart / StreamFilePart.BLOCK_SIZE) * StreamFilePart.BLOCK_SIZE;
  }
  getBlockStartIdx(byteStart = this.partByteStart) {
    return this.getBlockStart(byteStart) / StreamFilePart.BLOCK_SIZE;
  }
}
