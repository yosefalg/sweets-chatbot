// نظام تحليلات بسيط (بدون اعتماد على Google)
const Analytics = {
  // إرسال حدث مشاهدة صفحة
  pageView: function() {
    const data = {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      screen: `${window.screen.width}x${window.screen.height}`
    };
    
    // حفظ محلياً (يمكن ربطه لاحقاً بقاعدة بيانات)
    this.log('pageview', data);
    
    // إرسال للخادم
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'pageview', data: data })
    }).catch(() => {});
  },
  
  // تتبع النقر على الأنمي
  trackAnimeClick: function(animeId, animeTitle) {
    this.log('anime_click', { id: animeId, title: animeTitle });
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'anime_click', data: { id: animeId, title: animeTitle } })
    }).catch(() => {});
  },
  
  log: function(event, data) {
    console.log(`[AnimeAI Analytics] ${event}:`, data);
  }
};

// تسجيل مشاهدة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
  Analytics.pageView();
});
