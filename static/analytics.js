const Analytics = {
    pageView: () => {
        fetch('/api/analytics', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'pageview', data:{ path: location.pathname } }) });
    },
    trackClick: (id, title) => {
        fetch('/api/analytics', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'click', data:{ id, title } }) });
    }
};
document.addEventListener('DOMContentLoaded', Analytics.pageView);};

// تسجيل مشاهدة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
  Analytics.pageView();
});
