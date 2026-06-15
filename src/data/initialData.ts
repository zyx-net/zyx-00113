import { Reservation, Room, BlacklistItem, LogEntry, User } from '../types';

export const initialRooms: Room[] = [
  { id: 'room-1', name: '会议室 A', capacity: 10, isLocked: false, lockedBy: '', lockedAt: null },
  { id: 'room-2', name: '会议室 B', capacity: 8, isLocked: false, lockedBy: '', lockedAt: null },
  { id: 'room-3', name: '会议室 C', capacity: 15, isLocked: false, lockedBy: '', lockedAt: null },
  { id: 'room-4', name: '会议室 D', capacity: 20, isLocked: false, lockedBy: '', lockedAt: null },
];

export const initialReservations: Reservation[] = [
  {
    id: 'res-1',
    roomId: 'room-1',
    roomName: '会议室 A',
    organizer: '张三',
    startTime: '2026-06-16T09:00:00',
    endTime: '2026-06-16T10:00:00',
    status: 'confirmed',
    remark: '部门周会',
    conflictId: null,
    createdAt: '2026-06-15T10:00:00',
    updatedAt: '2026-06-15T10:00:00',
  },
  {
    id: 'res-2',
    roomId: 'room-1',
    roomName: '会议室 A',
    organizer: '李四',
    startTime: '2026-06-16T09:30:00',
    endTime: '2026-06-16T10:30:00',
    status: 'pending',
    remark: '项目评审',
    conflictId: null,
    createdAt: '2026-06-15T11:00:00',
    updatedAt: '2026-06-15T11:00:00',
  },
  {
    id: 'res-3',
    roomId: 'room-2',
    roomName: '会议室 B',
    organizer: '王五',
    startTime: '2026-06-16T14:00:00',
    endTime: '2026-06-16T15:00:00',
    status: 'confirmed',
    remark: '客户会议',
    conflictId: null,
    createdAt: '2026-06-15T09:00:00',
    updatedAt: '2026-06-15T09:00:00',
  },
  {
    id: 'res-4',
    roomId: 'room-3',
    roomName: '会议室 C',
    organizer: '赵六',
    startTime: '2026-06-16T10:00:00',
    endTime: '2026-06-16T11:00:00',
    status: 'confirmed',
    remark: '培训课程',
    conflictId: null,
    createdAt: '2026-06-14T14:00:00',
    updatedAt: '2026-06-14T14:00:00',
  },
  {
    id: 'res-5',
    roomId: 'room-3',
    roomName: '会议室 C',
    organizer: '钱七',
    startTime: '2026-06-16T11:00:00',
    endTime: '2026-06-16T12:00:00',
    status: 'pending',
    remark: '技术分享',
    conflictId: null,
    createdAt: '2026-06-15T15:00:00',
    updatedAt: '2026-06-15T15:00:00',
  },
];

export const initialBlacklist: BlacklistItem[] = [];

export const initialLogs: LogEntry[] = [
  {
    id: 'log-1',
    action: 'create',
    targetType: 'reservation',
    targetId: 'res-1',
    operator: 'admin',
    timestamp: '2026-06-15T10:00:00',
    detail: '创建预约: 会议室 A - 张三 (2026-06-16 09:00-10:00)',
  },
  {
    id: 'log-2',
    action: 'create',
    targetType: 'reservation',
    targetId: 'res-2',
    operator: 'admin',
    timestamp: '2026-06-15T11:00:00',
    detail: '创建预约: 会议室 A - 李四 (2026-06-16 09:30-10:30)',
  },
  {
    id: 'log-3',
    action: 'create',
    targetType: 'reservation',
    targetId: 'res-3',
    operator: 'admin',
    timestamp: '2026-06-15T09:00:00',
    detail: '创建预约: 会议室 B - 王五 (2026-06-16 14:00-15:00)',
  },
];

export const initialAdminUser: User = {
  id: 'user-1',
  name: '管理员',
  role: 'admin',
};

export const initialNormalUser: User = {
  id: 'user-2',
  name: '普通用户',
  role: 'user',
};
