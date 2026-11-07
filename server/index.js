require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');
const Game = require('./models/Game');
const GameCountry = require('./models/GameCountry');
const GamePlayer = require('./models/GamePlayer');
const TutorialProgress = require('./models/TutorialProgress');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3001;

mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// In-memory denylist for logged out tokens (single-instance setup)
const denylist = new Map();

function signToken(user) {
  const jti = require('crypto').randomUUID();
  const payload = { sub: user._id.toString(), jti };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return token;
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const expiry = denylist.get(decoded.jti);
  if (expiry && expiry < Date.now()) {
    denylist.delete(decoded.jti);
  }
  if (denylist.has(decoded.jti)) return res.status(401).json({ error: 'Token revoked' });
  try {
    const user = await User.findById(decoded.sub).select('+passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    req.token = token;
    next();
  } catch (err2) {
    return res.status(401).json({ error: 'User not found' });
  }
}

function sanitizeUser(user) {
  return { _id: user._id, username: user.username, email: user.email };
}

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const existingEmail = await User.findOne({ email: String(email).toLowerCase() });
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(409).json({ error: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email: String(email).toLowerCase(), passwordHash });
    const token = signToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await user.comparePassword(String(password));
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

// ---------------------------------------------------------------------------
// Default country templates (shared game data).
// ---------------------------------------------------------------------------
const DEFAULT_COUNTRIES = [
  {
    code: 'SWE', name: 'Sweden', flag: '\u{1F1F8}\u{1F1EA}', lat: 59.33, lng: 18.07,
    population: 10.5, treasury: 80, food: 60, oil: 20, steel: 40, gold: 30,
    economicStrength: 65, militaryStrength: 35,
    description: 'A prosperous Nordic nation with a strong economy and high quality of life.'
  },
  {
    code: 'MNG', name: 'Mongolia', flag: '\u{1F1F2}\u{1F1F3}', lat: 47.9, lng: 106.9,
    population: 3.4, treasury: 40, food: 50, oil: 10, steel: 15, gold: 20,
    economicStrength: 30, militaryStrength: 25,
    description: 'A vast landlocked nation with rich mineral resources and nomadic heritage.'
  },
  {
    code: 'USA', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', lat: 39.8, lng: -98.6,
    population: 331, treasury: 200, food: 100, oil: 60, steel: 80, gold: 90,
    economicStrength: 95, militaryStrength: 90,
    description: 'A global superpower with the world\'s largest economy and military.'
  },
  {
    code: 'CHN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}', lat: 35.0, lng: 104.0,
    population: 1412, treasury: 180, food: 90, oil: 40, steel: 100, gold: 70,
    economicStrength: 90, militaryStrength: 85,
    description: 'The world\'s most populous nation with a rapidly growing economy.'
  },
  {
    code: 'RUS', name: 'Russia', flag: '\u{1F1F7}\u{1F1FA}', lat: 55.75, lng: 37.6,
    population: 144, treasury: 120, food: 70, oil: 100, steel: 60, gold: 60,
    economicStrength: 70, militaryStrength: 80,
    description: 'The largest country by land area with vast energy reserves.'
  },
  {
    code: 'ARG', name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}', lat: -34.6, lng: -58.4,
    population: 46, treasury: 50, food: 70, oil: 20, steel: 25, gold: 20,
    economicStrength: 45, militaryStrength: 30,
    description: 'A South American nation with strong agricultural exports.'
  },
  {
    code: 'ISR', name: 'Israel', flag: '\u{1F1EE}\u{1F1F1}', lat: 31.77, lng: 35.2,
    population: 9, treasury: 60, food: 30, oil: 5, steel: 20, gold: 40,
    economicStrength: 60, militaryStrength: 55,
    description: 'A technologically advanced nation in the Middle East.'
  },
  {
    code: 'PRK', name: 'North Korea', flag: '\u{1F1F0}\u{1F1F5}', lat: 39.0, lng: 125.8,
    population: 26, treasury: 20, food: 20, oil: 5, steel: 30, gold: 10,
    economicStrength: 15, militaryStrength: 60,
    description: 'An isolated nation with a large military relative to its economy.'
  },
  {
    code: 'AUS', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', lat: -35.3, lng: 149.1,
    population: 26, treasury: 70, food: 50, oil: 30, steel: 30, gold: 50,
    economicStrength: 65, militaryStrength: 40,
    description: 'A resource-rich continent nation with a stable economy.'
  },
  {
    code: 'NGA', name: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}', lat: 9.06, lng: 7.49,
    population: 218, treasury: 40, food: 60, oil: 70, steel: 10, gold: 15,
    economicStrength: 40, militaryStrength: 45,
    description: 'Africa\'s most populous nation with major oil reserves.'
  }
];

