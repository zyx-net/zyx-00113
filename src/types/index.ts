export interface Reservation {
  id: string;
  roomId: string;
  roomName: string;
  organizer: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
  remark: string;
  conflictId: string | null;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  originalConflictId?: string | null;
  conflictHistory?: ConflictHistoryEntry[];
}

export interface ConflictHistoryEntry {
  conflictId: string;
  action: 'reschedule' | 'cancel';
  timestamp: string;
  operator: string;
  detail: string;
  relatedReservationIds: string[];
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  isLocked: boolean;
  lockedBy: string;
  lockedAt: string | null;
}

export interface BlacklistItem {
  id: string;
  organizerName: string;
  reason: string;
  addedAt: string;
}

export interface LogEntry {
  id: string;
  action: 'create' | 'update' | 'cancel' | 'reschedule' | 'lock' | 'unlock' | 'blacklist' | 'unblacklist';
  targetType: 'reservation' | 'room' | 'blacklist';
  targetId: string;
  operator: string;
  timestamp: string;
  detail: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
}

export interface ConflictGroup {
  id: string;
  roomId: string;
  roomName: string;
  reservationIds: string[];
}

export interface FilterOptions {
  roomId: string | null;
  status: string | null;
  organizer: string | null;
  startDate: string | null;
  endDate: string | null;
}
