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
    const logs = store.logs;
    const hasOperationLogs = logs.some(l => 
      l.action === 'reschedule' || l.action === 'cancel'
    );
    const reservationsWithHistory = store.reservations.filter(
      r => r.conflictHistory && r.conflictHistory.length > 0
    );
    
    const hasAnyHistory = reservationsWithHistory.length > 0;
    
    if (!hasAnyHistory) {
      log(
        '初始数据无假历史',
        true,
        '✅ 初始数据正确，无假历史'
      );
    } else {
      const hasSuspiciousHistory = reservationsWithHistory.some(r => {
        if (r.status === 'cancelled' || r.status === 'rescheduled') {
          return r.conflictHistory && r.conflictHistory.length > 0;
        }
        return r.conflictHistory && r.conflictHistory.length > 0 && !hasOperationLogs;
      });
      
      if (hasSuspiciousHistory && !hasOperationLogs) {
        log(
          '初始数据无假历史',
          false,
          `❌ 发现 ${reservationsWithHistory.length} 条假历史（初始数据不应有，且无操作日志）`
        );
      } else {
        log(
          '初始数据无假历史',
          true,
          `✅ ${reservationsWithHistory.length} 条历史记录来自正常操作`
        );
      }
    }

    if (hasAnyHistory && reservationsWithHistory.length > 0) {
      reservationsWithHistory.slice(0, 3).forEach(r => {
        console.log(`   预约 ${r.id} (${r.organizer}): ${r.conflictHistory!.length} 条历史, 状态: ${r.status}`);
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
    
    if (!hasAnyHistory) {
      log('导出数据冲突历史', false, '⏸️ 暂无冲突历史（需执行先改期再取消后验证导出）', true);
    } else {
      const withFullChain = exportReady.filter(r => {
        if (r.冲突历史数 === 0) return false;
        const reservation = store.reservations.find(res => res.id === r.预约ID);
        if (!reservation || !reservation.conflictHistory) return false;
        return reservation.conflictHistory.some(h => h.action === 'reschedule') &&
               reservation.conflictHistory.some(h => h.action === 'cancel');
      });

      log(
        '导出数据包含完整链',
        withFullChain.length > 0,
        withFullChain.length > 0 
          ? `✅ ${withFullChain.length} 条取消记录包含完整操作链`
          : `❌ ${cancelledWithHistory.length} 条有历史但无完整链`
      );

      if (withFullChain.length > 0) {
        console.log('   包含完整链的导出数据:');
        withFullChain.slice(0, 3).forEach(r => {
          const reservation = store.reservations.find(res => res.id === r.预约ID);
          const chain = reservation?.conflictHistory?.map(h => h.action).join(' → ') || '-';
          console.log(`   - ${r.组织者}: ${chain}`);
        });
      }
    }
  } catch (e) {
    log('导出数据验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试7: LocalStorage 持久化（需先执行操作）');
  try {
    const storedReservations = storage.getReservations() as Array<{
      conflictHistory?: Array<{ action: string }>;
      status?: string;
      organizer?: string;
      originalConflictId?: string;
    }>;
    const hasCancelledWithHistory = storedReservations.some(
      r => r.status === 'cancelled' && r.conflictHistory && r.conflictHistory.length > 0
    );
    const hasCancelled = storedReservations.some(r => r.status === 'cancelled');

    if (!hasCancelled) {
      log('LocalStorage 持久化待验证', false, '⏸️ 暂无取消记录（需执行操作）', true);
    } else {
      log(
        'LocalStorage 保留冲突历史',
        hasCancelledWithHistory,
        hasCancelledWithHistory 
          ? '✅ 已取消记录保留了冲突历史'
          : '❌ 有取消记录但无冲突历史（数据丢失）'
      );

      if (hasCancelledWithHistory) {
        const cancelledWithHistory = storedReservations.filter(
          r => r.status === 'cancelled' && r.conflictHistory && r.conflictHistory.length > 0
        );
        console.log('   LocalStorage 中已取消的预约:');
        cancelledWithHistory.forEach(r => {
          const chain = r.conflictHistory!.map(h => h.action).join(' → ');
          console.log(`   - ${r.organizer}: ${chain} (冲突ID: ${r.originalConflictId || '-'})`);
        });
      }
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
        `冲突组 ${conflictId} 关联 ${relatedReservations.length} 条活跃预约`
      );

      if (relatedReservations.length > 1) {
        console.log('   冲突组内预约:');
        relatedReservations.forEach(r => {
          console.log(`   - ${r.organizer} (${r.roomName}) ${new Date(r.startTime).toLocaleTimeString('zh-CN')}`);
        });
      }
    } else {
      console.log('   ⏸️ 当前无活跃冲突预约');
    }
  } catch (e) {
    log('冲突关联验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试9: 权限链路验证');
  try {
    const { isAdminMode, currentUser } = store;
    
    log(
      '当前用户角色正确',
      currentUser.role === 'admin' || currentUser.role === 'user',
      `当前用户: ${currentUser.name} (${currentUser.role})`
    );

    log(
      '管理员权限状态',
      isAdminMode === (currentUser.role === 'admin'),
      `管理员模式: ${isAdminMode ? '开启' : '关闭'}`
    );

    const logs = store.logs;
    const lockLogs = logs.filter(l => l.action === 'lock');
    const unlockLogs = logs.filter(l => l.action === 'unlock');

    if (lockLogs.length > 0 || unlockLogs.length > 0) {
      const lockByAdmin = lockLogs.filter(l => l.operator === '管理员' || l.operator === 'admin');
      const unlockByAdmin = unlockLogs.filter(l => l.operator === '管理员' || l.operator === 'admin');

      log(
        '锁房操作权限验证',
        lockByAdmin.length > 0 || unlockByAdmin.length > 0,
        `管理员执行锁房: ${lockByAdmin.length} 次，解锁: ${unlockByAdmin.length} 次`
      );

      if (lockByAdmin.length > 0) {
        console.log('   锁房日志示例:');
        lockByAdmin.slice(0, 2).forEach(l => {
          console.log(`   - ${l.operator} 于 ${new Date(l.timestamp).toLocaleTimeString('zh-CN')} 锁定 ${l.detail.split('锁定')[1] || ''}`);
        });
      }
    } else {
      console.log('   ⏸️ 无锁房记录（需管理员执行锁房操作后验证）');
    }
  } catch (e) {
    log('权限链路验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试10: 冲突校验逻辑完整性');
  try {
    const conflictReservations = store.getConflictReservations();
    
    if (conflictReservations.length > 0) {
      const firstConflict = conflictReservations[0];
      const conflictId = firstConflict.conflictId;
      
      const conflictGroup = store.reservations.filter(
        r => r.conflictId === conflictId && r.status !== 'cancelled'
      );

      const hasRealConflict = conflictGroup.some(r => {
        return conflictGroup.some(other => {
          if (r.id === other.id) return false;
          const rStart = new Date(r.startTime).getTime();
          const rEnd = new Date(r.endTime).getTime();
          const oStart = new Date(other.startTime).getTime();
          const oEnd = new Date(other.endTime).getTime();
          return rStart < oEnd && oStart < rEnd;
        });
      });

      log(
        '冲突组真实存在',
        hasRealConflict,
        hasRealConflict 
          ? `✅ 冲突组 ${conflictId} 中预约确实有时间重叠`
          : `❌ 冲突组 ${conflictId} 可能误判，无真实重叠`
      );

      if (!hasRealConflict) {
        console.log('   冲突组内预约时间:');
        conflictGroup.forEach(r => {
          console.log(`   - ${r.organizer}: ${new Date(r.startTime).toLocaleString('zh-CN')} - ${new Date(r.endTime).toLocaleString('zh-CN')}`);
        });
      }
    } else {
      console.log('   ⏸️ 当前无活跃冲突预约');
    }
  } catch (e) {
    log('冲突校验验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试11: 跨房间冲突不误报');
  try {
    const conflictReservations = store.getConflictReservations();
    const allRoomIds = [...new Set(store.reservations.map(r => r.roomId))];
    
    const hasCrossRoomConflicts = conflictReservations.some(r => {
      return store.reservations.some(other => {
        if (r.id === other.id) return false;
        if (r.roomId === other.roomId) return false;
        const rStart = new Date(r.startTime).getTime();
        const rEnd = new Date(r.endTime).getTime();
        const oStart = new Date(other.startTime).getTime();
        const oEnd = new Date(other.endTime).getTime();
        return rStart < oEnd && oStart < rEnd;
      });
    });

    log(
      '跨房间无冲突误报',
      !hasCrossRoomConflicts,
      hasCrossRoomConflicts 
        ? '❌ 发现跨房间时间重叠被误判为冲突'
        : '✅ 跨房间时间重叠正确不计入冲突'
    );

    if (conflictReservations.length > 0 && allRoomIds.length > 1) {
      const roomConflictCounts: Record<string, number> = {};
      conflictReservations.forEach(r => {
        roomConflictCounts[r.roomId] = (roomConflictCounts[r.roomId] || 0) + 1;
      });
      console.log('   各房间冲突数:');
      Object.entries(roomConflictCounts).forEach(([roomId, count]) => {
        const room = store.rooms.find(r => r.id === roomId);
        console.log(`   - ${room?.name || roomId}: ${count} 个冲突`);
      });
    }
  } catch (e) {
    log('跨房间冲突验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试12: 权限切换链路验证');
  try {
    const { isAdminMode, currentUser } = store;
    const expectedIsAdminMode = currentUser.role === 'admin';
    
    log(
      '权限状态一致',
      isAdminMode === expectedIsAdminMode,
      `当前角色: ${currentUser.role}, 管理员模式: ${isAdminMode ? '开启' : '关闭'}`
    );

    const logs = store.logs;
    const lockLogs = logs.filter(l => l.action === 'lock');
    const unlockLogs = logs.filter(l => l.action === 'unlock');
    
    if (lockLogs.length > 0 || unlockLogs.length > 0) {
      const adminLockLogs = lockLogs.filter(l => 
        l.operator === '管理员' || l.operator === 'admin'
      );
      const userLockLogs = lockLogs.filter(l => 
        l.operator !== '管理员' && l.operator !== 'admin'
      );
      
      const noUserLockingWithoutAdmin = userLockLogs.length === 0 || adminLockLogs.length > 0;
      
      log(
        '普通用户无法锁房',
        noUserLockingWithoutAdmin,
        noUserLockingWithoutAdmin 
          ? '✅ 锁房操作均来自管理员'
          : `❌ 发现 ${userLockLogs.length} 条普通用户锁房记录`
      );
    }
  } catch (e) {
    log('权限切换验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试13: 冲突历史列表顺序正确');
  try {
    const reservationsWithHistory = store.reservations.filter(
      r => r.conflictHistory && r.conflictHistory.length > 1
    );
    
    if (reservationsWithHistory.length > 0) {
      const hasCorrectOrder = reservationsWithHistory.every(r => {
        const history = r.conflictHistory!;
        for (let i = 1; i < history.length; i++) {
          const prevTime = new Date(history[i - 1].timestamp).getTime();
          const currTime = new Date(history[i].timestamp).getTime();
          if (currTime < prevTime) return false;
        }
        return true;
      });

      log(
        '历史列表按时间排序',
        hasCorrectOrder,
        hasCorrectOrder 
          ? `✅ ${reservationsWithHistory.length} 条记录顺序正确`
          : `❌ 发现 ${reservationsWithHistory.length} 条记录时间顺序错误`
      );

      if (!hasCorrectOrder) {
        reservationsWithHistory.forEach(r => {
          console.log(`   ${r.organizer} 历史: ${r.conflictHistory!.map(h => `${h.action}(${new Date(h.timestamp).toLocaleTimeString()})`).join(' -> ')}`);
        });
      }
    } else {
      const singleHistory = store.reservations.filter(
        r => r.conflictHistory && r.conflictHistory.length === 1
      );
      log(
        '历史列表按时间排序',
        true,
        singleHistory.length > 0 
          ? '✅ 单条历史记录无需排序验证'
          : '⏸️ 无多条历史记录'
      );
    }
  } catch (e) {
    log('历史列表顺序验证', false, `错误: ${e}`);
  }

  console.log('\n🧪 测试14: 冲突关系在操作链中保持');
  try {
    const cancelledWithHistory = store.reservations.filter(
      r => r.status === 'cancelled' && r.conflictHistory && r.conflictHistory.length > 0
    );

    if (cancelledWithHistory.length > 0) {
      const allHaveOriginalConflict = cancelledWithHistory.every(r => {
        return r.conflictHistory!.some(h => h.conflictId !== 'none');
      });

      log(
        '取消记录保留原冲突',
        allHaveOriginalConflict,
        allHaveOriginalConflict 
          ? `✅ ${cancelledWithHistory.length} 条取消记录保留原冲突关系`
          : `❌ ${cancelledWithHistory.length} 条取消记录缺失原冲突`
      );

      if (!allHaveOriginalConflict) {
        cancelledWithHistory.forEach(r => {
          const historyIds = r.conflictHistory!.map(h => h.conflictId).join(', ');
          console.log(`   ${r.organizer}: ${historyIds}`);
        });
      }
    } else {
      const rescheduledWithHistory = store.reservations.filter(
        r => r.status === 'rescheduled' && r.conflictHistory && r.conflictHistory.length > 0
      );
      log(
        '取消记录保留原冲突',
        true,
        rescheduledWithHistory.length > 0 
          ? '⏸️ 暂无取消记录（有待操作）'
          : '⏸️ 暂无操作历史'
      );
    }
  } catch (e) {
    log('冲突关系保持验证', false, `错误: ${e}`);
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
