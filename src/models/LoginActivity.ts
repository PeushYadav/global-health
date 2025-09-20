// models/LoginActivity.ts
import mongoose, { Schema, models } from 'mongoose';

const LoginActivitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD format
    loginCount: { type: Number, default: 1 }, // Number of logins on that day
    lastLoginTime: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Compound index to ensure one record per user per day
LoginActivitySchema.index({ user: 1, date: 1 }, { unique: true });

export const LoginActivity = models.LoginActivity || mongoose.model('LoginActivity', LoginActivitySchema);