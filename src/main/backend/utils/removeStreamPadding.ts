import { Readable, Transform } from "stream";
import { StreamFilePart } from "../stream/StreamFilePart.js";

export function removeStreamPadding(input: Readable, part: StreamFilePart) {
  if (part.partByteStart === 0 && part.partByteEnd == part.partSize - 1) return input;
  console.log(
    `[ ${"Remove Padding".padStart(15)} ] ${part.fileName}: ${
      part.partByteStart
    }-${part.partByteEnd}/${part.partSize}`
  );

  let removedPos = 0;
  let prePos = 0; // position of first byte of chunk
  let pos = 0; // position to place next chunk (null)
  return input.pipe(
    new Transform({
      transform(chunk, encoding, callback) {
        const len = chunk.length;
        prePos = pos;
        pos += len;

        if (removedPos <= part.partByteStart) {
          // need to remove start padding
          if (pos <= part.partByteStart) {
            // skip all bytes
            removedPos = pos;
            callback();
            return;
          }

          // chuck [prePos, pos-1]
          const newChunk = chunk.subarray(
            part.partByteStart - prePos, // pad some bytes at start
            part.partByteEnd - prePos + 1 // pad some bytes at end (if needed)
          );
          // this.push(newChunk);

          removedPos = pos;
          callback(null, newChunk);
          return;
        }

        if (part.partByteEnd - prePos + 1 > 0) {
          callback(null, chunk.subarray(0, part.partByteEnd - prePos + 1)); // pad some bytes at end (if needed)
          return;
        }
      }
    })
  );
}
