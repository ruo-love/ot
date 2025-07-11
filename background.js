import dayjs from './util/dayjs.js';
// 后台服务脚本
// 存储考勤数据
let attendanceCache = {};

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // 保存考勤数据
  if (request.action === 'saveAttendanceData') {
    parseAttendanceData(request.data);
    sendResponse({ success: true });
    return true;
  }
  // 页面加载完成
  if (request.action === 'pageLoaded') {
    sendResponse({ success: true });
    return true;
  }

});

// 处理考勤数据
function parseAttendanceData(rawData) {
  try {
    const datas = rawData.data
    const time = rawData.time
    attendanceCache = {
      ot:0,
      data:[],
      tiemCache:time
    }
    if(datas.length==0) return
    datas.forEach((item)=>{
      const DateTypeValue = item.DateType.text // 公休日、工作日、节假日
      const RetroactiveRemarkText = getValue(item,'RetroactiveRemark.value','') // 补卡备注
      const matchs = RetroactiveRemarkText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/g);
      const RetroactiveRemark = matchs ? matchs : [];
      const [firstRetroactiveRemark,lastRetroactiveRemark] = RetroactiveRemark;
      const ActualForFirstCardValue = getValue(item,'ActualForFirstCard.value',RetroactiveRemark.length>1? firstRetroactiveRemark:firstRetroactiveRemark||'上班未打卡') // 上班打卡时间
      const ActualForLastCardValue = getValue(item,'ActualForLastCard.value',RetroactiveRemark.length>1? lastRetroactiveRemark:firstRetroactiveRemark||'下班未打卡')  // 下班打卡时间
      const SwipingCardDate = getValue(item,'SwipingCardDate.text')
      
      const {workHours, Ot , tips} = getOt(DateTypeValue,ActualForFirstCardValue,ActualForLastCardValue,RetroactiveRemark)
      const target = {
        DateTypeValue,
        ActualForFirstCardValue,
        ActualForLastCardValue,
        firstRetroactiveRemark,
        lastRetroactiveRemark,
        RetroactiveRemark,
        SwipingCardDate,
        Ot,
        workHours,
        tips
      }
      attendanceCache.ot+=Ot
      attendanceCache.data.push(target)
    })
    console.log("attendanceCache",attendanceCache)
    // 保存到本地存储
    saveAttendanceCache();
    
  } catch (error) {
    console.error('处理考勤数据时出错:', error);
  }
}
function getOt(DateTypeValue,startTimeText, endTimeText,RetroactiveRemark) {
  const isWeekend = ['公休日','节假日'].includes(DateTypeValue);
  const res = { workHours: 0, Ot: 0 , tips:""};
  if(RetroactiveRemark.length>0){
    res.tips += `补卡：${RetroactiveRemark.join('---')}`;
  }
  if(isWeekend&&startTimeText=='上班未打卡'&&endTimeText=='下班未打卡'){
    return res;
  }
  if(DateTypeValue == '工作日' && startTimeText=='上班未打卡'){
    res.tips += '上班未打卡'
    return res;
  }
  if(DateTypeValue == '工作日' && endTimeText=='下班未打卡'){
    res.tips += '下班未打卡'
    return res;
  }
  const startDate = dayjs(startTimeText);
  const endDate = dayjs(endTimeText);
  const diffMinutes = endDate.diff(startDate, 'minute');
  const workMinutes = Math.max(0, diffMinutes - 60); // 扣除午休1小时
  res.workHours = parseFloat((workMinutes / 60));
  res.Ot = isWeekend ? Math.min(Math.floor(res.workHours),8) : Math.max(0, (res.workHours - 8).toFixed(2));
  return res
}



// 保存考勤缓存到存储
function saveAttendanceCache() {
  chrome.storage.local.set({ 'attendanceCache': attendanceCache }, function() {
    console.log('考勤数据attendanceCache已保存到本地存储',attendanceCache);
  });
}

function getValue(obj, path, defaultValue = undefined) {
  const keys = path
    .replace(/\[(\d+)\]/g, '.$1') // 支持数组形式的路径
    .split('.')
    .filter(Boolean); // 移除空项

  let result = obj;
  for (const key of keys) {
    if (result != null && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }
  }
  return result;
}
