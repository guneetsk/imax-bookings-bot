// Load from centralized credentials file locally; on GitHub Actions env vars are injected directly
if (process.platform === 'win32') {
  require('dotenv').config({ path: 'C:\\credentials\\.env' });
}

module.exports = {
  // BookMyShow API
  bms: {
    baseUrl: 'https://in.bookmyshow.com/api/v3/mobile/showtimes',
    regionCode: 'NCR',
    appCode: 'WEB',
  },

  // Target screen
  target: {
    venueCode: 'PAEG',           // Gurugram Pepsi PVR Ambience (3rd floor, has IMAX)
    venueName: 'PVR Ambience Mall, Gurugram (IMAX)',
    movieName: 'Project Hail Mary',
    imaxEventCode: 'ET00481564', // Project Hail Mary (IMAX 2D)
    allEventCodes: [
      'ET00451760',  // Standard 2D
      'ET00481564',  // IMAX 2D
      'ET00487425',  // 4DX
    ],
    // We only care about IMAX
    targetDimension: 'IMAX',
  },

  // Email config
  email: {
    from: 'get.guneet@gmail.com',
    to: 'guneet.singh@wiom.in',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    appPassword: process.env.GMAIL_APP_PASSWORD_GET_GUNEET,
  },

  // How many days ahead to check
  daysToCheck: 7,

  // State file to track already-notified shows
  stateFile: require('path').join(__dirname, '..', 'state.json'),
};
