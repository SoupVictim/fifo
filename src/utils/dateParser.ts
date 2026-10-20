export interface ParsedExpiryResult {
  isoDate: string; // YYYY-MM-DD
  matchedText: string;
  confidence: 'high' | 'medium';
}

const MONTH_LOOKUP: Record<string, number> = {
  JAN: 1,
  JANUARY: 1,
  FEB: 2,
  FEBRUARY: 2,
  MAR: 3,
  MARCH: 3,
  APR: 4,
  APRIL: 4,
  MAY: 5,
  JUN: 6,
  JUNE: 6,
  JUL: 7,
  JULY: 7,
  AUG: 8,
  AUGUST: 8,
  SEP: 9,
  SEPT: 9,
  SEPTEMBER: 9,
  OCT: 10,
  OCTOBER: 10,
  NOV: 11,
  NOVEMBER: 11,
  DEC: 12,
  DECEMBER: 12,
};

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayIso(): string {
  return toIsoDateString(new Date());
}

export function addDaysToIso(isoDate: string, deltaDays: number): string {
  const parts = isoDate.split('-').map(Number);
  const d =
    parts.length === 3 && !parts.some(isNaN)
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date();
  d.setDate(d.getDate() + deltaDays);
  return toIsoDateString(d);
}

export function getDaysRemaining(isoDate: string): number {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const targetMidnight = new Date(parts[0], parts[1] - 1, parts[2]);
  const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatReadableDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}

export interface UrgencyRingTheme {
  strokeColor: string;
  trackColor: string;
  bgTint: string;
  textColor: string;
  shortText: string;
  statusLabel: string;
  progress: number;
}

export function getExpiryCircleTheme(
  daysRemaining: number,
  isFrozen: boolean
): UrgencyRingTheme {
  if (daysRemaining < 0) {
    return {
      strokeColor: '#E11D48',
      trackColor: '#FFE4E6',
      bgTint: '#FFF1F2',
      textColor: '#BE123C',
      shortText: `${Math.abs(daysRemaining)}d ago`,
      statusLabel: 'Expired',
      progress: 1,
    };
  }
  if (daysRemaining === 0) {
    return {
      strokeColor: '#E11D48',
      trackColor: '#FFE4E6',
      bgTint: '#FFF1F2',
      textColor: '#BE123C',
      shortText: 'Today',
      statusLabel: 'Use Today',
      progress: 0.95,
    };
  }
  if (daysRemaining === 1) {
    return {
      strokeColor: '#F43F5E',
      trackColor: '#FFE4E6',
      bgTint: '#FFF1F2',
      textColor: '#E11D48',
      shortText: '1d',
      statusLabel: 'Tomorrow',
      progress: 0.85,
    };
  }
  if (daysRemaining <= 3) {
    return {
      strokeColor: '#F59E0B',
      trackColor: '#FEF3C7',
      bgTint: '#FFFBEB',
      textColor: '#B45309',
      shortText: `${daysRemaining}d`,
      statusLabel: `${daysRemaining} days left`,
      progress: Math.max(0.35, 1 - daysRemaining / 7),
    };
  }
  if (isFrozen) {
    return {
      strokeColor: '#0284C7',
      trackColor: '#E0F2FE',
      bgTint: '#F0F9FF',
      textColor: '#0369A1',
      shortText: `${daysRemaining}d`,
      statusLabel: `${daysRemaining} days left`,
      progress: Math.min(0.85, Math.max(0.25, daysRemaining / 90)),
    };
  }
  return {
    strokeColor: '#10B981',
    trackColor: '#D1FAE5',
    bgTint: '#ECFDF5',
    textColor: '#047857',
    shortText: `${daysRemaining}d`,
    statusLabel: `${daysRemaining} days left`,
    progress: Math.min(0.9, Math.max(0.3, daysRemaining / 14)),
  };
}

function normalizeYear(rawYear?: string): number {
  const currentYear = new Date().getFullYear();
  if (!rawYear) return currentYear;
  const num = parseInt(rawYear, 10);
  if (rawYear.length === 2) {
    return 2000 + num;
  }
  return num;
}

function buildValidDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 2024 || year > 2038) return null;
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  return candidate;
}

/**
 * Corrects common dot-matrix OCR misreads inside numeric date tokens
 * (e.g. "24/1O/26" -> "24/10/26", "O5.11.2026" -> "05.11.2026").
 */
function cleanOcrNumericNoise(line: string): string {
  return line
    .replace(/(?<=\d)[ODQ](?=\d|[./\s-])/g, '0')
    .replace(/(?:^|(?<=[./\s-]))[ODQ](?=\d)/g, '0')
    .replace(/(?<=\d)[IL|](?=\d|[./\s-])/g, '1')
    .replace(/(?:^|(?<=[./\s-]))[IL|](?=\d)/g, '1');
}

/**
 * Parses raw OCR text from food packaging to extract expiry / best before dates.
 * Supports:
 * - "USE BY 24 OCT 2026", "BB 24 NOV 26", "EXP: 14 DEC", "24OCT26"
 * - "24/10/2026", "24.10.26", "24-10-2026", "24 10 26"
 * - "BEST BEFORE END NOV 2026", "11/2026"
 * - ISO "2026-10-24"
 */
