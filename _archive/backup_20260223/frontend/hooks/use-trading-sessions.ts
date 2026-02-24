'use client';

interface TradingSession {
  name: string;
  color: string;
  startUTC: number; // 0-23 hour
  endUTC: number; // 0-23 hour
  cities: string[];
}

// Major forex trading sessions (UTC times)
const SESSIONS: TradingSession[] = [
  {
    name: 'Sydney',
    color: '#22c55e', // Green
    startUTC: 0,
    endUTC: 9,
    cities: ['Sydney', 'Auckland', 'Melbourne'],
  },
  {
    name: 'Tokyo',
    color: '#06b6d4', // Cyan
    startUTC: 23, // 23:00 UTC (midnight)
    endUTC: 8,
    cities: ['Tokyo', 'Osaka', 'Hong Kong', 'Singapore', 'Shanghai'],
  },
  {
    name: 'London',
    color: '#8b5cf6', // Purple
    startUTC: 8,
    endUTC: 17,
    cities: ['London', 'Frankfurt', 'Paris', 'Zurich', 'Dubai'],
  },
  {
    name: 'New York',
    color: '#f5a623', // Gold
    startUTC: 13,
    endUTC: 22,
    cities: ['New York', 'Los Angeles', 'Chicago', 'Toronto'],
  },
];

export function useTradingSessions() {
  const getCurrentSession = (): TradingSession[] => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const currentTime = utcHour + utcMinute / 60;

    return SESSIONS.filter((session) => {
      // Handle sessions that wrap midnight (like Tokyo: 23:00-08:00)
      if (session.startUTC > session.endUTC) {
        return currentTime >= session.startUTC || currentTime < session.endUTC;
      } else {
        return currentTime >= session.startUTC && currentTime < session.endUTC;
      }
    });
  };

  const isSessionActive = (session: TradingSession): boolean => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const currentTime = utcHour + utcMinute / 60;

    if (session.startUTC > session.endUTC) {
      return currentTime >= session.startUTC || currentTime < session.endUTC;
    } else {
      return currentTime >= session.startUTC && currentTime < session.endUTC;
    }
  };

  const getSessionProgress = (session: TradingSession): number => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const currentTime = utcHour + utcMinute / 60;

    let sessionStart = session.startUTC;
    let sessionDuration = session.endUTC - session.startUTC;

    // Handle wrap-around
    if (session.startUTC > session.endUTC) {
      sessionDuration = (24 - session.startUTC) + session.endUTC;
    }

    let elapsed = currentTime - sessionStart;
    if (elapsed < 0) {
      elapsed += 24; // Handle wrap-around
    }

    return Math.min(elapsed / sessionDuration, 1);
  };

  const activeSessions = getCurrentSession();

  return {
    activeSessions,
    isSessionActive,
    getSessionProgress,
    allSessions: SESSIONS,
  };
}

export type { TradingSession };
