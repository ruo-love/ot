(function injectHook() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('interceptor.js');
  document.documentElement.appendChild(script);
  script.onload = () => {
    console.log('加班统计助手: 注入网络拦截脚本');
    script.remove();
  };

  // 页面注入脚本用 window.postMessage 通信
  window.addEventListener('message', function(event) {
    if(event.data.source == 'attendance-helper'){
      // 转发给插件后台
      chrome.runtime.sendMessage({
        action: 'saveAttendanceData',
        data: event.data.payload
      });
    }
  });
})();
