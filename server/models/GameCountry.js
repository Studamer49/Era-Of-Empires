const mongoose = require('mongoose');

const gameCountrySchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    code: { type: String, required: true, index: true },
    name: { type: String, required: true },
    flag: { type: String, default: '' },
    lat: { type: Number },
    lng: { type: Number },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    ownerUsername: { type: String, default: '' },
    // Default / starting statistics (snapshot of the country template).
    basePopulation: { type: Number, default: 0 },
    baseTreasury: { type: Number, default: 0 },
    baseFood: { type: Number, default: 0 },
    baseOil: { type: Number, default: 0 },
    baseSteel: { type: Number, default: 0 },
    baseGold: { type: Number, default: 0 },
    baseEconomicStrength: { type: Number, default: 0 },
    baseMilitaryStrength: { type: Number, default: 0 },
    description: { type: String, default: '' },
    // Current player-controlled statistics (initialised from the base values).
    population: { type: Number, default: 0 },
    treasury: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    oil: { type: Number, default: 0 },
    steel: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    economicStrength: { type: Number, default: 0 },
    militaryStrength: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gameCountrySchema.index({ game: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('GameCountry', gameCountrySchema);
