import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import useStore from '../store/useStore';
import ReservationTable from '../components/ReservationTable';
import FilterPanel from '../components/FilterPanel';

export default function Dashboard() {
  const { reservations, getConflictReservations, rooms } = useStore();

  const conflictReservations = getConflictReservations();
  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed');
  const cancelledReservations = reservations.filter(r => r.status === 'cancelled');
  const conflictHistoryCount = reservations.filter(r => 
    r.conflictHistory && r.conflictHistory.length > 0
  ).length;

  const stats = [
    {
      label: '总预约',
      value: reservations.length,
      icon: Clock,
      color: 'bg-blue-500',
    },
    {
      label: '待确认',
      value: pendingReservations.length,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      label: '已确认',
      value: confirmedReservations.length,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: '存在冲突',
      value: conflictReservations.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      label: '已取消',
      value: cancelledReservations.length,
      icon: Clock,
      color: 'bg-gray-500',
    },
    {
      label: '冲突历史',
      value: conflictHistoryCount,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      label: '会议室',
      value: rooms.length,
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-7 gap-4">
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

      {conflictReservations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">检测到冲突</span>
          </div>
          <p className="text-sm text-red-700">
            发现 {conflictReservations.length} 个预约存在时间冲突，请及时处理。
          </p>
        </div>
      )}

      <FilterPanel />
      <ReservationTable />
    </div>
  );
}
