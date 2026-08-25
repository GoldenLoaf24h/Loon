/**
 * Bilibili UI Customization Script for Loon
 * Strictly compliant with Loon Plugin & Script specifications.
 */

const $ = {
    get: (key) => {
        if (typeof $argument === "object" && $argument !== null) {
            if ($argument[key] !== undefined) return $argument[key];
            let cleanKey = key.replace(/[^a-zA-Z0-9]/g, "");
            for (let k of Object.keys($argument)) {
                if (k.replace(/[^a-zA-Z0-9]/g, "") === cleanKey) return $argument[k];
            }
        }
        if (typeof $argument === "string" && $argument.length > 0) {
            let params = {};
            $argument.split("&").forEach(pair => {
                let [k, v] = pair.split("=");
                if (k && v !== undefined) params[k] = decodeURIComponent(v.replace(/\"/g, ""));
            });
            return params[key];
        }
        return undefined;
    }
};

let body = $response.body;
if (!body) {
    $done({});
} else {
    try {
        let obj = JSON.parse(body);
        let url = $request.url;

        // 1. Home / Bottom Tabs: /x/resource/show/tab/v2
        if (url.includes("/x/resource/show/tab/v2") && obj.data) {
            // Filter Top Tabs
            let homeTabVal = $.get("Home.Tab") || "直播,推荐,热门,动画,影视";
            let defaultTabVal = ($.get("Home.Tab_default") || "推荐").trim().toLowerCase();

            if (Array.isArray(obj.data.tab)) {
                let allowedTabs = homeTabVal.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
                let filteredTabs = obj.data.tab.filter(t => {
                    let tabId = (t.tab_id || "").toLowerCase();
                    let name = (t.name || "").toLowerCase();
                    return allowedTabs.some(allowed => allowed.includes(tabId) || tabId.includes(allowed) || allowed.includes(name) || name.includes(allowed));
                });

                if (filteredTabs.length > 0) {
                    filteredTabs.forEach((t, index) => {
                        t.pos = index + 1;
                        let tabId = (t.tab_id || "").toLowerCase();
                        let name = (t.name || "").toLowerCase();
                        if (tabId.includes(defaultTabVal) || defaultTabVal.includes(tabId) || name.includes(defaultTabVal) || defaultTabVal.includes(name)) {
                            t.default_selected = 1;
                        } else {
                            delete t.default_selected;
                        }
                    });
                    obj.data.tab = filteredTabs;
                }
            }

            // Filter Bottom Navigation
            let bottomVal = $.get("Bottom") || "home,dynamic,我的Bottom";
            if (Array.isArray(obj.data.bottom)) {
                let allowedBottoms = bottomVal.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
                let filteredBottom = obj.data.bottom.filter(b => {
                    let tabId = (b.tab_id || "").toLowerCase();
                    let name = (b.name || "").toLowerCase();
                    return allowedBottoms.some(allowed => allowed.includes(tabId) || tabId.includes(allowed) || allowed.includes(name) || name.includes(allowed));
                });

                if (filteredBottom.length > 0) {
                    filteredBottom.forEach((b, index) => {
                        b.pos = index + 1;
                    });
                    obj.data.bottom = filteredBottom;
                }
            }

            // Filter Top Left / Top Right
            let topVal = $.get("Home.Top") || "消息Top";
            if (Array.isArray(obj.data.top)) {
                let allowedTop = topVal.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
                obj.data.top = obj.data.top.filter(t => {
                    let tabId = (t.tab_id || "").toLowerCase();
                    let name = (t.name || "").toLowerCase();
                    return allowedTop.some(allowed => allowed.includes(tabId) || tabId.includes(allowed) || allowed.includes(name) || name.includes(allowed));
                });
            }
        }

        // 2. Mine Page: /x/v2/account/mine
        if (url.includes("/x/v2/account/mine") && obj.data) {
            delete obj.data.answer;
            delete obj.data.live_tip;
            delete obj.data.vip_section;
            delete obj.data.vip_section_v2;
            delete obj.data.modular_vip_section;
        }

        $done({ body: JSON.stringify(obj) });
    } catch (e) {
        $done({});
    }
}
