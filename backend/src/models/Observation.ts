import mongoose, { Document, Schema } from "mongoose";

export interface IObservation extends Document {
  object: string;
  observer: string;
  date: string;
  notes: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const observationSchema = new Schema<IObservation>(
  {
    object: { type: String, required: true, trim: true },
    observer: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    notes: { type: String, default: "", trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

export default mongoose.model<IObservation>("Observation", observationSchema);
