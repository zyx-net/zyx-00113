import { create } from 'zustand';
import { Reservation, Room, BlacklistItem, LogEntry, User, FilterOptions } from '../types';
import { storage } from '../utils/storage';
import { generateId, detectConflicts, getReservationsWithConflictInfo } from '../utils/helpers';
import { initialRooms, initialReservations, initialBlacklist, initialLogs, initialAdminUser, initialNormalUser } from '../data/initialData';

interface StoreState {
  reservations: Reservation[];
  rooms: Room[];
  blacklist: BlacklistItem[];
  logs: LogEntry[];
  currentUser: User;
  filters: FilterOptions;
  isAdminMode: boolean;
}

interface StoreActions {
  initData: () => void;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'conflictId'>) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  cancelReservation: (id: string) => void;
  rescheduleReservation: (id: string, newStartTime: string, newEndTime: string) => boolean;
  addRemark: (id: string, remark: string) => void;
  lockRoom: (roomId: string) => boolean;
  unlockRoom: (roomId: string) => boolean;
  addToBlacklist: (organizerName: string, reason: string) => void;
  removeFromBlacklist: (id: string) => void;
  setFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;
  addLog: (action: LogEntry['action'], targetType: LogEntry['targetType'], targetId: string, detail: string) => void;
  switchUserRole: (isAdmin: boolean) => void;
  getFilteredReservations: () => Reservation[];
  getConflictReservations: () => Reservation[];
}

