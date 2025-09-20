// models/Message.ts
import mongoose, { Schema, models } from 'mongoose';
const MessageSchema = new Schema({
  threadKey: { type: String, index: true, required: true }, // `${patientId}:${doctorId}`
  from: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  body: { type: String, trim: true, required: true },
  sentAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });
MessageSchema.index({ threadKey: 1, sentAt: -1 });
export const Message = models.Message || mongoose.model('Message', MessageSchema);
