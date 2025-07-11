document.addEventListener('DOMContentLoaded', function() {
  const overtimeHours = document.getElementById('overtime-hours');
  const dateLabel = document.getElementById('date')
  const dayOts = document.getElementById('day-ots')
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  const maxHours = 35; // 100% 对应小时数
  // 设置小时数文本
  const colorByPercent = (percent) => {
    if (percent >= 100) return '#f6b000'; // 金色
    if (percent >= 90) return '#f59e0b';  // 深绿
    if (percent >= 70) return '#fbbf24';  // 亮绿
    if (percent >= 50) return '#fde68a';  // 浅绿
    return '#fffbeb';                        
  };
  // 加载数据
  loadData();
  // 加载数据
  function loadData() {
    chrome.storage.local.get('attendanceCache', function(res) {
      if(!res.attendanceCache) {
        console.log('No attendanceCache found')
         dayOts.innerHTML  = `<li class="ot-info">暂无数据，请进入北森系统</li>`;
        return
      }
      updateUI(res.attendanceCache)
    });

  }
  // 更新UI
  function updateUI(attendanceCache) {
    overtimeHours.innerText = `${attendanceCache.ot.toFixed(2)} 小时`
    dateLabel.innerText = attendanceCache.tiemCache
    let list =""
    attendanceCache.data.forEach(item=>{
      const tip = item.tips?` @${item.tips}`:''
      const isWeekend = ['公休日','节假日'].includes(item.DateTypeValue);
      const isWeekendOt = isWeekend && item.Ot > 0;
      list += `<li class="ot-info ${isWeekend&&'isWeekend'} ${isWeekendOt&&'isWeekendOt'}">${item.SwipingCardDate}(${item.DateTypeValue})：加班${item.Ot}小时${tip}</li>`
    })
    dayOts.innerHTML = list
    let current = attendanceCache.ot/maxHours * 100;
    text.innerText = `${current.toFixed(2)}%`
    bar.style.width = `${current}%`;
    bar.style.backgroundColor = colorByPercent(current);
  }
});