export function parseExpiryDateFromText(rawText: string): ParsedExpiryResult | null {
  if (!rawText || !rawText.trim()) return null;

  const lines = rawText
    .toUpperCase()
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Also include a joined single-line version in case OCR split "24" and "OCT 2026" across lines
  const allCandidates = [...lines, lines.join(' ')];

  const filtered = allCandidates.filter(
    (l) => !/^(MFG|PROD|PACKED|PKD)\b/.test(l) || /(EXP|BB|BEST|USE\s*BY)/.test(l)
  );

  const searchPool = filtered.length > 0 ? filtered : allCandidates;

  const prioritized = [...searchPool].sort((a, b) => {
    const aHasKeyword = /(EXP|BB|BEST\s*BEFORE|USE\s*BY|DISPLAY\s*UNTIL)/.test(a) ? 1 : 0;
    const bHasKeyword = /(EXP|BB|BEST\s*BEFORE|USE\s*BY|DISPLAY\s*UNTIL)/.test(b) ? 1 : 0;
    return bHasKeyword - aHasKeyword;
  });

  for (const rawLine of prioritized) {
    const line = cleanOcrNumericNoise(rawLine);
    const hasKeyword = /(EXP|BB|BEST\s*BEFORE|USE\s*BY|DISPLAY\s*UNTIL)/.test(line);

    // 1. DD MMM YYYY or DD MMM YY or DD MMM (also supports compact "24OCT26" or "24 OCT")
    const alphaMatch = line.match(
      /\b(\d{1,2})[\s./-]*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*(?:[\s./,-]*(\d{2,4}))?\b/
    );
    if (alphaMatch) {
      const day = parseInt(alphaMatch[1], 10);
      const month = MONTH_LOOKUP[alphaMatch[2]];
      let year = normalizeYear(alphaMatch[3]);
      let dateObj = buildValidDate(year, month, day);
      if (dateObj && !alphaMatch[3]) {
        const diffDays = (dateObj.getTime() - Date.now()) / (1000 * 3600 * 24);
        if (diffDays < -30) {
          year += 1;
          dateObj = buildValidDate(year, month, day);
        }
      }
      if (dateObj) {
        return {
          isoDate: toIsoDateString(dateObj),
          matchedText: alphaMatch[0].trim(),
          confidence: 'high',
        };
      }
    }

    // 2. MMM DD YYYY (e.g., "OCT 24 2026" or "NOV 15, 26")
    const monthFirstMatch = line.match(
      /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*[\s./-]+(\d{1,2})(?:[\s./,-]+(\d{2,4}))?\b/
    );
    if (monthFirstMatch) {
      const month = MONTH_LOOKUP[monthFirstMatch[1]];
      const day = parseInt(monthFirstMatch[2], 10);
      let year = normalizeYear(monthFirstMatch[3]);
      let dateObj = buildValidDate(year, month, day);
      if (dateObj && !monthFirstMatch[3]) {
        const diffDays = (dateObj.getTime() - Date.now()) / (1000 * 3600 * 24);
        if (diffDays < -30) {
          year += 1;
          dateObj = buildValidDate(year, month, day);
        }
      }
      if (dateObj) {
        return {
          isoDate: toIsoDateString(dateObj),
          matchedText: monthFirstMatch[0].trim(),
          confidence: 'high',
        };
      }
    }

    // 3. ISO YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
    const isoMatch = line.match(/\b(20\d{2})[\s./-]+(\d{1,2})[\s./-]+(\d{1,2})\b/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      const dateObj = buildValidDate(year, month, day);
      if (dateObj) {
        return {
          isoDate: toIsoDateString(dateObj),
          matchedText: isoMatch[0],
          confidence: 'high',
        };
      }
    }

    // 4. Numeric DD/MM/YYYY or DD.MM.YY or DD-MM-YYYY or DD MM YY
    const numMatch = line.match(/\b(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{2,4})\b/);
    if (numMatch) {
      const first = parseInt(numMatch[1], 10);
      const second = parseInt(numMatch[2], 10);
      const year = normalizeYear(numMatch[3]);

      let day = first;
      let month = second;
      if (second > 12 && first <= 12) {
        month = first;
        day = second;
      }

      const dateObj = buildValidDate(year, month, day);
      if (dateObj) {
        return {
          isoDate: toIsoDateString(dateObj),
          matchedText: numMatch[0],
          confidence: hasKeyword ? 'high' : 'medium',
        };
      }
    }

    // 5. Short DD/MM (without year, e.g. "USE BY 25/10" or "25.10")
    const shortSlashMatch = line.match(/\b(\d{1,2})[./](\d{1,2})\b/);
    if (shortSlashMatch && hasKeyword) {
      const day = parseInt(shortSlashMatch[1], 10);
      const month = parseInt(shortSlashMatch[2], 10);
      let year = new Date().getFullYear();
      let dateObj = buildValidDate(year, month, day);
      if (dateObj && (dateObj.getTime() - Date.now()) / (1000 * 3600 * 24) < -30) {
        year += 1;
        dateObj = buildValidDate(year, month, day);
      }
      if (dateObj) {
        return {
          isoDate: toIsoDateString(dateObj),
          matchedText: shortSlashMatch[0],
          confidence: 'medium',
        };
      }
    }
  }

  return null;
}
