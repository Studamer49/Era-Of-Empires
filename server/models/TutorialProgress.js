const mongoose = require('mongoose');

const tutorialProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    stage: { type: Number, default: 1, min: 1, max: 8 },
    completed: { type: Boolean, default: false },
    seenStages: [{ type: Number }],
    completedAt: { type: Date },
  },
  { timestamps: true }
);

tutorialProgressSchema.index({ user: 1, game: 1 }, { unique: true });

module.exports = mongoose.model('TutorialProgress', tutorialProgressSchema);
