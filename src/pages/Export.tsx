import { Download, FileText, TrendingUp, Calendar, Users, AlertTriangle } from 'lucide-react';
import useStore from '../store/useStore';
import { exportToCSV, formatDateTime } from '../utils/helpers';

export default function Export() {
  const { reservations, rooms, blacklist, logs } = useStore();

  const exportReservations = () => {
    const exportData = reservations.map(r => ({
      会议室: r.roomName,
      组织者: r.organizer,
      开始时间: formatDateTime(r.startTime),
      结束时间: formatDateTime(r.endTime),
      状态: r.status === 'pending' ? '待确认' : r.status === 'confirmed' ? '已确认' : r.status === 'cancelled' ? '已取消' : '已改期',
      备注: r.remark,
      当前冲突ID: r.conflictId || '-',
      原冲突ID: r.originalConflictId || '-',
      冲突历史: r.conflictHistory && r.conflictHistory.length > 0 
        ? r.conflictHistory.map(h => `${h.action}(${h.conflictId})`).join('; ')
        : '-',
      创建时间: formatDateTime(r.createdAt),
      更新时间: formatDateTime(r.updatedAt),
    }));
    exportToCSV(exportData, `reservations_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportConflictHistory = () => {
    const conflictReservations = reservations.filter(r => 
      r.conflictHistory && r.conflictHistory.length > 0
    );
    
    const exportData = conflictReservations.flatMap(r => 
      r.conflictHistory!.map(history => ({
        预约ID: r.id,
        会议室: r.roomName,
        组织者: r.organizer,
        操作类型: history.action === 'reschedule' ? '改期' : '取消',
        冲突组ID: history.conflictId,
        操作人: history.operator,
        操作时间: formatDateTime(history.timestamp),
        详情: history.detail,
        关联预约数: history.relatedReservationIds.length,
        关联预约IDs: history.relatedReservationIds.join('; '),
      }))
    );
    
    if (exportData.length === 0) {
      alert('暂无冲突历史记录');
      return;
    }
    
    exportToCSV(exportData, `conflict_history_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportRooms = () => {
    const exportData = rooms.map(r => ({
      会议室名称: r.name,
      容量: r.capacity,
      状态: r.isLocked ? '已锁定' : '可用',
      锁定人: r.lockedBy || '-',
      锁定时间: r.lockedAt ? formatDateTime(r.lockedAt) : '-',
    }));
    exportToCSV(exportData, `rooms_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportBlacklist = () => {
    const exportData = blacklist.map(b => ({
      组织者姓名: b.organizerName,
      原因: b.reason || '-',
      添加时间: formatDateTime(b.addedAt),
    }));
    exportToCSV(exportData, `blacklist_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportLogs = () => {
    const exportData = logs.map(log => ({
      操作类型: log.action,
      目标类型: log.targetType,
      操作人: log.operator,
      时间: formatDateTime(log.timestamp),
      详情: log.detail,
    }));
    exportToCSV(exportData, `logs_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const conflictHistoryCount = reservations.filter(r => 
    r.conflictHistory && r.conflictHistory.length > 0
  ).length;

  const stats = [
    {
      label: '预约总数',
      value: reservations.length,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      label: '会议室数量',
      value: rooms.length,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      label: '黑名单人数',
      value: blacklist.length,
      icon: FileText,
      color: 'bg-red-500',
    },
    {
      label: '操作日志',
      value: logs.length,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: '冲突历史',
      value: conflictHistoryCount,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
  ];

  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;
  const lockedRoomCount = rooms.filter(r => r.isLocked).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">统计概览</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-1">已确认预约</p>
            <p className="text-3xl font-bold text-green-800">{confirmedCount}</p>
            <p className="text-xs text-green-600 mt-1">占比 {reservations.length > 0 ? Math.round(confirmedCount / reservations.length * 100) : 0}%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-1">已取消预约</p>
            <p className="text-3xl font-bold text-gray-800">{cancelledCount}</p>
            <p className="text-xs text-gray-600 mt-1">占比 {reservations.length > 0 ? Math.round(cancelledCount / reservations.length * 100) : 0}%</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700 mb-1">已锁定房间</p>
            <p className="text-3xl font-bold text-red-800">{lockedRoomCount}</p>
            <p className="text-xs text-red-600 mt-1">占比 {rooms.length > 0 ? Math.round(lockedRoomCount / rooms.length * 100) : 0}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">数据导出</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={exportReservations}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">导出预约数据</p>
              <p className="text-sm text-blue-500">{reservations.length} 条记录</p>
            </div>
          </button>
          <button
            onClick={exportConflictHistory}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">导出冲突历史</p>
              <p className="text-sm text-orange-500">{conflictHistoryCount} 条记录</p>
            </div>
          </button>
          <button
            onClick={exportRooms}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">导出房间数据</p>
              <p className="text-sm text-purple-500">{rooms.length} 条记录</p>
            </div>
          </button>
          <button
            onClick={exportBlacklist}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">导出黑名单数据</p>
              <p className="text-sm text-red-500">{blacklist.length} 条记录</p>
            </div>
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">导出操作日志</p>
              <p className="text-sm text-green-500">{logs.length} 条记录</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