const useStore = create<StoreState & StoreActions>((set, get) => ({
  reservations: [],
  rooms: [],
  blacklist: [],
  logs: [],
  currentUser: initialAdminUser,
  filters: {
    roomId: null,
    status: null,
    organizer: null,
    startDate: null,
    endDate: null,
  },
  isAdminMode: true,

  initData: () => {
    let storedReservations = storage.getReservations<Reservation>();
    let storedRooms = storage.getRooms<Room>();
    let storedBlacklist = storage.getBlacklist<BlacklistItem>();
    let storedLogs = storage.getLogs<LogEntry>();
    let storedUser = storage.getCurrentUser<User>();

    if (storedReservations.length === 0) {
      storedReservations = initialReservations;
    }
    if (storedRooms.length === 0) {
      storedRooms = initialRooms;
    }
    if (storedBlacklist.length === 0) {
      storedBlacklist = initialBlacklist;
    }
    if (storedLogs.length === 0) {
      storedLogs = initialLogs;
    }
    if (!storedUser) {
      storedUser = initialAdminUser;
    }

    const conflictGroups = detectConflicts(storedReservations);
    const reservationsWithConflict = getReservationsWithConflictInfo(storedReservations, conflictGroups);

    set({
      reservations: reservationsWithConflict,
      rooms: storedRooms,
      blacklist: storedBlacklist,
      logs: storedLogs,
      currentUser: storedUser,
      isAdminMode: storedUser.role === 'admin',
    });

    storage.setReservations(reservationsWithConflict);
    storage.setRooms(storedRooms);
    storage.setBlacklist(storedBlacklist);
    storage.setLogs(storedLogs);
    storage.setCurrentUser(storedUser);
  },

  addReservation: (reservation) => {
    const { reservations, rooms, blacklist } = get();
    
    const room = rooms.find(r => r.id === reservation.roomId);
    if (!room) {
      console.error('Room not found');
      return;
    }

    if (room.isLocked) {
      console.error('Room is locked');
      return;
    }

    const isBlacklisted = blacklist.some(b => b.organizerName === reservation.organizer);
    if (isBlacklisted) {
      console.error('Organizer is blacklisted');
      return;
    }

    const newReservation: Reservation = {
      ...reservation,
      id: generateId(),
      roomName: room.name,
      conflictId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedReservations = [...reservations, newReservation];
    const conflictGroups = detectConflicts(updatedReservations);
    const reservationsWithConflict = getReservationsWithConflictInfo(updatedReservations, conflictGroups);

    set({ reservations: reservationsWithConflict });
    storage.setReservations(reservationsWithConflict);

    get().addLog('create', 'reservation', newReservation.id, 
      `创建预约: ${room.name} - ${reservation.organizer} (${new Date(reservation.startTime).toLocaleString('zh-CN')} - ${new Date(reservation.endTime).toLocaleString('zh-CN')})`);
  },

  updateReservation: (id, updates) => {
    const { reservations } = get();
    const updatedReservations = reservations.map(r => 
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    );
    
    const conflictGroups = detectConflicts(updatedReservations);
    const reservationsWithConflict = getReservationsWithConflictInfo(updatedReservations, conflictGroups);

    set({ reservations: reservationsWithConflict });
    storage.setReservations(reservationsWithConflict);

    get().addLog('update', 'reservation', id, `更新预约: ${id}`);
  },

  cancelReservation: (id) => {
    const { reservations } = get();
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;

    const updatedReservations = reservations.map(r => 
      r.id === id ? { ...r, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : r
    );
    
    const conflictGroups = detectConflicts(updatedReservations);
    const reservationsWithConflict = getReservationsWithConflictInfo(updatedReservations, conflictGroups);

    set({ reservations: reservationsWithConflict });
    storage.setReservations(reservationsWithConflict);

    get().addLog('cancel', 'reservation', id, 
      `取消预约: ${reservation.roomName} - ${reservation.organizer} (${new Date(reservation.startTime).toLocaleString('zh-CN')})`);
  },

  rescheduleReservation: (id, newStartTime, newEndTime) => {
    const { reservations } = get();
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return false;

    const existingReservations = reservations.filter(r => r.id !== id && r.status !== 'cancelled');
    const hasConflict = existingReservations.some(r => {
      const rStart = new Date(r.startTime).getTime();
      const rEnd = new Date(r.endTime).getTime();
      const newStart = new Date(newStartTime).getTime();
      const newEnd = new Date(newEndTime).getTime();
      return rStart < newEnd && newStart < rEnd;
    });

    if (hasConflict) {
      return false;
    }

    const updatedReservations = reservations.map(r => 
      r.id === id ? { 
        ...r, 
        startTime: newStartTime, 
        endTime: newEndTime, 
        status: 'rescheduled' as const, 
        updatedAt: new Date().toISOString() 
      } : r
    );
    
    const conflictGroups = detectConflicts(updatedReservations);
    const reservationsWithConflict = getReservationsWithConflictInfo(updatedReservations, conflictGroups);

    set({ reservations: reservationsWithConflict });
    storage.setReservations(reservationsWithConflict);

    get().addLog('reschedule', 'reservation', id, 
      `改期预约: ${reservation.roomName} - ${reservation.organizer} (${new Date(reservation.startTime).toLocaleString('zh-CN')} -> ${new Date(newStartTime).toLocaleString('zh-CN')})`);

    return true;
  },

  addRemark: (id, remark) => {
    const { reservations } = get();
    const updatedReservations = reservations.map(r => 
      r.id === id ? { ...r, remark, updatedAt: new Date().toISOString() } : r
    );

    set({ reservations: updatedReservations });
    storage.setReservations(updatedReservations);

    get().addLog('update', 'reservation', id, `添加备注: ${id}`);
  },

  lockRoom: (roomId) => {
    const { isAdminMode, rooms } = get();
    if (!isAdminMode) return false;

    const updatedRooms = rooms.map(r => 
      r.id === roomId ? { 
        ...r, 
        isLocked: true, 
        lockedBy: get().currentUser.name, 
        lockedAt: new Date().toISOString() 
      } : r
    );

    set({ rooms: updatedRooms });
    storage.setRooms(updatedRooms);

    const room = rooms.find(r => r.id === roomId);
    if (room) {
      get().addLog('lock', 'room', roomId, `锁定房间: ${room.name}`);
    }

    return true;
  },

  unlockRoom: (roomId) => {
    const { isAdminMode, rooms } = get();
    if (!isAdminMode) return false;

    const updatedRooms = rooms.map(r => 
      r.id === roomId ? { ...r, isLocked: false, lockedBy: '', lockedAt: null } : r
    );

    set({ rooms: updatedRooms });
    storage.setRooms(updatedRooms);

    const room = rooms.find(r => r.id === roomId);
    if (room) {
      get().addLog('unlock', 'room', roomId, `解锁房间: ${room.name}`);
    }

    return true;
  },

  addToBlacklist: (organizerName, reason) => {
    const { blacklist } = get();
    if (blacklist.some(b => b.organizerName === organizerName)) {
      return;
    }

    const newItem: BlacklistItem = {
      id: generateId(),
      organizerName,
      reason,
      addedAt: new Date().toISOString(),
    };

    const updatedBlacklist = [...blacklist, newItem];
    set({ blacklist: updatedBlacklist });
    storage.setBlacklist(updatedBlacklist);

    get().addLog('blacklist', 'blacklist', newItem.id, `添加黑名单: ${organizerName} - ${reason}`);
  },

  removeFromBlacklist: (id) => {
    const { blacklist } = get();
    const item = blacklist.find(b => b.id === id);
    if (!item) return;

    const updatedBlacklist = blacklist.filter(b => b.id !== id);
    set({ blacklist: updatedBlacklist });
    storage.setBlacklist(updatedBlacklist);

    get().addLog('unblacklist', 'blacklist', id, `移除黑名单: ${item.organizerName}`);
  },

  setFilters: (filters) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {
      roomId: null,
      status: null,
      organizer: null,
      startDate: null,
      endDate: null,
    }});
  },

  addLog: (action, targetType, targetId, detail) => {
    const { logs, currentUser } = get();
    const newLog: LogEntry = {
      id: generateId(),
      action,
      targetType,
      targetId,
      operator: currentUser.name,
      timestamp: new Date().toISOString(),
      detail,
    };

    const updatedLogs = [newLog, ...logs];
    set({ logs: updatedLogs });
    storage.setLogs(updatedLogs);
  },

  switchUserRole: (isAdmin) => {
    const user: User = isAdmin 
      ? { ...initialAdminUser } 
      : { ...initialNormalUser };
    
    set({ currentUser: user, isAdminMode: isAdmin });
    storage.setCurrentUser(user);
  },

  getFilteredReservations: () => {
    const { reservations, filters } = get();
    
    return reservations.filter(r => {
      if (filters.roomId && r.roomId !== filters.roomId) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.organizer && !r.organizer.includes(filters.organizer)) return false;
      if (filters.startDate) {
        const reservationDate = new Date(r.startTime).toDateString();
        const filterDate = new Date(filters.startDate).toDateString();
        if (reservationDate !== filterDate) return false;
      }
      if (filters.endDate) {
        const reservationDate = new Date(r.endTime).toDateString();
        const filterDate = new Date(filters.endDate).toDateString();
        if (reservationDate !== filterDate) return false;
      }
      return true;
    });
  },

  getConflictReservations: () => {
    const { reservations } = get();
    return reservations.filter(r => r.conflictId !== null && r.status !== 'cancelled');
  },
}));

export default useStore;
