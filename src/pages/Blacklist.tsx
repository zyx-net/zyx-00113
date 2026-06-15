import { useState } from 'react';
import { UserX, Plus, Trash2, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';
import { formatDateTime } from '../utils/helpers';

export default function Blacklist() {
  const { blacklist, addToBlacklist, removeFromBlacklist } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ organizerName: '', reason: '' });

  const handleAdd = () => {
    if (!newItem.organizerName.trim()) return;
    addToBlacklist(newItem.organizerName.trim(), newItem.reason.trim());
    setNewItem({ organizerName: '', reason: '' });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">黑名单列表</h2>
            <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
              <UserX className="w-4 h-4" />
              {blacklist.length} 人
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加黑名单
          </button>
        </div>

        {blacklist.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <UserX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无黑名单记录</p>
            <p className="text-sm text-gray-400 mt-1">添加组织者到黑名单后，他们将无法创建新预约</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {blacklist.map(item => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{item.organizerName}</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">黑名单</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>原因: {item.reason || '未说明'}</span>
                      <span>添加于: {formatDateTime(item.addedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromBlacklist(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="移除黑名单"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">添加到黑名单</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">组织者姓名</label>
                <input
                  type="text"
                  value={newItem.organizerName}
                  onChange={(e) => setNewItem(prev => ({ ...prev, organizerName: e.target.value }))}
                  placeholder="输入组织者姓名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">原因（可选）</label>
                <textarea
                  value={newItem.reason}
                  onChange={(e) => setNewItem(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="输入添加原因"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
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
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
