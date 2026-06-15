import React, { useState } from 'react';
import { Calendar, Clock, User, MapPin, AlertTriangle, Edit2, Trash2, MessageSquare, ChevronDown, ChevronUp, History } from 'lucide-react';
import useStore from '../store/useStore';
import { Reservation } from '../types';
import { formatDateTime, getStatusLabel, getStatusColor } from '../utils/helpers';

export default function ReservationTable() {
  const { reservations, cancelReservation, rescheduleReservation, addRemark, isAdminMode, getConflictReservations } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState<{ [key: string]: { start: string; end: string } }>({});
  const [remarkForm, setRemarkForm] = useState<{ [key: string]: string }>({});
  const [showRescheduleError, setShowRescheduleError] = useState<string | null>(null);

  const conflictReservations = getConflictReservations();
  const hasConflict = conflictReservations.length > 0;

  const handleCancel = (id: string) => {
    cancelReservation(id);
  };

  const handleReschedule = (id: string) => {
    const form = rescheduleForm[id];
    if (!form?.start || !form?.end) return;

    const success = rescheduleReservation(id, form.start + ':00', form.end + ':00');
    if (success) {
      setRescheduleForm(prev => ({ ...prev, [id]: { start: '', end: '' } }));
      setShowRescheduleError(null);
    } else {
      setShowRescheduleError(id);
      setTimeout(() => setShowRescheduleError(null), 3000);
    }
  };

  const handleSaveRemark = (id: string) => {
    const remark = remarkForm[id] || '';
    addRemark(id, remark);
    setRemarkForm(prev => ({ ...prev, [id]: '' }));
    setExpandedId(null);
  };

  const isInConflict = (reservation: Reservation) => {
    return conflictReservations.some(r => r.id === reservation.id);
  };

  const getConflictGroup = (reservation: Reservation) => {
    if (!reservation.conflictId) return null;
    return conflictReservations.filter(r => r.conflictId === reservation.conflictId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">预约列表</h2>
          {hasConflict && (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
              <AlertTriangle className="w-4 h-4" />
              {conflictReservations.length} 个冲突
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          共 {reservations.length} 条记录
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">会议室</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">组织者</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reservations.map((reservation) => {
              const isExpanded = expandedId === reservation.id;
              const conflictGroup = getConflictGroup(reservation);
              const hasConflict = isInConflict(reservation);

              return (
                <React.Fragment key={reservation.id}>
                  <tr 
                    className={`hover:bg-gray-50 transition-colors ${
                      hasConflict ? 'bg-red-50' : ''
                    } ${reservation.status === 'cancelled' ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{reservation.roomName}</span>
                        {hasConflict && (
                          <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{reservation.organizer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{formatDateTime(reservation.startTime).split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {formatDateTime(reservation.startTime).split(' ')[1]} - {formatDateTime(reservation.endTime).split(' ')[1]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusLabel(reservation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 truncate max-w-[150px]" title={reservation.remark || '无'}>
                        {reservation.remark || '无'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {reservation.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => {
                                setExpandedId(isExpanded ? null : reservation.id);
                                if (!isExpanded) {
                                  setRemarkForm(prev => ({ ...prev, [reservation.id]: reservation.remark }));
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="编辑备注"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : reservation.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="改期"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {reservation.status !== 'cancelled' && isAdminMode && (
                          <button
                            onClick={() => handleCancel(reservation.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="取消"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="flex gap-6">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              改期
                            </h4>
                            {showRescheduleError === reservation.id && (
                              <div className="mb-3 px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg">
                                改期失败：新时间与其他预约冲突
                              </div>
                            )}
                            <div className="flex gap-4">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">开始时间</label>
                                <input
                                  type="datetime-local"
                                  value={rescheduleForm[reservation.id]?.start || ''}
                                  onChange={(e) => setRescheduleForm(prev => ({ 
                                    ...prev, 
                                    [reservation.id]: { ...prev[reservation.id], start: e.target.value } 
                                  }))}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">结束时间</label>
                                <input
                                  type="datetime-local"
                                  value={rescheduleForm[reservation.id]?.end || ''}
                                  onChange={(e) => setRescheduleForm(prev => ({ 
                                    ...prev, 
                                    [reservation.id]: { ...prev[reservation.id], end: e.target.value } 
                                  }))}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  onClick={() => handleReschedule(reservation.id)}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  确认改期
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">备注</h4>
                            <textarea
                              value={remarkForm[reservation.id] || ''}
                              onChange={(e) => setRemarkForm(prev => ({ ...prev, [reservation.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              rows={3}
                              placeholder="输入备注..."
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleSaveRemark(reservation.id)}
                                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                保存备注
                              </button>
                            </div>
                          </div>
                        </div>
                        {conflictGroup && conflictGroup.length > 1 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              当前冲突关联 ({conflictGroup.length} 条)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {conflictGroup.map(r => (
                                <div 
                                  key={r.id}
                                  className={`px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg ${r.id === reservation.id ? 'ring-2 ring-red-500' : ''}`}
                                >
                                  {r.organizer} - {formatDateTime(r.startTime)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {reservation.conflictHistory && reservation.conflictHistory.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              冲突历史 ({reservation.conflictHistory.length} 条)
                            </h4>
                            <div className="space-y-2">
                              {reservation.conflictHistory.map((entry, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                      entry.action === 'reschedule' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {entry.action === 'reschedule' ? '改期' : '取消'}
                                    </span>
                                    <span className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</span>
                                    <span className="text-xs text-gray-400">by {entry.operator}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{entry.detail}</p>
                                  <div className="mt-1 text-xs text-gray-500">
                                    冲突组ID: {entry.conflictId} | 关联 {entry.relatedReservationIds.length} 条预约
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {reservation.originalConflictId && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              原冲突信息
                            </h4>
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                原冲突组ID: <code className="px-1 bg-yellow-100 rounded text-xs">{reservation.originalConflictId}</code>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                该预约曾关联此冲突组，后被取消
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
