/**
 * Loon Script: Zhihu Web Enhanced (知乎网页版全能增强 - 基于 XIU2 核心逻辑移植)
 * 功能：
 * 1. 彻底屏蔽 iOS Safari 移动端“打开 App”弹窗、顶部/底部呼起条、横幅
 * 2. 彻底屏蔽强制登录弹窗与灰色遮罩，恢复免登录全屏自由滚动
 * 3. 拦截网页端广告卡片、推广与未登录限制
 * 4. DOM 层静默解码替换所有 link.zhihu.com 外链为原始目标链接
 * 5. 阻止网页自动唤醒 zhihu:// 客户端协议
 */

if ($response.body && $response.headers) {
    const contentType = $response.headers['Content-Type'] || $response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
        let body = $response.body;

        // 1. 静态 CSS 样式预注入：页面加载第一帧即隐藏全部弹窗、呼端条与广告
        const injectStyle = `
<style id="loon-zhihu-enhanced-style">
/* 屏蔽移动端唤端与打开 App 弹窗、横幅、顶部条 */
.OpenInApp,
.OpenInAppButton,
.OpenInApp-button,
.MobileAppHeader,
.MobileAppHeader-downloadLink,
.DownloadGuide,
.CallApp,
.AppBanner,
.MobileModal,
.HotQuestions-bottomDownload,
.ExploreHomePage-downloadCard,
.Question-bottomDownload,
div[class*="OpenInApp"],
div[class*="DownloadGuide"],
div[class*="CallApp"],
div[class*="AppBanner"],
a[href*="apps.apple.com/app/id432101648"],
a[href*="zhihu://"],

/* 屏蔽免登录弹窗与遮罩层 */
.signFlowModal,
.Modal-wrapper,
.Modal-backdrop,
.Modal-enter-done,
.Modal-closeButton,

/* 屏蔽各类网页端广告卡片与右下角浮动弹窗 */
.Pc-card,
.AdCard,
.ad-container,
.ad-popup,
.fixed-ad,
.TopStory-ad,
div[style*="position: fixed"][style*="bottom:"][style*="right:"],
div[style*="position:fixed"][style*="bottom:"][style*="right:"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    height: 0 !important;
}

/* 强制恢复免登录滚动与页面正常布局 */
html, body {
    overflow: auto !important;
    position: static !important;
    height: auto !important;
    -webkit-overflow-scrolling: touch !important;
}
</style>`;

        // 2. 动态 JS 注入：深度清理 React DOM 动态节点、外链解密直达与阻断自动唤端
        const injectScript = `
<script id="loon-zhihu-enhanced-script">
(function() {
    'use strict';

    // 1. 解密并直接替换 DOM 中所有被知乎重定向包裹的外链
    function cleanLinks() {
        const links = document.querySelectorAll('a[href*="link.zhihu.com/?target="]');
        links.forEach(a => {
            try {
                const href = a.getAttribute('href');
                const targetIdx = href.indexOf('target=');
                if (targetIdx !== -1) {
                    const rawTarget = href.substring(targetIdx + 7).split('&')[0];
                    const decoded = decodeURIComponent(rawTarget);
                    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
                        a.setAttribute('href', decoded);
                        a.removeAttribute('target');
                    }
                }
            } catch (e) {}
        });
    }

    // 2. 移除弹窗、呼端条并解锁滚动
    function cleanModalsAndAds() {
        if (document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = 'auto';
        if (document.body && document.body.style.overflow === 'hidden') document.body.style.overflow = 'auto';

        const selectors = [
            '.Modal-wrapper',
            '.Modal-backdrop',
            '.signFlowModal',
            '.OpenInApp',
            '.DownloadGuide',
            '.CallApp',
            '.AppBanner',
            'div[style*="position: fixed"][style*="336px"]'
        ];
        document.querySelectorAll(selectors.join(',')).forEach(el => el.remove());

        const closeBtns = document.querySelectorAll('.Modal-closeButton, button[aria-label*="关闭"]');
        closeBtns.forEach(btn => { try { btn.click(); } catch(e){} });
    }

    // 3. 拦截网页端自动调用 zhihu:// 唤端协议
    const origOpen = window.open;
    window.open = function(url) {
        if (url && typeof url === 'string' && url.startsWith('zhihu://')) return null;
        return origOpen.apply(this, arguments);
    };

    function runAll() {
        cleanModalsAndAds();
        cleanLinks();
    }

    window.addEventListener('DOMContentLoaded', runAll);
    window.addEventListener('load', runAll);

    // 4. 实时监控动态插入的知乎内容
    const observer = new MutationObserver(runAll);
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.body) observer.observe(document.body, { childList: true, subtree: true });
        });
    }
})();
</script>`;

        if (body.includes('</head>')) {
            body = body.replace('</head>', injectStyle + '\n' + injectScript + '\n</head>');
        } else if (body.includes('</body>')) {
            body = body.replace('</body>', injectStyle + '\n' + injectScript + '\n</body>');
        } else {
            body = body + injectStyle + injectScript;
        }

        $done({ body: body });
    } else {
        $done({});
    }
} else {
    $done({});
}
