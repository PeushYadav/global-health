// models/Prescription.ts
import mongoose, { Schema, models } from 'mongoose';
const ItemSchema = new Schema({ name: String, dosage: String, instructions: String }, { _id: false });
const PrescriptionSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String, trim: true },
  date: { type: Date, required: true, index: true },
  items: [ItemSchema],
  notes: String
}, { timestamps: true });
export const Prescription = models.Prescription || mongoose.model('Prescription', PrescriptionSchema);
