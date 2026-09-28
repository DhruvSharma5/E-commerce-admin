const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select:false => never returned from queries unless we explicitly ask (+password)
    password: { type: String, required: true, select: false },
    // SHA-256 hashes of currently valid refresh tokens (one per logged-in device)
    refreshTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true }
);

// Shape of the user object sent to clients: id, name, email only
userSchema.set('toJSON', {
  transform: (_doc, ret) => ({ id: ret._id, name: ret.name, email: ret.email, createdAt: ret.createdAt }),
});

module.exports = mongoose.model('User', userSchema);
