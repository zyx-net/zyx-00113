import { FileText, Clock, User, AlertCircle, CheckCircle, Edit2, Trash2, Lock, Unlock, UserX, RefreshCw } from 'lucide-react';
import useStore from '../store/useStore';
import { formatDateTime } from '../utils/helpers';
import { LogEntry } from '../types';

const getActionIcon = (action: LogEntry['action']) => {
  const icons: Record<LogEntry['action'], typeof FileText> = {
    create: CheckCircle,
    update: Edit2,
    cancel: Trash2,
    reschedule: RefreshCw,
    lock: Lock,
    unlock: Unlock,
    blacklist: UserX,
    unblacklist: CheckCircle,
  };
  return icons[action];
};

const getActionColor = (action: LogEntry['action']) => {
  const colors: Record<LogEntry['action'], string> = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    cancel: 'bg-red-100 text-red-700',
    reschedule: 'bg-yellow-100 text-yellow-700',
    lock: 'bg-orange-100 text-orange-700',
    unlock: 'bg-green-100 text-green-700',
    blacklist: 'bg-red-100 text-red-700',
    unblacklist: 'bg-green-100 text-green-700',
  };
  return colors[action];
};

const getActionLabel = (action: LogEntry['action']) => {
  const labels: Record<LogEntry['action'], string> = {
    create: '创建',
    update: '更新',
    cancel: '取消',
    reschedule: '改期',
    lock: '锁定',
    unlock: '解锁',
    blacklist: '加入黑名单',
    unblacklist: '移除黑名单',
  };
  return labels[action];
};

const getTargetTypeLabel = (targetType: LogEntry['targetType']) => {
  const labels: Record<LogEntry['targetType'], string> = {
    reservation: '预约',
    room: '房间',
    blacklist: '黑名单',
  };
  return labels[targetType];
};

export default function Logs() {
  const { logs } = useStore();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">操作日志</h2>
          <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
            <FileText className="w-4 h-4" />
            {logs.length} 条记录
          </span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无操作日志</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          {logs.map(log => {
            const Icon = getActionIcon(log.action);
            return (
              <div key={log.id} className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-sm text-gray-500">{getTargetTypeLabel(log.targetType)}</span>
                    </div>
                    <p className="text-sm text-gray-800">{log.detail}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.operator}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
