// 控制台测试脚本 - 用于在浏览器控制台中验证冲突历史链路
// 打开浏览器控制台（F12），粘贴以下代码并按回车执行

(function() {
  console.log('🧪 会议室调度台 - 冲突历史链路测试脚本');
  console.log('========================================\n');

  // 获取 store 状态
  const store = window.__zustandStore;
  if (!store) {
    console.error('❌ 未找到 Zustand store，请在 React 开发环境中使用');
    return;
  }

  const state = store.getState();

  // 测试1: 检查冲突历史数据结构
  console.log('📋 测试1: 检查冲突历史数据结构');
  const reservationsWithHistory = state.reservations.filter(
    r => r.conflictHistory && r.conflictHistory.length > 0
  );

  if (reservationsWithHistory.length > 0) {
    console.log('✅ 找到', reservationsWithHistory.length, '条有冲突历史的预约');
    reservationsWithHistory.forEach(r => {
      console.log(`\n预约 ${r.id} (${r.organizer}):`);
      console.log('  状态:', r.status);
      console.log('  原冲突ID:', r.originalConflictId || '-');
      console.log('  冲突历史:');
      r.conflictHistory.forEach((h, i) => {
        console.log(`    [${i + 1}] ${h.action} - ${h.conflictId} - ${h.operator}`);
        console.log(`        ${h.detail}`);
      });
    });
  } else {
    console.log('⚠️ 暂无冲突历史记录（需要先执行改期或取消操作）');
  }

  console.log('\n========================================\n');

  // 测试2: 检查操作日志
  console.log('📋 测试2: 最近的操作日志');
  const recentLogs = state.logs.slice(0, 5);
  recentLogs.forEach((log, i) => {
    const hasConflict = log.detail.includes('冲突');
    console.log(`${i + 1}. [${log.action}] ${hasConflict ? '⚠️' : '✓'} ${log.detail}`);
  });

  console.log('\n========================================\n');

  // 测试3: 统计信息
  console.log('📊 统计信息');
  console.log('  预约总数:', state.reservations.length);
  console.log('  当前冲突数:', state.getConflictReservations().length);
  console.log('  有历史记录的:', reservationsWithHistory.length);
  console.log('  已取消:', state.reservations.filter(r => r.status === 'cancelled').length);
  console.log('  已改期:', state.reservations.filter(r => r.status === 'rescheduled').length);

  console.log('\n========================================\n');

  // 测试4: LocalStorage 检查
  console.log('📋 测试4: LocalStorage 数据');
  try {
    const stored = JSON.parse(localStorage.getItem('room-scheduler-reservations') || '[]');
    const hasConflictHistory = stored.some(
      (r: any) => r.conflictHistory && r.conflictHistory.length > 0
    );
    console.log('✅ LocalStorage 预约数:', stored.length);
    console.log(hasConflictHistory ? '✅ 包含冲突历史数据' : '⚠️ 暂无冲突历史数据');
  } catch (e) {
    console.error('❌ LocalStorage 读取失败:', e);
  }

  console.log('\n========================================');
  console.log('✅ 测试完成！');
  console.log('提示: 展开预约详情可查看冲突历史标签');
  console.log('提示: 导出数据可查看完整的冲突历史链\n');
})();
