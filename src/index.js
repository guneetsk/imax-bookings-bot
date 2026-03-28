const fs = require('fs');
const { checkAllDates } = require('./checker');
const { sendAlert } = require('./notifier');
const config = require('./config');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(config.stateFile, 'utf8'));
  } catch {
    return { notified: [] };
  }
}

function saveState(state) {
  fs.writeFileSync(config.stateFile, JSON.stringify(state, null, 2));
}

async function run() {
  console.log(`\n[${new Date().toISOString()}] IMAX Bookings Bot - checking...`);

  const shows = await checkAllDates();

  if (shows.length === 0) {
    console.log('No IMAX shows found. Will check again later.');
    return;
  }

  // Dedup: only alert for shows we haven't notified about yet
  const state = loadState();
  const newShows = shows.filter(s => {
    const key = `${s.date}-${s.dateTime}-${s.sessionId}`;
    return !state.notified.includes(key);
  });

  if (newShows.length === 0) {
    console.log(`Found ${shows.length} show(s) but already notified. Skipping email.`);
    return;
  }

  console.log(`\n${newShows.length} NEW IMAX show(s) found! Sending alert...`);
  newShows.forEach(s => {
    console.log(`  ${s.date} | ${s.time} | ${s.screenName} | ${s.status} | Rs ${s.minPrice}-${s.maxPrice}`);
  });

  try {
    await sendAlert(newShows);

    // Mark as notified
    const newKeys = newShows.map(s => `${s.date}-${s.dateTime}-${s.sessionId}`);
    state.notified.push(...newKeys);

    // Clean old entries (older than 14 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().slice(0, 10).replace(/-/g, '');
    state.notified = state.notified.filter(k => {
      const dateStr = k.split('-')[0];
      return dateStr >= cutoffStr;
    });

    saveState(state);
    console.log('Done! State saved.');
  } catch (err) {
    console.error(`Failed to send email: ${err.message}`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
