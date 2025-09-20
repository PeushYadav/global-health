// models/MedicalProfile.ts
import mongoose, { Schema, models } from 'mongoose';

const MedicationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    timing: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const MedicalProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, index: true, required: true },
    chronicDiseases: [{ type: String, trim: true }],
    medications: [MedicationSchema],
    consultingDoctor: { type: String, trim: true }, // optional free-text name
    doctorOnPlatform: { type: String, enum: ['yes', 'no', 'maybe'], default: 'maybe', index: true },
    doctorEmail: { type: String, trim: true } // required if doctorOnPlatform is 'no' or 'maybe'
  },
  { timestamps: true }
);

export const MedicalProfile =
  models.MedicalProfile || mongoose.model('MedicalProfile', MedicalProfileSchema);
