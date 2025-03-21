import { Document, Types } from "mongoose";

export type WithObjectId<T> = T & { _id: Types.ObjectId; id: string };

export type WithDocument<T> = Document<Types.ObjectId, any, T> & T & { _id: Types.ObjectId };

export type DbDocument<T> = Document<unknown, any, T> &
  Omit<
    T & {
      _id: Types.ObjectId;
    },
    never
  >;
