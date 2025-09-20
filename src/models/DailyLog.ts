// models/DailyLog.ts
import mongoose, { Schema, models } from 'mongoose';
const DailyLogSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  medicationsTaken: [{ type: String, trim: true }]
}, { timestamps: true });
DailyLogSchema.index({ patient: 1, date: 1 }, { unique: true });
export const DailyLog = models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
