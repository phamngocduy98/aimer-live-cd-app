import { Types } from "mongoose";
import { DbDocument } from "../utils/type.js";
import { IHosting } from "../db/Hosting.js";

export interface StreamInfo {
  id?: Types.ObjectId;
  hostingList: IHosting[];
  format: string;
  size: number;
  fileCount: number;
  iv: string;
  fileExtension: string;

  /**
   * @deprecated
   */
  fileList?: string[];
}
