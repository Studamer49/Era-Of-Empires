const mongoose = require('mongoose');

const gamePlayerSchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'GameCountry', required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

gamePlayerSchema.index({ game: 1, user: 1 }, { unique: true });
gamePlayerSchema.index({ game: 1, country: 1 }, { unique: true });

module.exports = mongoose.model('GamePlayer', gamePlayerSchema);
