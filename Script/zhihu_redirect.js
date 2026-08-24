/**
 * Loon Script: Zhihu External Link Direct Redirect (知乎外链精准解码直达)
 * 解决原生正则 302 无法解析 URL Encode 参数导致 Safari 报“无效链接”的缺陷
 */
const url = $request.url;
const match = url.match(/[?&]target=([^&]+)/);
if (match && match[1]) {
    try {
        const decodedUrl = decodeURIComponent(match[1]);
        if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
            $done({
                response: {
                    status: 302,
                    headers: {
                        'Location': decodedUrl,
                        'Cache-Control': 'no-cache'
                    }
                }
            });
        } else {
            $done({});
        }
    } catch (e) {
        $done({});
    }
} else {
    $done({});
}
