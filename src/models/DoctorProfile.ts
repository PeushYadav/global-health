// models/DoctorProfile.ts
import mongoose, { Schema, models } from 'mongoose';

const DoctorProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, index: true, required: true },
  specialty: { type: String, required: true, index: true },
  subSpecialties: [{ type: String, index: true }],
  yearsExperience: { type: Number, min: 0, index: true },
  resumeUrl: { type: String, trim: true },
  bio: { type: String, trim: true },
  languages: [{ type: String, index: true }],
  city: { type: String, index: true },
  acceptingNewPatients: { type: Boolean, default: true, index: true },
  consultationFee: { type: Number, min: 0 }
}, { timestamps: true });

// Text index for search (single compound text index across multiple fields)
DoctorProfileSchema.index({ specialty: 'text', bio: 'text', city: 'text', subSpecialties: 'text' });

export const DoctorProfile =
  models.DoctorProfile || mongoose.model('DoctorProfile', DoctorProfileSchema);
