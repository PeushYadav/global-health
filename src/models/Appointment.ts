// models/Appointment.ts
import mongoose, { Schema, models } from 'mongoose';
const AppointmentSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String, trim: true },
  when: { type: Date, required: true, index: true },
  reason: { type: String, trim: true },
  location: { type: String, trim: true },
  status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming', index: true }
}, { timestamps: true });
export const Appointment = models.Appointment || mongoose.model('Appointment', AppointmentSchema);
