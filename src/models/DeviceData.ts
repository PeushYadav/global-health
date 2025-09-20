// models/DeviceData.ts
import mongoose, { Schema, models } from 'mongoose';
const DeviceDataSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  deviceId: { type: String, trim: true, index: true },
  type: { type: String, trim: true, index: true }, // 'hr' | 'bp' | 'hydration' | 'glucose' | 'etc'
  value: { type: Number, required: true },
  unit: { type: String, trim: true },
  takenAt: { type: Date, default: Date.now, index: true },
  meta: { type: Schema.Types.Mixed }
}, { timestamps: true });
DeviceDataSchema.index({ patient: 1, type: 1, takenAt: -1 });
export const DeviceData = models.DeviceData || mongoose.model('DeviceData', DeviceDataSchema);
