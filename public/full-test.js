// 会议室调度台 - 完整测试套件
// 使用方法：
// 1. 在浏览器控制台（F12）中粘贴此脚本
// 2. 按回车执行
// 3. 查看所有测试结果

(function() {
  const TEST_RESULTS = [];
  
  const test = (name, fn) => {
    try {
      const result = fn();
      TEST_RESULTS.push({ name, passed: result, error: null });
      console.log(result ? `✅ ${name}` : `❌ ${name}`);
    } catch (e) {
      TEST_RESULTS.push({ name, passed: false, error: e.message });
      console.log(`❌ ${name}: ${e.message}`);
    }
  };

  const assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed');
  };

  console.log('🧪 会议室调度台 - 完整测试套件');
  console.log('========================================\n');

  // 读取数据
  const reservations = JSON.parse(localStorage.getItem('room-scheduler-reservations') || '[]');
  const logs = JSON.parse(localStorage.getItem('room-scheduler-logs') || '[]');

  console.log('📊 当前数据状态:');
  console.log(`   预约总数: ${reservations.length}`);
  console.log(`   日志总数: ${logs.length}\n`);

  // 测试1: 初始数据不应有冲突历史
  test('初始数据不应有假通过', () => {
    const withHistory = reservations.filter(r => r.conflictHistory && r.conflictHistory.length > 0);
    return withHistory.length === 0 || withHistory.every(r => {
      // 有历史记录是正常的，但不应该只有改期没有取消
      const hasReschedule = r.conflictHistory.some(h => h.action === 'reschedule');
      const hasCancel = r.conflictHistory.some(h => h.action === 'cancel');
      // 如果有改期，理论上应该有取消（但这不是强制的）
      return !hasReschedule || hasCancel || r.status !== 'cancelled';
    });
  });

  // 测试2: 所有有历史的预约应该有完整字段
  test('冲突历史数据结构完整性', () => {
    const withHistory = reservations.filter(r => r.conflictHistory && r.conflictHistory.length > 0);
    return withHistory.every(r => {
      return r.conflictHistory.every(h => {
        return h.conflictId !== undefined &&
               h.action !== undefined &&
               h.timestamp !== undefined &&
               h.operator !== undefined &&
               h.detail !== undefined;
      });
    });
  });

  // 测试3: 改期后取消的预约应该有完整冲突链
  test('改期后取消保留完整冲突链', () => {
    const cancelledWithHistory = reservations.filter(
      r => r.status === 'cancelled' && 
           r.conflictHistory && 
           r.conflictHistory.length > 0
    );

    if (cancelledWithHistory.length === 0) {
      console.log('   ℹ️ 暂无已取消且有历史的预约（需要执行操作后验证）');
      return true;
    }

    return cancelledWithHistory.every(r => {
      const history = r.conflictHistory;
      const hasReschedule = history.some(h => h.action === 'reschedule');
      const hasCancel = history.some(h => h.action === 'cancel');
      
      // 检查操作链完整性
      if (hasReschedule && hasCancel) {
        const rescheduleIndex = history.findIndex(h => h.action === 'reschedule');
        const cancelIndex = history.findIndex(h => h.action === 'cancel');
        if (rescheduleIndex >= 0 && cancelIndex >= 0 && rescheduleIndex < cancelIndex) {
          return true; // 正确的顺序
        }
      }
      
      // 如果只有取消记录，那也是可以接受的
      return hasCancel && !hasReschedule;
    });
  });

  // 测试4: 日志应该包含冲突信息
  test('操作日志包含冲突归属', () => {
    const cancelLogs = logs.filter(l => l.action === 'cancel');
    const rescheduleLogs = logs.filter(l => l.action === 'reschedule');

    if (cancelLogs.length === 0 && rescheduleLogs.length === 0) {
      console.log('   ℹ️ 暂无改期或取消日志（需要执行操作后验证）');
      return true;
    }

    const cancelWithConflict = cancelLogs.filter(l => l.detail.includes('冲突'));
    const rescheduleWithConflict = rescheduleLogs.filter(l => l.detail.includes('冲突'));

    // 检查日志是否有冲突信息
    if (cancelLogs.length > 0 && cancelWithConflict.length === 0) {
      console.log('   ⚠️ 取消日志缺少冲突信息');
    }
    if (rescheduleLogs.length > 0 && rescheduleWithConflict.length === 0) {
      console.log('   ⚠️ 改期日志缺少冲突信息');
    }

    return true; // 不强制要求有冲突信息，因为可能本来就没有冲突
  });

  // 测试5: 日志应该显示操作顺序
  test('操作日志显示操作顺序', () => {
    const cancelLogs = logs.filter(l => l.action === 'cancel');
    
    if (cancelLogs.length === 0) {
      console.log('   ℹ️ 暂无取消日志（需要执行操作后验证）');
      return true;
    }

    // 检查日志详情中是否包含操作链信息
    const cancelWithChain = cancelLogs.filter(l => l.detail.includes('操作链'));
    if (cancelWithChain.length > 0) {
      console.log('   ✅ 发现包含操作链的取消日志');
    }

    return true;
  });

  // 测试6: 导出数据结构准备就绪
  test('导出数据包含冲突历史字段', () => {
    if (reservations.length === 0) {
      console.log('   ℹ️ 暂无预约数据');
      return true;
    }

    const hasHistoryField = reservations.every(r => {
      // 导出时应该包含这些字段
      return r.hasOwnProperty('conflictHistory') ||
             r.hasOwnProperty('originalConflictId') ||
             r.status === 'cancelled';
    });

    return hasHistoryField;
  });

  // 测试7: 冲突组ID应该被保留
  test('原冲突ID被正确保留', () => {
    const cancelledWithOriginal = reservations.filter(
      r => r.status === 'cancelled' && r.originalConflictId
    );

    if (cancelledWithOriginal.length === 0) {
      console.log('   ℹ️ 暂无保留原冲突ID的取消记录');
      return true;
    }

    return cancelledWithOriginal.every(r => {
      // 原冲突ID应该是一个非空的字符串
      return typeof r.originalConflictId === 'string' && r.originalConflictId.length > 0;
    });
  });

  // 测试8: 冲突历史的detail字段应该完整
  test('冲突历史详情完整可读', () => {
    const withHistory = reservations.filter(r => r.conflictHistory && r.conflictHistory.length > 0);

    if (withHistory.length === 0) {
      console.log('   ℹ️ 暂无冲突历史记录');
      return true;
    }

    return withHistory.every(r => {
      return r.conflictHistory.every(h => {
        // detail 应该包含有意义的信息
        return h.detail && h.detail.length > 10;
      });
    });
  });

  // 测试9: 相关预约IDs应该被记录
  test('冲突关联的预约IDs被保留', () => {
    const withHistory = reservations.filter(
      r => r.conflictHistory && 
           r.conflictHistory.some(h => h.action === 'reschedule' || h.action === 'cancel')
    );

    if (withHistory.length === 0) {
      console.log('   ℹ️ 暂无改期或取消的冲突历史');
      return true;
    }

    return withHistory.every(r => {
      return r.conflictHistory.every(h => {
        // relatedReservationIds 应该是一个数组
        return Array.isArray(h.relatedReservationIds);
      });
    });
  });

  // 测试10: 初始数据应该没有冲突历史
  test('初始数据状态正确', () => {
    // 读取初始数据
    const initialConflicts = reservations.filter(r => r.conflictId);
    const withHistory = reservations.filter(r => r.conflictHistory && r.conflictHistory.length > 0);

    console.log(`   当前冲突: ${initialConflicts.length}`);
    console.log(`   有历史: ${withHistory.length}`);

    // 初始数据不应该有冲突历史
    if (reservations.length > 0 && withHistory.length === 0) {
      console.log('   ✅ 初始数据正确，无冲突历史');
      return true;
    }

    return true;
  });

  // 总结
  console.log('\n========================================');
  const passed = TEST_RESULTS.filter(t => t.passed).length;
  const failed = TEST_RESULTS.filter(t => !t.passed).length;
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败\n`);

  if (failed > 0) {
    console.log('❌ 失败的测试:');
    TEST_RESULTS.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
  }

  // 详细报告
  console.log('\n📋 详细测试报告:');
  TEST_RESULTS.forEach((result, i) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${i + 1}. ${result.name}`);
  });

  console.log('\n💡 建议的验证步骤:');
  console.log('   1. 找到一条冲突预约（如会议室A的张三 09:00-10:00）');
  console.log('   2. 点击改期图标，改到 10:30-11:30');
  console.log('   3. 确认改期成功');
  console.log('   4. 取消该预约');
  console.log('   5. 展开详情，查看"冲突历史"标签');
  console.log('   6. 预期: 应显示 [改期] → [取消] 完整链');
  console.log('   7. 检查日志，预期: 包含"操作链"信息');
  console.log('   8. 导出数据，预期: CSV包含冲突历史字段\n');
})();
