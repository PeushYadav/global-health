// models/Appointment.ts
import mongoose, { Schema, models } from 'mongoose';
const AppointmentSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String, trim: true },
  when: { type: Date, required: true, index: true },
  reason: { type: String, trim: true },
  location: { type: String, trim: true },
  status: { type: String, enum: ['upcoming', 'in-progress', 'completed', 'cancelled'], default: 'upcoming', index: true },
  // Video call fields
  callRoomId: { type: String, trim: true },
  callStarted: { type: Date },
  callEnded: { type: Date },
  callDuration: { type: Number }, // Duration in seconds
  isVideoCall: { type: Boolean, default: false }
}, { timestamps: true });
export const Appointment = models.Appointment || mongoose.model('Appointment', AppointmentSchema);
