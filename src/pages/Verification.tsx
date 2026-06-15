import { useState } from 'react';
import { Play, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { runVerificationTests, clearAllData } from '../utils/verification';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  isPending?: boolean;
}

export default function Verification() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      const results = runVerificationTests();
      setTestResults(results.tests);
      setIsRunning(false);
    }, 100);
  };

  const handleClearData = () => {
    if (window.confirm('确定要清除所有数据吗？这将重置整个应用状态。')) {
      clearAllData();
      setTestResults([]);
    }
  };

  const passedCount = testResults.filter(t => !t.isPending && t.passed).length;
  const failedCount = testResults.filter(t => !t.isPending && !t.passed).length;
  const pendingCount = testResults.filter(t => t.isPending).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">冲突历史验证测试</h2>
            <p className="text-gray-500 mt-1">验证"先改期再取消"链路的完整性</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <Play className="w-4 h-4" />
              {isRunning ? '测试中...' : '运行测试'}
            </button>
            <button
              onClick={handleClearData}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清除数据
            </button>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-700">{passedCount}</span>
                  <span className="text-gray-600">通过</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-lg font-semibold text-red-700">{failedCount}</span>
                  <span className="text-gray-600">失败</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-lg font-semibold text-yellow-700">{pendingCount}</span>
                  <span className="text-gray-600">待验证</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    收起详情
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    显示详情
                  </>
                )}
              </button>
            </div>

            {showDetails && (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.isPending
                        ? 'bg-yellow-50 border-yellow-200'
                        : result.passed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.isPending ? (
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                      ) : result.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          result.isPending ? 'text-yellow-800' : result.passed ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.name}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          result.isPending ? 'text-yellow-700' : result.passed ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {testResults.length === 0 && (
          <div className="text-center py-12">
            <Play className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              点击"运行测试"开始验证冲突历史链路
            </p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-800 mb-2">测试覆盖范围：</h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>✅ 初始数据无假历史</li>
                <li>✅ 筛选条件持久化</li>
                <li>✅ 冲突组初始状态</li>
                <li>⏸️ 取消记录保留历史（需操作）</li>
                <li>⏸️ 操作日志冲突归属（需操作）</li>
                <li>⏸️ 导出数据完整（需操作）</li>
                <li>⏸️ LocalStorage 持久化（需操作）</li>
                <li>✅ 冲突组关联完整性</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">手动验证步骤</h3>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">场景1: 先改期再取消（核心链路）</h4>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>找到一条在冲突组中的预约（如会议室 A 的张三 09:00-10:00）</li>
              <li>点击改期图标，将时间改为 10:30-11:30（解除冲突）</li>
              <li>观察日志显示"解除冲突: xxx"</li>
              <li>取消该预约</li>
              <li>展开详情，查看"冲突历史"标签</li>
              <li>预期：应显示 [改期] → [取消] 完整链</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">场景2: 直接取消冲突记录</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>找到一条在冲突组中的预约（不要先改期）</li>
              <li>直接取消该预约</li>
              <li>展开详情，查看"冲突历史"标签</li>
              <li>预期：应显示 [取消] 记录，关联原冲突组 ID</li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">场景3: 导出数据验证</h4>
            <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
              <li>完成场景1或场景2的操作</li>
              <li>导航到"数据导出"页面</li>
              <li>导出"预约数据"</li>
              <li>打开 CSV 文件，检查列：预约ID、原冲突ID、冲突历史链</li>
              <li>预期：取消的预约应包含完整的冲突历史链</li>
            </ol>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">场景4: 刷新页面验证持久化</h4>
            <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
              <li>完成场景1或场景2的操作</li>
              <li>刷新页面（F5）</li>
              <li>展开刚才操作的预约详情</li>
              <li>预期：冲突历史应完整保留</li>
              <li>检查筛选条件是否保持</li>
            </ol>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">场景5: 失败路径验证</h4>
            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
              <li>尝试将预约改期到与其他预约重叠的时间</li>
              <li>预期：改期失败，提示"新时间与其他预约冲突"</li>
              <li>切换为普通用户，尝试锁定房间</li>
              <li>预期：操作被拦截，提示权限不足</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">常见问题排查</h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-1">Q: 初始数据验证失败？</h4>
            <p className="text-sm text-gray-600">
              A: 检查是否有不应该存在的冲突历史记录，这可能是因为之前操作遗留的数据。请点击"清除数据"重置。
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-1">Q: 冲突历史显示不完整？</h4>
            <p className="text-sm text-gray-600">
              A: 检查控制台日志，确认改期和取消操作都成功执行，没有被权限或其他逻辑拦截。
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-1">Q: 刷新后数据丢失？</h4>
            <p className="text-sm text-gray-600">
              A: 检查 LocalStorage 是否正常工作，浏览器隐私设置是否阻止了 localStorage。
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-1">Q: 验证一直显示"待验证"？</h4>
            <p className="text-sm text-gray-600">
              A: 这是正常的，说明还没有执行改期或取消操作。请先完成手动验证步骤，再运行测试。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
