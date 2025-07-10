
(function interceptNetwork() {
  const targetUrl = '/api/v2/UI/TableList';

  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = args[0];
    const options = args[1];

    // Check if it's the target request
    if (typeof url === 'string' && url.includes(targetUrl) && url.includes('Attendance.AttendanceStatistics')) {
      console.log('[助手] 拦截到考勤数据请求。');

      // Deep copy options to modify them safely.
      const newOptions = JSON.parse(JSON.stringify(options));

      if (newOptions.body) {
        try {
          const body = JSON.parse(newOptions.body);
          body.table_data.paging.capacity = 400; // 修改 pageSize
          const queryDate =  body.search_data.items.find(e=>e.name=="Attendance.AttendanceStatistics.SwipingCardDate")
          newOptions.body = JSON.stringify(body);
          console.log('[助手] 发送修改后的请求...');
          originalFetch(url, newOptions)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              console.log('[助手] 成功获取修改后请求的考勤数据。',data);
              window.postMessage({ source: 'attendance-helper', payload: {data:data.biz_data,time:queryDate.value} }, '*');
            })
            .catch(e => {
              console.error('[助手] 修改后的请求失败:', e);
            });

        } catch (e) {
          console.error('[助手] 请求体处理或修改失败:', e);
        }
      }
    }

    // IMPORTANT: Let the original, unmodified request proceed
    return originalFetch.apply(this, args);
  };

  // I'm removing the XHR interception logic for sending messages,
  // as the fetch interceptor now handles getting the data.
  // This prevents duplicate messages.
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._isAttendance = typeof url === 'string' && url.includes(targetUrl) && url.includes('Attendance.AttendanceStatistics');
    return originalXhrOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (this._isAttendance) {
      console.log('[助手] 拦截到考勤数据 XHR 请求 (已忽略，由 fetch 拦截器处理)。');
    }
    return originalXhrSend.apply(this, args);
  };

  console.log('[助手] 网络拦截脚本已注入 (v2: 带请求修改功能)');
})();
