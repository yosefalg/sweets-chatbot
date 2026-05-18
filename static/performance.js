document.querySelectorAll('a[href^="/"]').forEach(link => {
    link.addEventListener('mouseenter', () => {
        const prefetch = document.createElement('link');
        prefetch.rel = 'prefetch'; prefetch.href = link.href;
        document.head.appendChild(prefetch);
    });
});
