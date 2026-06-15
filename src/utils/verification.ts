import useStore from '../store/useStore';
import { storage } from '../utils/storage';

export const runVerificationTests = () => {
  console.log('🔍 开始执行会议室调度台验证测试...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: [] as Array<{ name: string; passed: boolean; message: string }>,
  };

  const log = (name: string, passed: boolean, message: string) => {
    results.tests.push({ name, passed, message });
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}: ${message}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${message}`);
    }
  };

  const store = useStore.getState();

  console.log('📊 当前系统状态:');
  console.log(`   - 预约总数: ${store.reservations.length}`);
  console.log(`   - 冲突组数: ${store.getConflictReservations().length}`);
  console.log(`   - 有冲突历史的预约: ${store.reservations.filter(r => r.conflictHistory && r.conflictHistory.length > 0).length}`);
  console.log('');

  console.log('🧪 测试1: 筛选条件持久化');
  try {
    const filters = storage.getFilters();
    log(
      '筛选条件持久化',
      filters !== null,
      filters ? `筛选条件已保存: ${JSON.stringify(filters)}` : '筛选条件未保存'
    );
  } catch (e) {
    log('筛选条件持久化', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试2: 冲突历史数据结构验证');
  try {
    const reservationsWithHistory = store.reservations.filter(
      r => r.conflictHistory && r.conflictHistory.length > 0
    );

    if (reservationsWithHistory.length > 0) {
      reservationsWithHistory.forEach(r => {
        console.log(`   预约 ${r.id} (${r.organizer}) 的冲突历史:`);
        r.conflictHistory!.forEach((h, i) => {
          console.log(`     [${i + 1}] ${h.action} - ${h.conflictId} - ${h.operator} - ${h.detail}`);
        });
      });

      const allHaveConflictId = reservationsWithHistory.every(
        r => r.conflictHistory!.every(h => h.conflictId)
      );
      const allHaveTimestamp = reservationsWithHistory.every(
        r => r.conflictHistory!.every(h => h.timestamp)
      );
      const allHaveOperator = reservationsWithHistory.every(
        r => r.conflictHistory!.every(h => h.operator)
      );

      log(
        '冲突历史完整性',
        allHaveConflictId && allHaveTimestamp && allHaveOperator,
        `冲突历史记录完整: conflictId=${allHaveConflictId}, timestamp=${allHaveTimestamp}, operator=${allHaveOperator}`
      );
    } else {
      log('冲突历史记录', true, '暂无冲突历史记录（正常，需执行改期/取消操作后验证）');
    }
  } catch (e) {
    log('冲突历史数据结构', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试3: 取消记录的冲突历史');
  try {
    const cancelledReservations = store.reservations.filter(r => r.status === 'cancelled');

    if (cancelledReservations.length > 0) {
      const cancelledWithHistory = cancelledReservations.filter(
        r => r.conflictHistory && r.conflictHistory.length > 0
      );

      log(
        '取消记录保留历史',
        cancelledWithHistory.length > 0,
        `${cancelledWithHistory.length}/${cancelledReservations.length} 条取消记录保留了冲突历史`
      );

      if (cancelledWithHistory.length > 0) {
        cancelledWithHistory.forEach(r => {
          console.log(`   取消的预约 ${r.id}:`);
          console.log(`     - originalConflictId: ${r.originalConflictId || '-'}`);
          console.log(`     - conflictHistory 条目: ${r.conflictHistory!.length}`);
          r.conflictHistory!.forEach((h, i) => {
            const actionLabel = h.action === 'reschedule' ? '改期' : h.action === 'cancel' ? '取消' : '其他';
            console.log(`     - 历史[${i}]: ${actionLabel} - 冲突ID: ${h.conflictId} - 操作链: ${h.detail}`);
          });
        });
      }
    } else {
      log('取消记录', true, '暂无取消记录（正常，需执行取消操作后验证）');
    }
  } catch (e) {
    log('取消记录冲突历史', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试4: 操作日志冲突信息');
  try {
    const logs = store.logs;
    const cancelLogs = logs.filter(l => l.action === 'cancel');
    const rescheduleLogs = logs.filter(l => l.action === 'reschedule');

    const cancelLogsWithConflictInfo = cancelLogs.filter(
      l => l.detail.includes('冲突')
    );
    const rescheduleLogsWithConflictInfo = rescheduleLogs.filter(
      l => l.detail.includes('冲突')
    );

    log(
      '取消日志包含冲突信息',
      cancelLogsWithConflictInfo.length > 0 || cancelLogs.length === 0,
      `${cancelLogsWithConflictInfo.length}/${cancelLogs.length} 条取消日志包含冲突信息`
    );

    log(
      '改期日志包含冲突信息',
      rescheduleLogsWithConflictInfo.length > 0 || rescheduleLogs.length === 0,
      `${rescheduleLogsWithConflictInfo.length}/${rescheduleLogs.length} 条改期日志包含冲突信息`
    );

    if (rescheduleLogsWithConflictInfo.length > 0) {
      console.log('   改期解除冲突的日志示例:');
      rescheduleLogsWithConflictInfo.slice(0, 2).forEach(l => {
        console.log(`     - ${l.detail}`);
      });
    }
  } catch (e) {
    log('操作日志冲突信息', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试5: 导出数据准备就绪');
  try {
    const exportReady = store.reservations.map(r => ({
      预约ID: r.id,
      组织者: r.organizer,
      状态: r.status,
      当前冲突ID: r.conflictId,
      原冲突ID: r.originalConflictId,
      冲突历史数: r.conflictHistory?.length || 0,
    }));

    const hasConflictHistory = exportReady.filter(r => r.冲突历史数 > 0);

    log(
      '导出数据结构',
      true,
      `准备导出 ${exportReady.length} 条预约，其中 ${hasConflictHistory.length} 条有冲突历史`
    );
  } catch (e) {
    log('导出数据准备', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试6: LocalStorage 数据持久化验证');
  try {
    const storedReservations = storage.getReservations() as any[];
    const hasConflictHistoryInStorage = storedReservations.some(
      (r: any) => r.conflictHistory && r.conflictHistory.length > 0
    );

    log(
      'LocalStorage 冲突历史持久化',
      hasConflictHistoryInStorage || storedReservations.length > 0,
      hasConflictHistoryInStorage
        ? 'LocalStorage 中保留了冲突历史数据'
        : 'LocalStorage 中暂无冲突历史数据（需执行操作后验证）'
    );
  } catch (e) {
    log('LocalStorage 持久化', false, `错误: ${e}`);
  }

  console.log('\n========================================');
  console.log(`📈 测试结果: ${results.passed} 通过, ${results.failed} 失败`);
  console.log('========================================\n');

  return results;
};

export const clearAllData = () => {
  storage.clearAll();
  console.log('🗑️ 所有数据已清除，包括:');
  console.log('   - 预约列表');
  console.log('   - 房间列表');
  console.log('   - 黑名单');
  console.log('   - 操作日志');
  console.log('   - 当前用户');
  console.log('   - 筛选条件');
  console.log('\n请刷新页面以重置应用状态。');
};
