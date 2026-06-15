import { Reservation, ConflictGroup } from '../types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDateTime = (dateTimeStr: string): string => {
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTime = (dateTimeStr: string): string => {
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isOverlapping = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 < e2 && s2 < e1;
};

export const detectConflicts = (reservations: Reservation[]): ConflictGroup[] => {
  const conflictGroups: ConflictGroup[] = [];
  const rooms = [...new Set(reservations.map(r => r.roomId))];

  rooms.forEach(roomId => {
    const roomReservations = reservations
      .filter(r => r.roomId === roomId && r.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const visited = new Set<string>();
    
    for (let i = 0; i < roomReservations.length; i++) {
      if (visited.has(roomReservations[i].id)) continue;

      const conflictGroup: ConflictGroup = {
        id: generateId(),
        roomId,
        roomName: roomReservations[i].roomName,
        reservationIds: [roomReservations[i].id],
      };

      for (let j = i + 1; j < roomReservations.length; j++) {
        if (isOverlapping(
          roomReservations[i].startTime,
          roomReservations[i].endTime,
          roomReservations[j].startTime,
          roomReservations[j].endTime
        )) {
          conflictGroup.reservationIds.push(roomReservations[j].id);
          visited.add(roomReservations[j].id);
        }
      }

      if (conflictGroup.reservationIds.length > 1) {
        conflictGroups.push(conflictGroup);
      }
    }
  });

  return conflictGroups;
};

export const getReservationsWithConflictInfo = (
  reservations: Reservation[],
  conflictGroups: ConflictGroup[]
): Reservation[] => {
  return reservations.map(reservation => {
    const conflictGroup = conflictGroups.find(cg => 
      cg.reservationIds.includes(reservation.id)
    );
    return {
      ...reservation,
      conflictId: conflictGroup?.id || null,
    };
  });
};

export const validateTimeRange = (
  startTime: string,
  endTime: string
): boolean => {
  return new Date(startTime).getTime() < new Date(endTime).getTime();
};

export const validateNoOverlap = (
  reservations: Reservation[],
  newStartTime: string,
  newEndTime: string,
  excludeId: string | null = null,
  roomId?: string
): boolean => {
  const activeReservations = reservations.filter(
    r => r.status !== 'cancelled' && r.id !== excludeId && (roomId ? r.roomId === roomId : true)
  );
  
  return !activeReservations.some(r => 
    isOverlapping(r.startTime, r.endTime, newStartTime, newEndTime)
  );
};

export const getStatusLabel = (status: Reservation['status']): string => {
  const labels: Record<Reservation['status'], string> = {
    pending: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
    rescheduled: '已改期',
  };
  return labels[status];
};

export const getStatusColor = (status: Reservation['status']): string => {
  const colors: Record<Reservation['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    rescheduled: 'bg-blue-100 text-blue-800',
  };
  return colors[status];
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${String(row[header] || '')}"`).join(','))
  ].join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
