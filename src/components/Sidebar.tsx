import { 
  LayoutDashboard, 
  DoorOpen, 
  UserX, 
  FileText, 
  Download,
  Shield,
  ShieldOff
} from 'lucide-react';
import useStore from '../store/useStore';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const { isAdminMode, switchUserRole } = useStore();

  const menuItems = [
    { id: 'dashboard', label: '控制台', icon: LayoutDashboard },
    { id: 'rooms', label: '房间管理', icon: DoorOpen },
    { id: 'blacklist', label: '黑名单', icon: UserX },
    { id: 'logs', label: '操作日志', icon: FileText },
    { id: 'export', label: '数据导出', icon: Download },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">会议室调度台</h1>
        <p className="text-sm text-gray-500 mt-1">Conflict Detection</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">用户模式</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            isAdminMode ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isAdminMode ? '管理员' : '普通用户'}
          </span>
        </div>
        <button
          onClick={() => switchUserRole(!isAdminMode)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
            isAdminMode 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {isAdminMode ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {isAdminMode ? '切换为普通用户' : '切换为管理员'}
          </span>
        </button>
      </div>
    </aside>
  );
}
