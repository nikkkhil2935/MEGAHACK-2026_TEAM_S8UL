/**
 * Generate ICS (iCalendar) file content
 * Can be saved as .ics and imported into any calendar app
 */
export function generateICS({
  title,
  description,
  start, // ISO string or Date
  duration = 60, // minutes
  location = 'Online - CareerBridge AI',
  attendees = []
}) {
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + duration * 60000);

  // Format dates to ICS format (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  };

  const uid = `${Date.now()}@careerbridge.ai`;
  const dtstamp = formatICSDate(new Date());
  const dtstart = formatICSDate(startDate);
  const dtend = formatICSDate(endDate);

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CareerBridge AI//Mock Interview//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:CareerBridge Interviews
X-WR-TIMEZONE:UTC
X-WR-CALDESC:AI Mock Interview Schedule
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE`;

  attendees.forEach((email) => {
    ics += `\nATTENDEE:mailto:${email}`;
  });

  ics += `
END:VEVENT
END:VCALENDAR`;

  return ics;
}

/**
 * Download ICS file to user's device
 */
export function downloadICS(filename, icsContent) {
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date) {
  const d = new Date(date);
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fullDate = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return { date: fullDate, time };
}

/**
 * Get next available interview slot
 */
export function getNextInterviewSlot() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow;
}

/**
 * Generate meeting link via Jitsi (free, no auth required)
 */
export function generateMeetingLink() {
  const uuid = Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
  return `https://meet.jit.si/CareerBridge-${uuid}`;
}
