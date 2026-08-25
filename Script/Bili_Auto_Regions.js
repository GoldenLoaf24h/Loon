/**
 * Bilibili Auto Region Switch & Global Unlock for Loon
 * Enhanced with Loon $argument support & Bi-directional search matching.
 */

let $ = nobyda();

async function SwitchRegion(title, url, body) {
    // Parse Loon $argument
    let args = {};
    if (typeof $argument === "object" && $argument !== null) {
        args = $argument;
    } else if (typeof $argument === "string" && $argument.length > 0) {
        $argument.split("&").forEach(p => {
            let [k, v] = p.split("=");
            if (k && v) args[k] = decodeURIComponent(v.replace(/\"/g, ""));
        });
    }

    const Group = args["Group"] || $.read('BiliArea_Policy') || 'Bilibili'; 
    const CN = args["Proxies.CHN"] || $.read('BiliArea_CN') || 'DIRECT';
    const TW = args["Proxies.TWN"] || $.read('BiliArea_TW') || '台湾节点';
    const HK = args["Proxies.HKG"] || $.read('BiliArea_HK') || '香港节点';
    const DF = $.read('BiliArea_DF') || HK;

    const current = await $.getPolicy(Group);
    const area = (() => {
        let select = {};
        let decodedUrl = decodeURIComponent(url || "");
        let combinedText = (title || "") + " " + decodedUrl;
        
        let isHK = /\u6e2f[\u4e00-\u9fa5]+\u5340|(%20|\+|\s)(%E6%B8%AF|hk|HK)(%20|\+|\s|&|$)|(%20|\+|\s|\?|^)(%E6%B8%AF|hk|HK)(%20|\+|\s)/i.test(combinedText);
        let isTW = /\u53f0[\u4e00-\u9fa5]+\u5340|(%20|\+|\s)(%E5%8F%B0|tw|TW)(%20|\+|\s|&|$)|(%20|\+|\s|\?|^)(%E5%8F%B0|tw|TW)(%20|\+|\s)/i.test(combinedText);

        if (isHK) {
            select = { policy: HK, mode: '香港' };
        } else if (isTW) {
            select = { policy: TW, mode: '台湾' };
        } else if (body && (body.code === -404 || (title && title.split('').some(v => zhHans().includes(v))))) {
            select = { policy: DF, mode: '后备' };
        } else if (current != CN) {
            select = { policy: CN, mode: '直连' };
        }
        return select;
    })();

    if (area.policy) {
        await $.setPolicy(Group, area.policy);
        $.notify("哔哩哔哩番剧解锁", "", `切换线路: ${area.mode} (${area.policy})`);
        return true;
    }
    return false;
}

function EnvInfo() {
    const url = $request.url;
    if (typeof ($response) !== 'undefined') {
        const raw = JSON.parse($response.body || "{}");
        const data = raw.data || raw.result || {};
        const title = [data.title, data.series && data.series.series_title, data.season_title]
            .filter(c => /\u5340\uff09/.test(c))[0] || data.title;
        SwitchRegion(title, null, raw)
            .then(s => s ? $done({
                status: 307,
                headers: { Location: url },
                body: "{}"
            }) : $done({ body: JSON.stringify(raw) }));
    } else {
        SwitchRegion(null, url, {}).then(() => $done({ url }));
    }
}

function nobyda() {
    const isLoon = typeof $loon != "undefined";
    const notify = (title, subtitle, message) => {
        console.log(`${title} - ${subtitle}: ${message}`);
        if (typeof $notification !== "undefined") $notification.post(title, subtitle, message);
    };
    const read = (key) => {
        if (typeof $persistentStore !== "undefined") return $persistentStore.read(key);
        return null;
    };
    const getPolicy = (groupName) => {
        if (typeof ($config) !== 'undefined' && typeof ($config.getPolicy) !== 'undefined') {
            return $config.getPolicy(groupName) || groupName;
        }
        return groupName;
    };
    const setPolicy = (group, policy) => {
        if (typeof ($config) !== 'undefined' && typeof ($config.setSelectPolicy) !== 'undefined') {
            return $config.setSelectPolicy(group, policy);
        }
        return false;
    };
    return { getPolicy, setPolicy, notify, read };
}

function zhHans() {
    return `䊷䋙䝼䰾䲁丟並乾亂亞佇馀併來侖侶俁係俔俠倀倆倈倉個們倫偉側偵偽傑傖傘備傭傯傳傴債傷傾僂僅僉僑僕僞僥僨價儀儂億儈`;
}

EnvInfo();
