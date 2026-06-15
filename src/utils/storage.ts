const STORAGE_KEYS = {
  RESERVATIONS: 'room-scheduler-reservations',
  ROOMS: 'room-scheduler-rooms',
  BLACKLIST: 'room-scheduler-blacklist',
  LOGS: 'room-scheduler-logs',
  CURRENT_USER: 'room-scheduler-current-user',
};

export const storage = {
  getReservations: <T>(): T[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setReservations: <T>(data: T[]): void => {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(data));
  },

  getRooms: <T>(): T[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROOMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setRooms: <T>(data: T[]): void => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(data));
  },

  getBlacklist: <T>(): T[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BLACKLIST);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setBlacklist: <T>(data: T[]): void => {
    localStorage.setItem(STORAGE_KEYS.BLACKLIST, JSON.stringify(data));
  },

  getLogs: <T>(): T[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setLogs: <T>(data: T[]): void => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data));
  },

  getCurrentUser: <T>(): T | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser: <T>(data: T): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data));
  },

  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};
