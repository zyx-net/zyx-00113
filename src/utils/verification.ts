import useStore from '../store/useStore';
import { storage } from '../utils/storage';

export const runVerificationTests = () => {
  console.log('🔍 开始执行会议室调度台验证测试...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: [] as Array<{ name: string; passed: boolean; message: string; isPending?: boolean }>,
  };

  const log = (name: string, passed: boolean, message: string, isPending = false) => {
    results.tests.push({ name, passed, message, isPending });
    if (isPending) {
      console.log(`⏸️ ${name}: ${message}`);
    } else if (passed) {
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

  console.log('\n🧪 测试2: 初始数据不应有假通过的历史');
  try {
    const reservationsWithHistory = store.reservations.filter(
      r => r.conflictHistory && r.conflictHistory.length > 0
    );
    
    const hasFakeHistory = reservationsWithHistory.length > 0;
    
    log(
      '初始数据无假历史',
      !hasFakeHistory,
      hasFakeHistory 
        ? `❌ 发现 ${reservationsWithHistory.length} 条假历史（初始数据不应有）`
        : '✅ 初始数据正确，无假历史'
    );

    if (hasFakeHistory) {
      reservationsWithHistory.slice(0, 3).forEach(r => {
        console.log(`   预约 ${r.id} (${r.organizer}): ${r.conflictHistory!.length} 条历史`);
      });
    }
  } catch (e) {
    log('初始数据验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试3: 冲突组初始状态');
  try {
    const conflictReservations = store.getConflictReservations();
    const hasConflicts = conflictReservations.length > 0;
    
    log(
      '初始冲突存在',
      hasConflicts,
      hasConflicts 
        ? `✅ 有 ${conflictReservations.length} 个冲突预约（可用于测试）`
        : '❌ 无冲突预约（无法测试改期/取消链路）'
    );

    if (hasConflicts) {
      console.log('   可用冲突预约:');
      conflictReservations.slice(0, 3).forEach(r => {
        console.log(`   - ${r.organizer} (${r.roomName}) ${new Date(r.startTime).toLocaleTimeString('zh-CN')}`);
      });
    }
  } catch (e) {
    log('冲突组状态', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试4: 取消记录冲突历史（需先执行操作）');
  try {
    const cancelledReservations = store.reservations.filter(r => r.status === 'cancelled');
    const hasCancelled = cancelledReservations.length > 0;
    
    if (!hasCancelled) {
      log('取消记录待验证', false, '⏸️ 暂无取消记录（需执行先改期再取消操作）', true);
    } else {
      const cancelledWithHistory = cancelledReservations.filter(
        r => r.conflictHistory && r.conflictHistory.length > 0
      );
      
      const allCancelledHaveHistory = cancelledWithHistory.length === cancelledReservations.length;
      const hasCompleteChain = cancelledWithHistory.some(r => {
        const history = r.conflictHistory!;
        const hasReschedule = history.some(h => h.action === 'reschedule');
        const hasCancel = history.some(h => h.action === 'cancel');
        return hasReschedule && hasCancel;
      });

      log(
        '取消记录保留历史',
        allCancelledHaveHistory && hasCompleteChain,
        `${cancelledWithHistory.length}/${cancelledReservations.length} 条取消记录有历史，${hasCompleteChain ? '✅' : '❌'} ${hasCompleteChain ? '存在完整链' : '缺少完整链（先改期再取消）'}`
      );

      if (cancelledWithHistory.length > 0) {
        console.log('   已取消预约冲突历史:');
        cancelledWithHistory.forEach(r => {
          const chain = r.conflictHistory!.map(h => h.action === 'reschedule' ? '改期' : '取消').join(' → ');
          console.log(`   ${r.organizer}: ${chain}`);
          console.log(`     原冲突ID: ${r.originalConflictId || '-'}`);
          r.conflictHistory!.forEach((h, i) => {
            console.log(`     [${i + 1}] ${h.action} - ${h.conflictId}`);
          });
        });
      }

      if (!allCancelledHaveHistory) {
        const withoutHistory = cancelledReservations.filter(
          r => !r.conflictHistory || r.conflictHistory.length === 0
        );
        console.log('   ❌ 以下取消记录缺少历史:');
        withoutHistory.forEach(r => {
          console.log(`   - ${r.organizer} (${r.roomName})`);
        });
      }
    }
  } catch (e) {
    log('取消记录验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试5: 操作日志冲突归属（需先执行操作）');
  try {
    const logs = store.logs;
    const cancelLogs = logs.filter(l => l.action === 'cancel');
    const rescheduleLogs = logs.filter(l => l.action === 'reschedule');

    const hasLogs = cancelLogs.length > 0 || rescheduleLogs.length > 0;
    
    if (!hasLogs) {
      log('操作日志待验证', false, '⏸️ 暂无操作日志（需执行改期/取消操作）', true);
    } else {
      const cancelLogsWithConflict = cancelLogs.filter(l => l.detail.includes('冲突'));
      const rescheduleLogsWithConflict = rescheduleLogs.filter(l => l.detail.includes('冲突'));

      const allCancelHaveConflict = cancelLogs.length > 0 && cancelLogsWithConflict.length === cancelLogs.length;
      const allRescheduleHaveConflict = rescheduleLogs.length > 0 && rescheduleLogsWithConflict.length === rescheduleLogs.length;

      log(
        '改期日志有冲突信息',
        allRescheduleHaveConflict,
        rescheduleLogs.length === 0 
          ? '⏸️ 无改期日志'
          : `${rescheduleLogsWithConflict.length}/${rescheduleLogs.length} 条有冲突信息`
      );

      log(
        '取消日志有冲突归属',
        allCancelHaveConflict,
        cancelLogs.length === 0 
          ? '⏸️ 无取消日志'
          : `${cancelLogsWithConflict.length}/${cancelLogs.length} 条有冲突归属`
      );

      const cancelLogsWithChain = cancelLogs.filter(l => l.detail.includes('操作链'));
      log(
        '日志显示操作顺序',
        cancelLogsWithChain.length > 0,
        cancelLogsWithChain.length === 0
          ? '❌ 取消日志缺少操作链信息'
          : `✅ ${cancelLogsWithChain.length} 条日志包含操作顺序`
      );

      if (rescheduleLogsWithConflict.length > 0) {
        console.log('   改期日志示例:');
        rescheduleLogsWithConflict.slice(0, 2).forEach(l => {
          console.log(`   - ${l.detail.substring(0, 80)}...`);
        });
      }

      if (cancelLogsWithChain.length > 0) {
        console.log('   包含操作链的取消日志:');
        cancelLogsWithChain.slice(0, 2).forEach(l => {
          console.log(`   - ${l.detail}`);
        });
      }
    }
  } catch (e) {
    log('操作日志验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试6: 导出数据冲突历史字段（需先执行操作）');
  try {
    const exportReady = store.reservations.map(r => ({
      预约ID: r.id,
      组织者: r.organizer,
      状态: r.status,
      当前冲突ID: r.conflictId,
      原冲突ID: r.originalConflictId,
      冲突历史数: r.conflictHistory?.length || 0,
    }));

    const hasAnyHistory = exportReady.some(r => r.冲突历史数 > 0);
    const cancelledWithHistory = exportReady.filter(r => r.状态 === 'cancelled' && r.冲突历史数 > 0);

    log(
      '导出数据字段完整',
      true,
      hasAnyHistory 
        ? `✅ ${cancelledWithHistory.length} 条取消记录有冲突历史`
        : '⏸️ 暂无冲突历史（需执行操作后导出）'
    );

    if (hasAnyHistory) {
      const withFullChain = exportReady.filter(r => {
        if (r.冲突历史数 === 0) return false;
        const reservation = store.reservations.find(res => res.id === r.预约ID);
        if (!reservation || !reservation.conflictHistory) return false;
        return reservation.conflictHistory.some(h => h.action === 'reschedule') &&
               reservation.conflictHistory.some(h => h.action === 'cancel');
      });

      log(
        '导出不丢失完整链',
        withFullChain.length > 0,
        withFullChain.length > 0 
          ? `✅ ${withFullChain.length} 条记录包含完整操作链`
          : '❌ 无完整操作链'
      );
    }
  } catch (e) {
    log('导出数据验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试7: LocalStorage 持久化（需先执行操作）');
  try {
    const storedReservations = storage.getReservations() as any[];
    const hasConflictHistoryInStorage = storedReservations.some(
      r => r.conflictHistory && r.conflictHistory.length > 0
    );
    const hasCancelledWithHistory = storedReservations.some(
      r => r.status === 'cancelled' && r.conflictHistory && r.conflictHistory.length > 0
    );

    log(
      'LocalStorage 保留冲突历史',
      hasCancelledWithHistory,
      hasCancelledWithHistory 
        ? '✅ 已取消记录保留了冲突历史'
        : hasConflictHistoryInStorage 
          ? '⚠️ 有历史但无取消记录（需执行操作）'
          : '⏸️ 暂无冲突历史（需执行先改期再取消）'
    );

    if (hasCancelledWithHistory) {
      const cancelledWithHistory = storedReservations.filter(
        r => r.status === 'cancelled' && r.conflictHistory && r.conflictHistory.length > 0
      );
      console.log('   LocalStorage 中已取消的预约:');
      cancelledWithHistory.forEach(r => {
        const chain = r.conflictHistory.map((h: any) => h.action).join(' → ');
        console.log(`   - ${r.organizer}: ${chain} (冲突ID: ${r.originalConflictId || '-'})`);
      });
    }
  } catch (e) {
    log('LocalStorage 验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试8: 相关冲突处理完整性（需先执行操作）');
  try {
    const conflictReservations = store.getConflictReservations();
    
    if (conflictReservations.length > 0) {
      const firstConflict = conflictReservations[0];
      const conflictId = firstConflict.conflictId;
      
      const relatedReservations = store.reservations.filter(
        r => r.conflictId === conflictId && r.status !== 'cancelled'
      );

      log(
        '冲突组关联完整',
        relatedReservations.length > 1,
        `冲突组 ${conflictId} 关联 ${relatedReservations.length} 条预约`
      );

      if (relatedReservations.length > 1) {
        console.log('   冲突组内预约:');
        relatedReservations.forEach(r => {
          console.log(`   - ${r.organizer} (${r.roomName}) ${new Date(r.startTime).toLocaleTimeString('zh-CN')}`);
        });
      }
    } else {
      console.log('   ⏸️ 当前无冲突预约');
    }
  } catch (e) {
    log('冲突关联验证', false, `错误: ${e}`);
  }

  console.log('\n========================================');
  const passedTests = results.tests.filter(t => !t.isPending && t.passed).length;
  const failedTests = results.tests.filter(t => !t.isPending && !t.passed).length;
  const pendingTests = results.tests.filter(t => t.isPending).length;
  
  console.log(`📈 测试结果:`);
  console.log(`   ✅ 通过: ${passedTests}`);
  console.log(`   ❌ 失败: ${failedTests}`);
  console.log(`   ⏸️ 待验证: ${pendingTests}`);
  
  if (failedTests > 0) {
    console.log('\n❌ 失败的测试:');
    results.tests.filter(t => !t.passed && !t.isPending).forEach(t => {
      console.log(`   - ${t.name}: ${t.message}`);
    });
  }
  
  if (pendingTests > 0) {
    console.log('\n⏸️ 待验证的测试:');
    results.tests.filter(t => t.isPending).forEach(t => {
      console.log(`   - ${t.name}: ${t.message}`);
    });
  }
  
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
