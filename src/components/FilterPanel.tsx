import { useState } from 'react';
import { Filter, X, Plus, Search } from 'lucide-react';
import useStore from '../store/useStore';

export default function FilterPanel() {
  const { rooms, filters, setFilters, clearFilters, addReservation } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReservation, setNewReservation] = useState({
    roomId: '',
    organizer: '',
    startTime: '',
    endTime: '',
    remark: '',
    status: 'pending' as const,
  });

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleAddReservation = () => {
    if (!newReservation.roomId || !newReservation.organizer || !newReservation.startTime || !newReservation.endTime) {
      return;
    }
    const room = rooms.find(r => r.id === newReservation.roomId);
    if (!room) return;
    addReservation({ ...newReservation, roomName: room.name });
    setNewReservation({
      roomId: '',
      organizer: '',
      startTime: '',
      endTime: '',
      remark: '',
      status: 'pending',
    });
    setShowAddModal(false);
  };

  const isFilterActive = Object.values(filters).some(v => v !== null);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-gray-700">筛选条件</h3>
          </div>
          <div className="flex items-center gap-2">
            {isFilterActive && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                清除筛选
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加预约
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">会议室</label>
            <select
              value={filters.roomId || ''}
              onChange={(e) => handleFilterChange('roomId', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">状态</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部</option>
              <option value="pending">待确认</option>
              <option value="confirmed">已确认</option>
              <option value="rescheduled">已改期</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">组织者</label>
            <input
              type="text"
              value={filters.organizer || ''}
              onChange={(e) => handleFilterChange('organizer', e.target.value || null)}
              placeholder="搜索组织者..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">添加新预约</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会议室</label>
                <select
                  value={newReservation.roomId}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, roomId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择会议室</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id} disabled={room.isLocked}>
                      {room.name} {room.isLocked && '(已锁定)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">组织者</label>
                <input
                  type="text"
                  value={newReservation.organizer}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, organizer: e.target.value }))}
                  placeholder="输入组织者姓名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input
                    type="datetime-local"
                    value={newReservation.startTime}
                    onChange={(e) => setNewReservation(prev => ({ ...prev, startTime: e.target.value + ':00' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input
                    type="datetime-local"
                    value={newReservation.endTime}
                    onChange={(e) => setNewReservation(prev => ({ ...prev, endTime: e.target.value + ':00' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={newReservation.remark}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, remark: e.target.value }))}
                  placeholder="输入备注（可选）"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddReservation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
