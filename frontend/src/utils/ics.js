// Builds RFC 5545 (.ics) calendar files client-side — no backend involved,
// this is pure text formatting from data already on the page.

function escapeText(s = '') {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// RFC 5545 §3.1: content lines longer than 75 octets must be folded, with
// each continuation line starting with a single space.
function foldLine(line) {
  if (line.length <= 75) return line;
  let result = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length) {
    result += '\r\n ' + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return result;
}

const pad = (n) => String(n).padStart(2, '0');

function formatUtc(date) {
  const d = new Date(date);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

const ALARM_TRIGGER = { 3: '-P3D', 1: '-P1D', 0: 'PT0M' };

/**
 * @param {{id:string, title:string, org:string, summary?:string, url?:string, deadline:string}[]} opportunities
 * @param {number[]} remindAt - subset of [3, 1, 0], matching the app's own reminder settings
 */
export function buildDeadlineICS(opportunities, remindAt = [3, 1, 0]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BuildHer Compass//Opportunity Deadlines//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const stamp = formatUtc(new Date());

  for (const o of opportunities) {
    if (!o.deadline) continue;

    const descParts = [o.org, o.summary].filter(Boolean).join(' — ');
    const description = o.url ? `${descParts}\n\nApply: ${o.url}` : descParts;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${o.id}@buildhercompass.app`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${formatUtc(o.deadline)}`);
    lines.push(`SUMMARY:${escapeText(`Deadline: ${o.title}`)}`);
    lines.push(`DESCRIPTION:${escapeText(description)}`);
    if (o.url) lines.push(`URL:${o.url}`);

    for (const n of remindAt) {
      const trigger = ALARM_TRIGGER[n];
      if (!trigger) continue;
      lines.push('BEGIN:VALARM');
      lines.push(`TRIGGER:${trigger}`);
      lines.push('ACTION:DISPLAY');
      lines.push(
        `DESCRIPTION:${escapeText(`${o.title} closes ${n === 0 ? 'today' : `in ${n} day${n > 1 ? 's' : ''}`}`)}`
      );
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function downloadICS(filename, icsText) {
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
