import { Types } from "mongoose";
import { DbDocument } from "../../../types/type.js";
import { IHosting } from "../../../models/Hosting.js";

export interface StreamInfo {
  id?: Types.ObjectId;
  hostingList: IHosting[];
  format: string;
  size: number;
  fileCount: number;
  iv: string;
  fileExtension: string;
}
