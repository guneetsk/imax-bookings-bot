const nodemailer = require('nodemailer');
const config = require('./config');

function buildEmailHtml(shows) {
  const rows = shows.map(s => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">${s.date.slice(0,4)}-${s.date.slice(4,6)}-${s.date.slice(6)}</td>
      <td style="padding:8px;border:1px solid #ddd"><strong>${s.time}</strong></td>
      <td style="padding:8px;border:1px solid #ddd">${s.screenName}</td>
      <td style="padding:8px;border:1px solid #ddd">${s.status}</td>
      <td style="padding:8px;border:1px solid #ddd">Rs ${s.minPrice} - ${s.maxPrice}</td>
      <td style="padding:8px;border:1px solid #ddd"><a href="${s.bookingUrl}" style="color:#e23744;font-weight:bold">Book Now</a></td>
    </tr>
  `).join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#e23744">IMAX Booking Alert: ${config.target.movieName}</h2>
      <p><strong>${config.target.venueName}</strong></p>
      <p>${shows.length} IMAX show(s) now available for booking!</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr style="background:#f5f5f5">
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Date</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Time</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Screen</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Status</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Price</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Link</th>
        </tr>
        ${rows}
      </table>
      <p style="color:#666;font-size:12px">Sent by IMAX Bookings Bot</p>
    </div>
  `;
}

async function sendAlert(shows) {
  if (!config.email.appPassword) {
    throw new Error('GMAIL_APP_PASSWORD not set in C:\\credentials\\.env');
  }

  const transporter = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: false,
    auth: {
      user: config.email.from,
      pass: config.email.appPassword,
    },
  });

  const info = await transporter.sendMail({
    from: `"IMAX Bot" <${config.email.from}>`,
    to: config.email.to,
    subject: `IMAX Alert: ${config.target.movieName} - ${shows.length} show(s) open!`,
    html: buildEmailHtml(shows),
  });

  console.log(`Email sent: ${info.messageId}`);
  return info;
}

module.exports = { sendAlert };
