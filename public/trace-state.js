// 状态流转追踪脚本 - 精确复现"先改期再取消"流程
// 使用方法：
// 1. 在浏览器控制台（F12）粘贴此脚本
// 2. 按回车执行
// 3. 按照提示在页面中执行操作
// 4. 重新执行脚本查看状态变化

(function() {
  console.log('🔍 会议室调度台 - 状态流转追踪');
  console.log('========================================\n');

  // 读取当前状态
  const stored = JSON.parse(localStorage.getItem('room-scheduler-reservations') || '[]');
  const logs = JSON.parse(localStorage.getItem('room-scheduler-logs') || '[]');

  console.log('📊 当前状态概览:');
  console.log('   预约总数:', stored.length);
  console.log('   日志总数:', logs.length);

  // 找出当前冲突的预约
  const conflictReservations = stored.filter(r => r.conflictId);
  console.log('   当前冲突:', conflictReservations.length);

  // 找出有冲突历史的预约
  const withHistory = stored.filter(r => r.conflictHistory && r.conflictHistory.length > 0);
  console.log('   有历史记录:', withHistory.length);

  // 找出已取消的预约
  const cancelled = stored.filter(r => r.status === 'cancelled');
  console.log('   已取消:', cancelled.length);

  console.log('\n========================================');

  // 详细追踪冲突预约
  if (conflictReservations.length > 0) {
    console.log('\n⚠️ 当前冲突预约详情:');
    conflictReservations.forEach(r => {
      console.log(`\n  预约 ${r.id}:`);
      console.log(`    组织者: ${r.organizer}`);
      console.log(`    会议室: ${r.roomName}`);
      console.log(`    时间: ${new Date(r.startTime).toLocaleString('zh-CN')} - ${new Date(r.endTime).toLocaleString('zh-CN')}`);
      console.log(`    状态: ${r.status}`);
      console.log(`    当前冲突组ID: ${r.conflictId}`);
      console.log(`    冲突历史数: ${r.conflictHistory ? r.conflictHistory.length : 0}`);

      if (r.conflictHistory && r.conflictHistory.length > 0) {
        console.log(`    冲突历史链: ${r.conflictHistory.map(h => h.action).join(' -> ')}`);
        console.log(`    历史详情:`);
        r.conflictHistory.forEach((h, i) => {
          console.log(`      [${i + 1}] ${h.action}: 冲突ID=${h.conflictId}, 时间=${new Date(h.timestamp).toLocaleString('zh-CN')}`);
        });
      }
    });
  } else {
    console.log('\n✅ 当前无冲突预约');
  }

  // 追踪已取消的预约
  if (cancelled.length > 0) {
    console.log('\n❌ 已取消预约详情:');
    cancelled.forEach(r => {
      console.log(`\n  预约 ${r.id}:`);
      console.log(`    组织者: ${r.organizer}`);
      console.log(`    会议室: ${r.roomName}`);
      console.log(`    原预约时间: ${new Date(r.startTime).toLocaleString('zh-CN')} - ${new Date(r.endTime).toLocaleString('zh-CN')}`);
      console.log(`    当前冲突ID: ${r.conflictId || '(无)'}`);
      console.log(`    原冲突ID: ${r.originalConflictId || '(无)'}`);
      console.log(`    冲突历史数: ${r.conflictHistory ? r.conflictHistory.length : 0}`);

      if (r.conflictHistory && r.conflictHistory.length > 0) {
        console.log(`    冲突历史链: ${r.conflictHistory.map(h => h.action).join(' -> ')}`);
        console.log(`    历史详情:`);
        r.conflictHistory.forEach((h, i) => {
          console.log(`      [${i + 1}] ${h.action}`);
          console.log(`          冲突ID: ${h.conflictId}`);
          console.log(`          时间: ${new Date(h.timestamp).toLocaleString('zh-CN')}`);
          console.log(`          操作人: ${h.operator}`);
          console.log(`          详情: ${h.detail}`);
          console.log(`          关联预约数: ${h.relatedReservationIds.length}`);
        });
      } else {
        console.log(`    ⚠️ 已取消但无冲突历史记录！`);
      }
    });
  }

  // 追踪操作日志
  console.log('\n📝 最近操作日志 (前10条):');
  logs.slice(0, 10).forEach((log, i) => {
    const hasConflict = log.detail.includes('冲突');
    const symbol = hasConflict ? '⚠️' : '📌';
    console.log(`  ${i + 1}. ${symbol} [${log.action}] ${log.operator} - ${new Date(log.timestamp).toLocaleString('zh-CN')}`);
    console.log(`     ${log.detail}`);
  });

  // 问题诊断
  console.log('\n========================================');
  console.log('🔍 问题诊断:');

  const cancelledWithoutHistory = cancelled.filter(r => !r.conflictHistory || r.conflictHistory.length === 0);
  if (cancelledWithoutHistory.length > 0) {
    console.log('❌ 发现', cancelledWithoutHistory.length, '条已取消预约没有冲突历史记录');
    console.log('   这些预约可能是:');
    console.log('   1. 直接取消（从未在冲突组中）');
    console.log('   2. 取消逻辑有bug，历史记录丢失');
  }

  const cancelledWithMultipleHistory = cancelled.filter(r => r.conflictHistory && r.conflictHistory.length > 1);
  if (cancelledWithMultipleHistory.length > 0) {
    console.log('✅ 发现', cancelledWithMultipleHistory.length, '条已取消预约有完整冲突链');
    cancelledWithMultipleHistory.forEach(r => {
      const chain = r.conflictHistory.map(h => h.action === 'reschedule' ? '改期' : '取消').join(' -> ');
      console.log(`   ${r.organizer}: ${chain}`);
    });
  }

  // 检查冲突历史链完整性
  const historyChains = withHistory.map(r => ({
    id: r.id,
    organizer: r.organizer,
    chain: r.conflictHistory.map(h => h.action).join(' -> '),
    hasReschedule: r.conflictHistory.some(h => h.action === 'reschedule'),
    hasCancel: r.conflictHistory.some(h => h.action === 'cancel'),
    conflictIds: [...new Set(r.conflictHistory.map(h => h.conflictId))],
  }));

  if (historyChains.length > 0) {
    console.log('\n📊 冲突历史链分析:');
    historyChains.forEach(chain => {
      console.log(`  ${chain.organizer}: ${chain.chain}`);
      console.log(`    唯一冲突ID数: ${chain.conflictIds.length}`);
      if (chain.conflictIds.length > 1) {
        console.log(`    ⚠️ 发现多个不同的冲突ID，可能存在问题`);
        console.log(`       冲突IDs: ${chain.conflictIds.join(', ')}`);
      }
    });
  }

  console.log('\n========================================');
  console.log('💡 建议操作:');
  console.log('   1. 找到一条冲突预约（会议室A的两条重叠预约）');
  console.log('   2. 点击改期图标，将时间改为无冲突的时间段');
  console.log('   3. 确认改期成功');
  console.log('   4. 取消该预约');
  console.log('   5. 重新执行此脚本');
  console.log('   6. 检查"已取消预约详情"中是否有完整的历史链\n');
})();
