// تحسينات الأداء
(function() {
  // تأجيل تحميل الصور غير المرئية
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.src = img.dataset.src;
    });
  }
  
  // مراقبة أداء الصفحة
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime / 1000, 'ثانية');
        }
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }
  
  // Prefetch للروابط عند التحويم
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    link.addEventListener('mouseenter', () => {
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = link.href;
      document.head.appendChild(prefetchLink);
    });
  });
})();
