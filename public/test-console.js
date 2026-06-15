// 会议室调度台 - 冲突历史链路验证脚本
// 使用方法：
// 1. 在浏览器控制台（F12）中粘贴此脚本
// 2. 按回车执行
// 3. 查看控制台输出

(function() {
  console.log('🧪 会议室调度台 - 冲突历史链路验证');
  console.log('========================================');

  // 测试1: 检查 LocalStorage 数据
  console.log('\n📋 测试1: LocalStorage 数据检查');
  try {
    const stored = JSON.parse(localStorage.getItem('room-scheduler-reservations') || '[]');
    console.log('✅ 成功读取 LocalStorage');
    console.log('   预约总数:', stored.length);

    // 检查冲突历史
    const withHistory = stored.filter(r => r.conflictHistory && r.conflictHistory.length > 0);
    const cancelledWithHistory = withHistory.filter(r => r.status === 'cancelled');

    console.log('   有冲突历史:', withHistory.length);
    console.log('   已取消且有历史:', cancelledWithHistory.length);

    if (cancelledWithHistory.length > 0) {
      console.log('\n   📝 已取消预约的冲突历史:');
      cancelledWithHistory.forEach(r => {
        console.log('   预约:', r.id);
        console.log('   组织者:', r.organizer);
        console.log('   原冲突ID:', r.originalConflictId || '-');
        console.log('   冲突历史数:', r.conflictHistory.length);
        console.log('   冲突历史链:', r.conflictHistory.map(h => h.action).join(' -> '));
        console.log('   ---');
      });
    }
  } catch (e) {
    console.error('❌ LocalStorage 读取失败:', e.message);
  }

  // 测试2: 检查操作日志
  console.log('\n📋 测试2: 操作日志检查');
  try {
    const logs = JSON.parse(localStorage.getItem('room-scheduler-logs') || '[]');
    console.log('✅ 成功读取日志');
    console.log('   日志总数:', logs.length);

    const cancelLogs = logs.filter(l => l.action === 'cancel');
    const rescheduleLogs = logs.filter(l => l.action === 'reschedule');

    console.log('   取消操作:', cancelLogs.length);
    console.log('   改期操作:', rescheduleLogs.length);

    // 检查日志中的冲突信息
    const cancelWithConflict = cancelLogs.filter(l => l.detail.includes('冲突'));
    const rescheduleWithConflict = rescheduleLogs.filter(l => l.detail.includes('冲突'));

    console.log('\n   📝 包含冲突信息的取消日志:');
    if (cancelWithConflict.length > 0) {
      cancelWithConflict.slice(0, 5).forEach(l => {
        console.log('   -', l.detail.substring(0, 100));
      });
    } else {
      console.log('   (无)');
    }

    console.log('\n   📝 包含冲突信息的改期日志:');
    if (rescheduleWithConflict.length > 0) {
      rescheduleWithConflict.slice(0, 5).forEach(l => {
        console.log('   -', l.detail.substring(0, 100));
      });
    } else {
      console.log('   (无)');
    }
  } catch (e) {
    console.error('❌ 日志读取失败:', e.message);
  }

  // 测试3: 统计冲突历史
  console.log('\n� 测试3: 冲突历史统计');
  try {
    const stored = JSON.parse(localStorage.getItem('room-scheduler-reservations') || '[]');

    // 统计各种场景
    const allHistoryActions = stored.flatMap(r => r.conflictHistory || []).map(h => h.action);
    const rescheduleCount = allHistoryActions.filter(a => a === 'reschedule').length;
    const cancelCount = allHistoryActions.filter(a => a === 'cancel').length;

    console.log('   改期记录数:', rescheduleCount);
    console.log('   取消记录数:', cancelCount);

    // 检查操作链完整性
    const reservationsWithChains = stored.filter(r => r.conflictHistory && r.conflictHistory.length > 1);
    console.log('   多步操作链:', reservationsWithChains.length);

    if (reservationsWithChains.length > 0) {
      console.log('\n   📝 多步操作链示例:');
      reservationsWithChains.slice(0, 3).forEach(r => {
        const chain = r.conflictHistory.map(h => h.action).join(' -> ');
        console.log(`   ${r.organizer}: ${chain}`);
      });
    }
  } catch (e) {
    console.error('❌ 统计失败:', e.message);
  }

  // 测试4: 检查初始数据状态
  console.log('\n📋 测试4: 初始数据验证');
  const stored = JSON.parse(localStorage.getItem('room-scheduler-reservations') || '[]');
  if (stored.length === 0) {
    console.log('   ⚠️ 暂无数据（需要先使用系统）');
    console.log('   请刷新页面，系统会自动加载初始数据');
  } else {
    const conflictReservations = stored.filter(r => r.conflictId);
    console.log('   当前冲突数:', conflictReservations.length);
    console.log('   冲突组ID示例:', conflictReservations.length > 0 ? conflictReservations[0].conflictId : '-');
  }

  console.log('\n========================================');
  console.log('✅ 验证完成！');
  console.log('\n💡 如果发现问题，请执行以下步骤复现:');
  console.log('   1. 找到冲突预约并改期（解除冲突）');
  console.log('   2. 取消该预约');
  console.log('   3. 展开详情查看冲突历史');
  console.log('   4. 检查日志中的冲突信息');
  console.log('   5. 重新执行此脚本验证\n');
})();
