import { useState } from 'react';
import { DoorOpen, Lock, Unlock, Users, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';
import { formatDateTime } from '../utils/helpers';

export default function RoomManagement() {
  const { rooms, lockRoom, unlockRoom, isAdminMode, reservations } = useStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLock = (roomId: string) => {
    const success = lockRoom(roomId);
    if (!success) {
      setErrorMessage('普通用户无权锁定房间，请切换为管理员模式');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleUnlock = (roomId: string) => {
    const success = unlockRoom(roomId);
    if (!success) {
      setErrorMessage('普通用户无权解锁房间，请切换为管理员模式');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const getRoomReservations = (roomId: string) => {
    return reservations.filter(r => r.roomId === roomId && r.status !== 'cancelled');
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map(room => {
          const roomReservations = getRoomReservations(room.id);
          const upcomingReservation = roomReservations
            .filter(r => new Date(r.startTime) > new Date())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

          return (
            <div
              key={room.id}
              className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${
                room.isLocked ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${room.isLocked ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <DoorOpen className={`w-5 h-5 ${room.isLocked ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{room.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        容纳 {room.capacity} 人
                      </p>
                    </div>
                  </div>
                  {room.isLocked && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      已锁定
                    </span>
                  )}
                </div>

                {room.isLocked && room.lockedAt && (
                  <div className="mb-4 p-3 bg-red-100 rounded-lg">
                    <p className="text-sm text-red-700">
                      由 {room.lockedBy} 于 {formatDateTime(room.lockedAt)} 锁定
                    </p>
                  </div>
                )}

                {upcomingReservation && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">下一个预约</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {upcomingReservation.organizer}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(upcomingReservation.startTime)} - {formatDateTime(upcomingReservation.endTime)}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {roomReservations.length} 个有效预约
                  </span>
                  <div className="flex gap-2">
                    {room.isLocked ? (
                      <button
                        onClick={() => handleUnlock(room.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Unlock className="w-4 h-4" />
                        解锁
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLock(room.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          isAdminMode 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!isAdminMode}
                      >
                        <Lock className="w-4 h-4" />
                        锁定
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