function countryByCode(code) {
  return DEFAULT_COUNTRIES.find((c) => c.code === code) || null;
}

// Difficulty modifiers applied to starting resources.
function difficultyModifier(difficulty) {
  switch (difficulty) {
    case 'easy': return 1.5;
    case 'hard': return 0.7;
    default: return 1.0;
  }
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

// List the authenticated user's games.
app.get('/api/games', authMiddleware, async (req, res) => {
  try {
    const games = await Game.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    // Enrich with selected country and country count.
    const enriched = await Promise.all(games.map(async (game) => {
      const player = await GamePlayer.findOne({ game: game._id, user: req.user._id }).lean();
      let country = null;
      if (player && player.country) {
        country = await GameCountry.findById(player.country).lean();
      }
      const countryCount = await GameCountry.countDocuments({ game: game._id });
      return {
        _id: game._id,
        name: game.name,
        mode: game.mode,
        startingYear: game.startingYear,
        currentYear: game.currentYear,
        currentTurn: game.currentTurn,
        difficulty: game.difficulty,
        tutorialEnabled: game.tutorialEnabled,
        tutorialCompleted: game.tutorialCompleted,
        status: game.status,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        countryCount,
        selectedCountry: country ? {
          _id: country._id, code: country.code, name: country.name, flag: country.flag,
          owner: country.owner
        } : null,
      };
    }));

    res.json({ games: enriched });
  } catch (err) {
    console.error('List games error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new game and initialise all countries.
app.post('/api/games', authMiddleware, async (req, res) => {
  const { name, mode, startingYear, difficulty, tutorialEnabled } = req.body || {};

  if (!name || String(name).trim().length === 0) {
    return res.status(400).json({ error: 'Game name is required' });
  }
  if (mode && mode !== 'single_player') {
    return res.status(400).json({ error: 'Only single_player mode is supported yet' });
  }
  const year = parseInt(startingYear, 10);
  if (!year || year < 1 || year > 2100) {
    return res.status(400).json({ error: 'Starting year must be between 1 and 2100' });
  }
  if (difficulty && !['easy', 'normal', 'hard'].includes(difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const game = await Game.create([{
      name: String(name).trim(),
      owner: req.user._id,
      mode: mode || 'single_player',
      startingYear: year,
      currentYear: year,
      currentTurn: 1,
      difficulty: difficulty || 'normal',
      tutorialEnabled: tutorialEnabled !== false,
      status: 'country_selection',
    }], { session });

    const mod = difficultyModifier(game[0].difficulty);

    const countryDocs = DEFAULT_COUNTRIES.map((c) => ({
      game: game[0]._id,
      code: c.code,
      name: c.name,
      flag: c.flag,
      lat: c.lat,
      lng: c.lng,
      owner: null,
      ownerUsername: '',
      basePopulation: c.population,
      baseTreasury: Math.round(c.treasury * mod),
      baseFood: Math.round(c.food * mod),
      baseOil: Math.round(c.oil * mod),
      baseSteel: Math.round(c.steel * mod),
      baseGold: Math.round(c.gold * mod),
      baseEconomicStrength: c.economicStrength,
      baseMilitaryStrength: c.militaryStrength,
      description: c.description,
      population: c.population,
      treasury: Math.round(c.treasury * mod),
      food: Math.round(c.food * mod),
      oil: Math.round(c.oil * mod),
      steel: Math.round(c.steel * mod),
      gold: Math.round(c.gold * mod),
      economicStrength: c.economicStrength,
      militaryStrength: c.militaryStrength,
    }));

    await GameCountry.insertMany(countryDocs, { session, ordered: false });
    await session.commitTransaction();

    res.status(201).json({
      game: {
        _id: game[0]._id,
        name: game[0].name,
        status: game[0].status,
        startingYear: game[0].startingYear,
        difficulty: game[0].difficulty,
        tutorialEnabled: game[0].tutorialEnabled,
      },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A game with this name already exists' });
    }
    console.error('Create game error:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    session.endSession();
  }
});

// Get a single game (owner only).
app.get('/api/games/:id', authMiddleware, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, owner: req.user._id }).lean();
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const countries = await GameCountry.find({ game: game._id }).sort({ name: 1 }).lean();
    const player = await GamePlayer.findOne({ game: game._id, user: req.user._id }).lean();

    res.json({
      game: {
        _id: game._id, name: game.name, mode: game.mode,
        startingYear: game.startingYear, currentYear: game.currentYear,
        currentTurn: game.currentTurn, difficulty: game.difficulty,
        tutorialEnabled: game.tutorialEnabled, tutorialCompleted: game.tutorialCompleted,
        status: game.status, createdAt: game.createdAt, updatedAt: game.updatedAt,
      },
      countries: countries.map((c) => ({
        _id: c._id, code: c.code, name: c.name, flag: c.flag, lat: c.lat, lng: c.lng,
        owner: c.owner, ownerUsername: c.ownerUsername,
        population: c.population, treasury: c.treasury, food: c.food, oil: c.oil,
        steel: c.steel, gold: c.gold, economicStrength: c.economicStrength,
        militaryStrength: c.militaryStrength, description: c.description,
      })),
      selectedCountry: player && player.country ? await GameCountry.findById(player.country).lean() : null,
    });
  } catch (err) {
    console.error('Get game error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// List default country templates (for the map client).
app.get('/api/countries', authMiddleware, async (req, res) => {
  try {
    res.json({ countries: DEFAULT_COUNTRIES });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List countries for a game with current ownership.
app.get('/api/games/:id/countries', authMiddleware, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, owner: req.user._id }).lean();
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const countries = await GameCountry.find({ game: game._id }).sort({ name: 1 }).lean();
    res.json({
      gameId: game._id,
      status: game.status,
      countries: countries.map((c) => ({
        _id: c._id, code: c.code, name: c.name, flag: c.flag, lat: c.lat, lng: c.lng,
        owner: c.owner, ownerUsername: c.ownerUsername,
        isAvailable: !c.owner,
        isOwnedByMe: c.owner && c.owner.toString() === req.user._id.toString(),
      })),
    });
  } catch (err) {
    console.error('List game countries error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Select a country for the current game.
app.post('/api/games/:id/select-country', authMiddleware, async (req, res) => {
  const { countryCode } = req.body || {};
  if (!countryCode) {
    return res.status(400).json({ error: 'Country code is required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const game = await Game.findOne({ _id: req.params.id, owner: req.user._id }).session(session);
    if (!game) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Game not found' });
    }
    if (game.status !== 'country_selection') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Country selection is closed for this game' });
    }

    const country = await GameCountry.findOne({ game: req.params.id, code: countryCode }).session(session);
    if (!country) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Country not found' });
    }

    // Each country can only have one player owner per game.
    if (country.owner && country.owner.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(409).json({ error: 'Country already taken by another player' });
    }

    // Assign (or re-affirm) ownership. Permanent unless the game is restarted.
    country.owner = req.user._id;
    country.ownerUsername = req.user.username;
    await country.save({ session });

    let player = await GamePlayer.findOne({ game: req.params.id, user: req.user._id }).session(session);
    if (player) {
      player.country = country._id;
      await player.save({ session });
    } else {
      player = await GamePlayer.create([{
        game: req.params.id,
        user: req.user._id,
        country: country._id,
      }], { session });
    }

    await session.commitTransaction();

    const fresh = await GameCountry.findById(country._id).lean();
    res.json({
      ok: true,
      country: { _id: fresh._id, code: fresh.code, name: fresh.name, owner: fresh.owner },
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    console.error('Select country error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Country already selected' });
    }
    res.status(500).json({ error: 'Server error' });
  } finally {
    session.endSession();
  }
});

// Confirm selection and start the game.
app.post('/api/games/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, owner: req.user._id });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.status === 'active') {
      return res.status(400).json({ error: 'Game is already active' });
    }
    if (game.status !== 'country_selection') {
      return res.status(400).json({ error: 'Game is not in country selection' });
    }

    const player = await GamePlayer.findOne({ game: req.params.id, user: req.user._id });
    if (!player || !player.country) {
      return res.status(400).json({ error: 'No country selected' });
    }

    const country = await GameCountry.findById(player.country);
    if (!country || !country.owner) {
      return res.status(400).json({ error: 'Selected country is not assigned' });
    }

    game.status = 'active';
    game.currentYear = game.startingYear;
    game.currentTurn = 1;
    await game.save();

    // Initialise tutorial progress for this game if enabled.
    if (game.tutorialEnabled) {
      await TutorialProgress.findOneAndUpdate(
        { user: req.user._id, game: game._id },
        { $setOnInsert: { stage: 1, completed: false, seenStages: [1] } },
        { upsert: true }
      );
    }

    res.json({
      ok: true,
      game: { _id: game._id, status: game.status, currentYear: game.currentYear, currentTurn: game.currentTurn },
      country: {
        _id: country._id, code: country.code, name: country.name, flag: country.flag,
        population: country.population, treasury: country.treasury, food: country.food,
        oil: country.oil, steel: country.steel, gold: country.gold,
        economicStrength: country.economicStrength, militaryStrength: country.militaryStrength,
        description: country.description,
      },
    });
  } catch (err) {
    console.error('Confirm game error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get gameplay state for the active game.
app.get('/api/games/:id/play', authMiddleware, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, owner: req.user._id }).lean();
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    const player = await GamePlayer.findOne({ game: req.params.id, user: req.user._id }).lean();
    if (!player || !player.country) {
      return res.status(400).json({ error: 'No country assigned' });
    }

    const country = await GameCountry.findById(player.country).lean();

    res.json({
      game: { _id: game._id, name: game.name, currentYear: game.currentYear, currentTurn: game.currentTurn, difficulty: game.difficulty },
      country: {
        _id: country._id, code: country.code, name: country.name, flag: country.flag,
        population: country.population, treasury: country.treasury, food: country.food,
        oil: country.oil, steel: country.steel, gold: country.gold,
        economicStrength: country.economicStrength, militaryStrength: country.militaryStrength,
        description: country.description,
      },
    });
  } catch (err) {
    console.error('Get play state error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// End the current turn.
app.post('/api/games/:id/end-turn', authMiddleware, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, owner: req.user._id });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.status !== 'active') return res.status(400).json({ error: 'Game is not active' });

    const player = await GamePlayer.findOne({ game: req.params.id, user: req.user._id });
    const country = await GameCountry.findById(player.country);

    // Simple per-turn resource drift: income from economy, small consumption.
    const income = Math.floor(country.economicStrength * 0.5);
    const consumption = Math.floor(country.population * 0.1);
    country.treasury += income - consumption;
    if (country.treasury < 0) country.treasury = 0;

    game.currentTurn += 1;
    // Advance one year every 4 turns.
    if ((game.currentTurn - 1) % 4 === 0) game.currentYear += 1;
    await game.save();
    await country.save();

    res.json({
      ok: true,
      currentTurn: game.currentTurn,
      currentYear: game.currentYear,
      treasury: country.treasury,
    });
  } catch (err) {
    console.error('End turn error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Tutorial progress
// ---------------------------------------------------------------------------

app.get('/api/tutorial', authMiddleware, async (req, res) => {
  try {
    const { gameId } = req.query;
    const filter = { user: req.user._id };
    if (gameId) filter.game = gameId;
    const progress = await TutorialProgress.findOne(filter).lean();
    res.json({ progress: progress || { stage: 1, completed: false, seenStages: [1] } });
  } catch (err) {
    console.error('Get tutorial error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/tutorial', authMiddleware, async (req, res) => {
  const { gameId, stage, completed, seenStages } = req.body || {};
  if (!gameId) return res.status(400).json({ error: 'Game id is required' });

  const game = await Game.findOne({ _id: gameId, owner: req.user._id });
  if (!game) return res.status(404).json({ error: 'Game not found' });

  try {
    const progress = await TutorialProgress.findOneAndUpdate(
      { user: req.user._id, game: gameId },
      {
        $set: {
          stage: stage != null ? stage : 1,
          completed: completed === true,
          completedAt: completed === true ? new Date() : undefined,
        },
        $addToSet: seenStages && Array.isArray(seenStages) ? { seenStages: { $each: seenStages } } : {},
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    if (completed === true) {
      await Game.updateOne({ _id: gameId }, { tutorialCompleted: true });
    }

    res.json({ ok: true, progress });
  } catch (err) {
    console.error('Save tutorial error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/tutorial/reset', authMiddleware, async (req, res) => {
  const { gameId } = req.body || {};
  const filter = { user: req.user._id };
  if (gameId) filter.game = gameId;
  try {
    await TutorialProgress.deleteMany(filter);
    res.json({ ok: true });
  } catch (err) {
    console.error('Reset tutorial error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  try {
    const decoded = jwt.decode(req.token);
    if (decoded?.jti) denylist.set(decoded.jti, Date.now() + 24 * 60 * 60 * 1000);
  } catch (e) {}
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Era of Empires API listening on http://127.0.0.1:${PORT}`);
});
