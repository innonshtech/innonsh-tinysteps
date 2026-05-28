const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function main() {
  const MONGO_URI = process.env.MONGODB_URI;
  if (!MONGO_URI) {
    console.error('MONGODB_URI not set in .env.local');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const SettingsSchema = new mongoose.Schema({}, { strict: false });
  const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema, 'settings');

  const s = await Settings.findOne();
  if (!s) {
    // create default settings doc
    const doc = new Settings({ featureFlags: { enableClaudeHaiku45: true } });
    await doc.save();
    console.log('Created settings with Claude Haiku 4.5 enabled');
  } else {
    s.featureFlags = s.featureFlags || {};
    s.featureFlags.enableClaudeHaiku45 = true;
    await s.save();
    console.log('Updated settings: enabled Claude Haiku 4.5');
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
