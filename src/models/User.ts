// models/User.ts
import mongoose, { Schema, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['doctor', 'patient'], default: 'patient', index: true }
  },
  { timestamps: true }
);

// Avoid OverwriteModelError in Next.js dev
export const User = models.User || mongoose.model('User', UserSchema);
