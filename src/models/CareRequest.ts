// models/CareRequest.ts
import mongoose, { Schema, models } from 'mongoose';

const CareRequestSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending', index: true },
  reason: { type: String, trim: true },
  conditions: [{ type: String, trim: true }],
  currentMeds: [{ type: String, trim: true }],
  preferredTime: { type: String, trim: true },
  notes: { type: String, trim: true }
}, { timestamps: true });

CareRequestSchema.index({ doctor: 1, patient: 1, status: 1 });

export const CareRequest =
  models.CareRequest || mongoose.model('CareRequest', CareRequestSchema);
