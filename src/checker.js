const { execFileSync } = require('child_process');
const config = require('./config');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function curlGet(url) {
  const result = execFileSync('curl', [
    '-s', url,
    '-H', `User-Agent: ${USER_AGENT}`,
    '-H', 'Accept: application/json',
  ], { encoding: 'utf8', timeout: 15000 });
  return JSON.parse(result);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function buildBookingUrl(dateCode) {
  return `https://in.bookmyshow.com/national-capital-region-ncr/movies/project-hail-mary-imax-2d/ET00481564/${dateCode}`;
}

async function checkVenueForDate(dateCode) {
  const url = `${config.bms.baseUrl}/byvenue?venueCode=${config.target.venueCode}&regionCode=${config.bms.regionCode}&dateCode=${dateCode}&appCode=${config.bms.appCode}`;

  let data;
  try {
    data = curlGet(url);
  } catch (err) {
    console.log(`  [${dateCode}] Request failed: ${err.message}`);
    return [];
  }
  const details = data.ShowDetails || [];
  const imaxShows = [];

  for (const day of details) {
    const events = day.Event || [];
    for (const event of events) {
      const children = event.ChildEvents || [];
      for (const child of children) {
        const dimension = child.EventDimension || '';
        const eventCode = child.EventCode || '';

        // Match IMAX version of Project Hail Mary
        const isImax = dimension.toUpperCase().includes('IMAX');
        const isTargetMovie = eventCode === config.target.imaxEventCode ||
          config.target.allEventCodes.includes(eventCode);

        if (isImax && isTargetMovie) {
          const showTimes = child.ShowTimes || [];
          for (const show of showTimes) {
            if (show.AvailStatus !== '0') { // Not sold out
              imaxShows.push({
                date: dateCode,
                time: show.ShowTime,
                dateTime: show.ShowDateTime,
                sessionId: show.SessionId,
                status: show.AvailStatus === '1' ? 'Available' : show.AvailStatus === '2' ? 'Fast Filling' : 'Unknown',
                minPrice: show.MinPrice,
                maxPrice: show.MaxPrice,
                screenName: show.ScreenName || 'IMAX',
                bookingUrl: buildBookingUrl(dateCode),
                eventName: child.EventName,
              });
            }
          }
        }
      }
    }
  }

  return imaxShows;
}

async function checkAllDates() {
  const dateCode = config.target.targetDate;
  console.log(`Checking ${config.target.venueName} for "${config.target.movieName}" IMAX on ${dateCode}...`);

  try {
    const shows = await checkVenueForDate(dateCode);
    if (shows.length > 0) {
      console.log(`  [${dateCode}] Found ${shows.length} IMAX show(s)!`);
    } else {
      console.log(`  [${dateCode}] No IMAX shows`);
    }
    return shows;
  } catch (err) {
    console.error(`  [${dateCode}] Error: ${err.message}`);
    return [];
  }
}

module.exports = { checkAllDates };
