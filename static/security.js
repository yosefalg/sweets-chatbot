// سياسة أمان المحتوى (Content Security Policy)
(function() {
  // منع النقر بالزر الأيمن على الصور (اختياري)
  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') {
      // يمكن تفعيله: e.preventDefault();
    }
  });
  
  // منع تضمين الموقع في iframe (حماية من clickjacking)
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }
  
  // تعطيل أدوات المطور في الإنتاج (تحذير فقط)
  if (window.location.hostname !== 'localhost') {
    console.log('%c⚠️ تحذير أمني', 'color: red; font-size: 30px;');
    console.log('%cلا تقم بلصق أي كود هنا إلا إذا كنت تثق بالمصدر.', 'color: white; font-size: 15px;');
  }
})();
