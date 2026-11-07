const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mode: { type: String, enum: ['single_player'], default: 'single_player' },
    startingYear: { type: Number, required: true, default: 1800 },
    currentYear: { type: Number, default: 1800 },
    currentTurn: { type: Number, default: 1 },
    difficulty: { type: String, enum: ['easy', 'normal', 'hard'], default: 'normal' },
    tutorialEnabled: { type: Boolean, default: true },
    tutorialCompleted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['config', 'country_selection', 'active', 'completed', 'abandoned'],
      default: 'country_selection',
    },
  },
  { timestamps: true }
);

gameSchema.index({ owner: 1, updatedAt: -1 });

module.exports = mongoose.model('Game', gameSchema);
