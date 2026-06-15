// 会议室调度台 - 完整验证脚本（可执行版本）
// 在浏览器控制台（F12）中粘贴并执行

(function() {
  console.log('🧪 会议室调度台 - 完整验证测试');
  console.log('========================================\n');

  // 读取数据
  const reservations = JSON.parse(localStorage.getItem('room-scheduler-reservations') || '[]');
  const logs = JSON.parse(localStorage.getItem('room-scheduler-logs') || '[]');
  const filters = JSON.parse(localStorage.getItem('room-scheduler-filters') || 'null');

  const TEST_RESULTS = [];
  
  const test = (name, passed, message) => {
    TEST_RESULTS.push({ name, passed, message });
    console.log(passed ? `✅ ${name}: ${message}` : `❌ ${name}: ${message}`);
    return passed;
  };

  console.log('📊 初始数据状态:');
  console.log(`   预约总数: ${reservations.length}`);
  console.log(`   日志总数: ${logs.length}`);
  console.log(`   筛选条件: ${filters ? JSON.stringify(filters) : '(未设置)'}\n`);

  // ===== 基础验证（应该通过）=====
  console.log('📋 基础验证（应该通过）:\n');

  test(
    '1. 筛选条件持久化',
    filters !== null,
    filters ? `筛选条件已保存: roomId=${filters.roomId || '全部'}, status=${filters.status || '全部'}` : '筛选条件未保存'
  );

  // ===== 初始数据验证（不应该有假历史）=====
  console.log('\n📋 初始数据验证:\n');

  const reservationsWithHistory = reservations.filter(
    r => r.conflictHistory && r.conflictHistory.length > 0
  );

  test(
    '2. 初始数据无假历史',
    reservationsWithHistory.length === 0,
    reservationsWithHistory.length === 0 
      ? '✅ 初始数据正确，无假历史' 
      : `❌ 发现 ${reservationsWithHistory.length} 条假历史`
  );

  if (reservationsWithHistory.length > 0) {
    reservationsWithHistory.slice(0, 3).forEach(r => {
      console.log(`   ❌ ${r.organizer} (${r.roomName}): ${r.conflictHistory.length} 条历史`);
    });
  }

  // ===== 冲突组验证 ======
  console.log('\n📋 冲突组验证:\n');

  const conflictReservations = reservations.filter(r => r.conflictId);
  test(
    '3. 存在可测试的冲突预约',
    conflictReservations.length > 0,
    conflictReservations.length > 0 
      ? `✅ 有 ${conflictReservations.length} 个冲突预约可用于测试` 
      : '❌ 无冲突预约，无法测试'
  );

  if (conflictReservations.length > 0) {
    console.log('   可用冲突预约:');
    conflictReservations.slice(0, 3).forEach(r => {
      console.log(`   - ${r.organizer} (${r.roomName}) ${new Date(r.startTime).toLocaleTimeString('zh-CN')} 冲突ID: ${r.conflictId}`);
    });
  }

  // ===== 核心验证（需要操作后才能验证）=====
  console.log('\n📋 核心验证（需执行操作）:\n');

  const cancelledReservations = reservations.filter(r => r.status === 'cancelled');
  
  if (cancelledReservations.length === 0) {
    console.log('   ⏸️ 暂无取消记录，需执行以下步骤:\n');
    console.log('   📝 请按以下步骤操作:\n');
    console.log('   步骤1: 找到冲突预约并改期');
    console.log('   1) 在预约列表找到会议室A的冲突预约（张三 09:00-10:00）');
    console.log('   2) 点击改期图标（铅笔）');
    console.log('   3) 改为 10:30-11:30');
    console.log('   4) 点击"确认改期"\n');
    console.log('   步骤2: 取消该预约');
    console.log('   1) 点击取消图标（垃圾桶）\n');
    console.log('   步骤3: 验证结果');
    console.log('   1) 展开预约详情，查看"冲突历史"标签');
    console.log('   2) 预期：应显示 [改期] → [取消] 完整链');
    console.log('   3) 查看操作日志，预期：包含"操作链"信息\n');
    console.log('   步骤4: 重新运行此脚本验证');
    console.log('   1) 粘贴此脚本到控制台');
    console.log('   2) 查看验证结果\n');
  } else {
    // 有取消记录，验证历史完整性
    const cancelledWithHistory = cancelledReservations.filter(
      r => r.conflictHistory && r.conflictHistory.length > 0
    );

    test(
      '4. 取消记录保留冲突历史',
      cancelledWithHistory.length > 0,
      cancelledWithHistory.length > 0 
        ? `✅ ${cancelledWithHistory.length}/${cancelledReservations.length} 条取消记录有历史`
        : `❌ ${cancelledWithHistory.length}/${cancelledReservations.length} 条取消记录有历史`
    );

    if (cancelledWithHistory.length > 0) {
      console.log('\n   已取消预约的冲突历史:');
      cancelledWithHistory.forEach(r => {
        const chain = r.conflictHistory.map(h => h.action).join(' → ');
        console.log(`   📌 ${r.organizer}: ${chain}`);
        console.log(`      原冲突ID: ${r.originalConflictId || '-'}`);
        r.conflictHistory.forEach((h, i) => {
          console.log(`      [${i + 1}] ${h.action}: ${h.conflictId}`);
        });
      });

      // 验证是否有完整的"先改期再取消"链
      const hasCompleteChain = cancelledWithHistory.some(r => {
        const history = r.conflictHistory;
        const hasReschedule = history.some(h => h.action === 'reschedule');
        const hasCancel = history.some(h => h.action === 'cancel');
        return hasReschedule && hasCancel;
      });

      test(
        '5. 存在完整的"先改期再取消"链',
        hasCompleteChain,
        hasCompleteChain 
          ? '✅ 找到完整的历史链 (reschedule → cancel)'
          : '❌ 无完整历史链'
      );

      if (!hasCompleteChain) {
        console.log('\n   ⚠️ 缺少完整的"先改期再取消"链');
        console.log('   可能原因：');
        console.log('   1. 改期操作未成功（被时间冲突拦截）');
        console.log('   2. 取消操作在改期之前执行');
        console.log('   3. 改期/取消逻辑有bug，历史记录丢失\n');
      }
    } else {
      console.log('\n   ❌ 所有取消记录都缺少冲突历史');
      console.log('   这表明冲突历史记录有bug\n');
    }
  }

  // ===== 操作日志验证 =====
  console.log('\n📋 操作日志验证:\n');

  const cancelLogs = logs.filter(l => l.action === 'cancel');
  const rescheduleLogs = logs.filter(l => l.action === 'reschedule');

  console.log(`   取消日志: ${cancelLogs.length} 条`);
  console.log(`   改期日志: ${rescheduleLogs.length} 条\n`);

  if (cancelLogs.length > 0) {
    const cancelLogsWithConflict = cancelLogs.filter(l => l.detail.includes('冲突'));
    const cancelLogsWithChain = cancelLogs.filter(l => l.detail.includes('操作链'));

    test(
      '6. 取消日志包含冲突信息',
      cancelLogsWithConflict.length === cancelLogs.length,
      `${cancelLogsWithConflict.length}/${cancelLogs.length} 条包含冲突信息`
    );

    test(
      '7. 取消日志显示操作顺序',
      cancelLogsWithChain.length > 0,
      cancelLogsWithChain.length > 0 
        ? `✅ ${cancelLogsWithChain.length} 条包含操作链信息`
        : '❌ 无日志包含操作链'
    );

    if (cancelLogsWithChain.length > 0) {
      console.log('\n   操作链示例:');
      cancelLogsWithChain.slice(0, 2).forEach(l => {
        console.log(`   - ${l.detail.substring(0, 100)}...`);
      });
    }
  } else {
    console.log('   ⏸️ 无取消日志\n');
  }

  if (rescheduleLogs.length > 0) {
    const rescheduleLogsWithConflict = rescheduleLogs.filter(l => l.detail.includes('冲突'));

    test(
      '8. 改期日志包含冲突信息',
      rescheduleLogsWithConflict.length === rescheduleLogs.length,
      `${rescheduleLogsWithConflict.length}/${rescheduleLogs.length} 条包含冲突信息`
    );

    if (rescheduleLogsWithConflict.length > 0) {
      console.log('\n   改期日志示例:');
      rescheduleLogsWithConflict.slice(0, 2).forEach(l => {
        console.log(`   - ${l.detail.substring(0, 100)}...`);
      });
    }
  } else {
    console.log('   ⏸️ 无改期日志\n');
  }

  // ===== LocalStorage 持久化验证 =====
  console.log('\n📋 LocalStorage 持久化验证:\n');

  const hasConflictHistoryInStorage = reservations.some(
    r => r.conflictHistory && r.conflictHistory.length > 0
  );

  test(
    '9. LocalStorage 保留冲突历史',
    hasConflictHistoryInStorage || cancelledReservations.length === 0,
    hasConflictHistoryInStorage 
      ? '✅ LocalStorage 中有冲突历史数据'
      : cancelledReservations.length === 0 
        ? '⏸️ 暂无冲突历史（需执行操作）'
        : '❌ LocalStorage 中无冲突历史但有取消记录'
  );

  // ===== 总结 =====
  console.log('\n========================================');
  const passed = TEST_RESULTS.filter(t => t.passed).length;
  const failed = TEST_RESULTS.filter(t => !t.passed).length;
  
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败\n`);
  
  if (failed > 0) {
    console.log('❌ 失败的测试:');
    TEST_RESULTS.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}: ${t.message}`);
    });
  }

  console.log('========================================\n');
  
  console.log('💡 后续验证步骤:');
  console.log('   1. 执行"先改期再取消"操作');
  console.log('   2. 展开预约详情查看冲突历史');
  console.log('   3. 查看操作日志');
  console.log('   4. 导出预约数据验证CSV');
  console.log('   5. 刷新页面验证持久化');
  console.log('   6. 重新运行此脚本验证\n');
})();
