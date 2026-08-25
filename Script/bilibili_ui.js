/**
 * Bilibili UI Customization Script for Loon
 * Non-destructive filtering & customization based on live server response.
 * Compatible with modern Bilibili iOS App (no white screen / network error).
 */

let body = $response.body;
if (!body) {
    $done({});
} else {
    try {
        let obj = JSON.parse(body);
        let args = {};

        // Parse Loon $argument
        if (typeof $argument === "string" && $argument.length > 0) {
            $argument.split("&").forEach(item => {
                let [k, v] = item.split("=");
                if (k && v !== undefined) {
                    args[k] = decodeURIComponent(v.replace(/\"/g, ""));
                }
            });
        }

        let url = $request.url;

        // 1. Home / Bottom Tabs: /x/resource/show/tab/v2
        if (url.includes("/x/resource/show/tab/v2") && obj.data) {
            // Filter Top Tabs
            if (args["Home.Tab"] && Array.isArray(obj.data.tab)) {
                let allowedTabs = args["Home.Tab"].split(",").map(s => s.trim().toLowerCase());
                let defaultTab = (args["Home.Tab_default"] || "推荐tab").trim().toLowerCase();
                
                // If allowedTabs specified, filter tab items
                let filteredTabs = obj.data.tab.filter(t => {
                    let tabId = (t.tab_id || "").toLowerCase();
                    let name = (t.name || "").toLowerCase();
                    return allowedTabs.some(allowed => allowed.includes(tabId) || tabId.includes(allowed) || allowed.includes(name));
                });

                if (filteredTabs.length > 0) {
                    filteredTabs.forEach((t, index) => {
                        t.pos = index + 1;
                        let tabId = (t.tab_id || "").toLowerCase();
                        if (tabId.includes(defaultTab) || defaultTab.includes(tabId)) {
                            t.default_selected = 1;
                        } else {
                            delete t.default_selected;
                        }
                    });
                    obj.data.tab = filteredTabs;
                }
            }

            // Filter Bottom Navigation
            if (args["Bottom"] && Array.isArray(obj.data.bottom)) {
                let allowedBottoms = args["Bottom"].split(",").map(s => s.trim().toLowerCase());
                let filteredBottom = obj.data.bottom.filter(b => {
                    let tabId = (b.tab_id || "").toLowerCase();
                    let name = (b.name || "").toLowerCase();
                    // Remove vip/mall if not in allowedBottoms
                    return allowedBottoms.some(allowed => allowed.includes(tabId) || tabId.includes(allowed) || allowed.includes(name));
                });

                if (filteredBottom.length > 0) {
                    filteredBottom.forEach((b, index) => {
                        b.pos = index + 1;
                    });
                    obj.data.bottom = filteredBottom;
                }
            }

            // Filter Top Left / Top Right
            if (args["Home.Top"] && Array.isArray(obj.data.top)) {
                let allowedTop = args["Home.Top"].split(",").map(s => s.trim().toLowerCase());
                obj.data.top = obj.data.top.filter(t => {
                    let tabId = (t.tab_id || "").toLowerCase();
                    let name = (t.name || "").toLowerCase();
                    return allowedTop.some(allowed => allowed.includes(tabId) || tabId.includes(allowed) || allowed.includes(name));
                });
            }
        }

        // 2. Mine Page: /x/v2/account/mine
        if (url.includes("/x/v2/account/mine") && obj.data) {
            // Clean banners, unnecessary sections
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
