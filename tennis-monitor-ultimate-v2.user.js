// ==UserScript==
// @name         Tennis Court Monitor Ultimate V2
// @namespace    http://tampermonkey.net/
// @version      9.3
// @description  Ultimate anti-debugger bypass with aggressive injection, Airflow caching - continues data collection regardless of verification
// @author       Claude
// @match        https://wxsports.ydmap.cn/booking/schedule/*
// @match        https://wxsports.ydmap.cn/*
// @match        http://wxsports.ydmap.cn/*
// @match        *://*.ydmap.cn/*
// @icon         🎾
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_log
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/claude89757/TennisCourtMonitorJS/main/tennis-monitor-ultimate-v2.user.js
// @downloadURL  https://raw.githubusercontent.com/claude89757/TennisCourtMonitorJS/main/tennis-monitor-ultimate-v2.user.js
// @homepageURL  https://github.com/claude89757/TennisCourtMonitorJS
// ==/UserScript==

(function() {
    'use strict';
    
    // ==================== VERSION CHECK AND AUTO-UPDATE ====================
    
    const CURRENT_VERSION = '9.3';
    const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/claude89757/TennisCourtMonitorJS/main/tennis-monitor-ultimate-v2.user.js';
    
    // Check for updates on script load
    const checkForUpdates = async () => {
        try {
            const lastCheckTime = GM_getValue('lastUpdateCheck', 0);
            const now = Date.now();
            
            // Only check once per day to avoid excessive requests
            if (now - lastCheckTime < 24 * 60 * 60 * 1000) {
                console.log('%c[UPDATE] Update check skipped (checked recently)', 'color: gray');
                return;
            }
            
            GM_setValue('lastUpdateCheck', now);
            
            // Fetch the latest version from GitHub
            GM_xmlhttpRequest({
                method: 'GET',
                url: GITHUB_RAW_URL,
                headers: {
                    'Cache-Control': 'no-cache'
                },
                onload: function(response) {
                    if (response.status === 200) {
                        // Extract version from the response
                        const versionMatch = response.responseText.match(/@version\s+(\d+\.\d+)/);
                        if (versionMatch) {
                            const remoteVersion = versionMatch[1];
                            console.log(`%c[UPDATE] Current version: ${CURRENT_VERSION}, Remote version: ${remoteVersion}`, 'color: cyan');
                            
                            // Compare versions
                            if (compareVersions(remoteVersion, CURRENT_VERSION) > 0) {
                                console.log('%c[UPDATE] New version available!', 'background: green; color: white; font-weight: bold');
                                
                                // Show notification
                                if (typeof GM_notification !== 'undefined') {
                                    GM_notification({
                                        title: '🎾 Tennis Monitor 更新可用',
                                        text: `发现新版本 v${remoteVersion}！点击更新。`,
                                        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0Ij48dGV4dCB5PSIyMCIgZm9udC1zaXplPSIyMCI+8J+OvTwvdGV4dD48L3N2Zz4=',
                                        onclick: function() {
                                            window.open(GITHUB_RAW_URL, '_blank');
                                        }
                                    });
                                }
                                
                                // Also show in-page notification
                                showUpdateNotification(remoteVersion);
                            } else {
                                console.log('%c[UPDATE] Script is up to date', 'color: green');
                            }
                        }
                    }
                },
                onerror: function(error) {
                    console.log('%c[UPDATE] Failed to check for updates', 'color: orange');
                    console.error(error);
                }
            });
        } catch (error) {
            console.log('%c[UPDATE] Error checking for updates', 'color: red');
            console.error(error);
        }
    };
    
    // Compare version strings (e.g., "9.2" vs "9.1")
    const compareVersions = (v1, v2) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        
        return 0;
    };
    
    // Show in-page update notification
    const showUpdateNotification = (newVersion) => {
        const notification = document.createElement('div');
        notification.id = 'tennis-update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 9999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: slideInRight 0.5s ease;
            max-width: 350px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                        🎾 Tennis Monitor 更新可用
                    </div>
                    <div style="font-size: 14px; opacity: 0.95;">
                        新版本 v${newVersion} 已发布
                    </div>
                    <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                        当前版本: v${CURRENT_VERSION}
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-left: 15px;">
                    <button id="tennis-update-btn" style="
                        background: white;
                        color: #667eea;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 5px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s;
                    ">更新</button>
                    <button id="tennis-update-close" style="
                        background: transparent;
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s;
                    ">关闭</button>
                </div>
            </div>
        `;
        
        // Add animation CSS
        if (!document.getElementById('tennis-update-animation')) {
            const style = document.createElement('style');
            style.id = 'tennis-update-animation';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                #tennis-update-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                }
                
                #tennis-update-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Wait for DOM to be ready
        const attachNotification = () => {
            if (document.body) {
                // Remove any existing notification
                const existing = document.getElementById('tennis-update-notification');
                if (existing) {
                    existing.remove();
                }
                
                document.body.appendChild(notification);
                
                // Add event listeners
                document.getElementById('tennis-update-btn').onclick = () => {
                    window.open(GITHUB_RAW_URL, '_blank');
                    notification.remove();
                };
                
                document.getElementById('tennis-update-close').onclick = () => {
                    notification.remove();
                };
                
                // Auto-hide after 30 seconds
                setTimeout(() => {
                    if (document.getElementById('tennis-update-notification')) {
                        notification.style.animation = 'slideInRight 0.5s ease reverse';
                        setTimeout(() => notification.remove(), 500);
                    }
                }, 30000);
            } else {
                setTimeout(attachNotification, 100);
            }
        };
        
        attachNotification();
    };
    
    // Check for updates after page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForUpdates);
    } else {
        setTimeout(checkForUpdates, 1000);
    }
    
    // ==================== PHASE 1: AGGRESSIVE ANTI-DEBUGGER ====================
    
    // Inject anti-debugger code before ANYTHING else
    const antiDebuggerScript = `
        (function() {
            // Save originals immediately
            const _eval = window.eval;
            const _Function = window.Function;
            const _setTimeout = window.setTimeout;
            const _setInterval = window.setInterval;
            const _constructor = window.constructor;
            
            // Try to disable debugger keyword (check if it's configurable first)
            try {
                const descriptor = Object.getOwnPropertyDescriptor(window, 'debugger');
                if (!descriptor || descriptor.configurable !== false) {
                    Object.defineProperty(window, 'debugger', {
                        get: function() { return undefined; },
                        set: function() { return false; },
                        configurable: false
                    });
                }
            } catch(e) {
                console.log('[ANTI-DEBUG] Cannot redefine debugger:', e.message);
            }
            
            // Override eval to remove debugger
            window.eval = new Proxy(_eval, {
                apply: function(target, thisArg, args) {
                    let code = args[0];
                    if (typeof code === 'string') {
                        // Remove all debugger statements
                        code = code.replace(/\\bdebugger\\b/gi, '');
                        // Remove infinite loops with debugger
                        code = code.replace(/while\\s*\\(.*?\\)\\s*{[^}]*debugger[^}]*}/gi, '');
                        code = code.replace(/for\\s*\\(.*?\\)\\s*{[^}]*debugger[^}]*}/gi, '');
                        args[0] = code;
                    }
                    return Reflect.apply(target, thisArg, args);
                }
            });
            
            // Override Function constructor
            window.Function = new Proxy(_Function, {
                construct: function(target, args) {
                    // Clean last argument (function body)
                    if (args.length > 0) {
                        let body = args[args.length - 1];
                        if (typeof body === 'string') {
                            body = body.replace(/\\bdebugger\\b/gi, '');
                            args[args.length - 1] = body;
                        }
                    }
                    return Reflect.construct(target, args);
                },
                apply: function(target, thisArg, args) {
                    // Clean last argument (function body)
                    if (args.length > 0) {
                        let body = args[args.length - 1];
                        if (typeof body === 'string') {
                            body = body.replace(/\\bdebugger\\b/gi, '');
                            args[args.length - 1] = body;
                        }
                    }
                    return Reflect.apply(target, thisArg, args);
                }
            });
            
            // Override timers to block debugger loops
            let blockedTimers = new Set();
            
            window.setTimeout = new Proxy(_setTimeout, {
                apply: function(target, thisArg, args) {
                    const [callback, delay, ...rest] = args;
                    
                    // Check if callback contains debugger
                    let callbackStr = '';
                    if (typeof callback === 'function') {
                        callbackStr = callback.toString();
                    } else if (typeof callback === 'string') {
                        callbackStr = callback;
                    }
                    
                    // Block if contains debugger
                    if (callbackStr.includes('debugger') || 
                        callbackStr.includes('constructor("debugger")') ||
                        callbackStr.includes('Function("debugger")') ||
                        callbackStr.includes('constructor.constructor')) {
                        const fakeId = Math.random() * 1000000;
                        blockedTimers.add(fakeId);
                        console.log('[ANTI-DEBUG] Blocked setTimeout with debugger');
                        return fakeId;
                    }
                    
                    return Reflect.apply(target, thisArg, args);
                }
            });
            
            window.setInterval = new Proxy(_setInterval, {
                apply: function(target, thisArg, args) {
                    const [callback, delay, ...rest] = args;
                    
                    // Check if callback contains debugger
                    let callbackStr = '';
                    if (typeof callback === 'function') {
                        callbackStr = callback.toString();
                    } else if (typeof callback === 'string') {
                        callbackStr = callback;
                    }
                    
                    // Block if contains debugger
                    if (callbackStr.includes('debugger') || 
                        callbackStr.includes('constructor("debugger")') ||
                        callbackStr.includes('Function("debugger")') ||
                        callbackStr.includes('constructor.constructor')) {
                        const fakeId = Math.random() * 1000000;
                        blockedTimers.add(fakeId);
                        console.log('[ANTI-DEBUG] Blocked setInterval with debugger');
                        return fakeId;
                    }
                    
                    return Reflect.apply(target, thisArg, args);
                }
            });
            
            // Override clearInterval and clearTimeout for fake IDs
            const _clearInterval = window.clearInterval;
            const _clearTimeout = window.clearTimeout;
            
            window.clearInterval = function(id) {
                if (!blockedTimers.has(id)) {
                    return _clearInterval(id);
                }
                blockedTimers.delete(id);
            };
            
            window.clearTimeout = function(id) {
                if (!blockedTimers.has(id)) {
                    return _clearTimeout(id);
                }
                blockedTimers.delete(id);
            };
            
            // Block constructor.constructor pattern
            const OriginalFunction = Function;
            Function.prototype.constructor = new Proxy(Function.prototype.constructor, {
                apply: function(target, thisArg, args) {
                    if (args[0] && args[0].includes && args[0].includes('debugger')) {
                        console.log('[ANTI-DEBUG] Blocked constructor.constructor debugger');
                        return function() {};
                    }
                    return Reflect.apply(target, thisArg, args);
                },
                construct: function(target, args) {
                    if (args[0] && args[0].includes && args[0].includes('debugger')) {
                        console.log('[ANTI-DEBUG] Blocked constructor.constructor debugger');
                        return function() {};
                    }
                    return Reflect.construct(target, args);
                }
            });
            
            // Prevent console.clear
            const _clear = console.clear;
            console.clear = function() {
                console.log('[ANTI-DEBUG] Console.clear blocked');
            };
            
            console.log('%c[ANTI-DEBUG] Protection active!', 'background: green; color: white; font-weight: bold');
        })();
    `;
    
    // Inject immediately
    const injectAntiDebugger = () => {
        const script = document.createElement('script');
        script.textContent = antiDebuggerScript;
        
        // Try all possible injection points
        const targets = [
            document.documentElement,
            document.head,
            document.body
        ];
        
        for (const target of targets) {
            if (target) {
                target.insertBefore(script, target.firstChild);
                console.log('[TM] Anti-debugger injected to:', target.tagName);
                break;
            }
        }
    };
    
    // Inject as early as possible
    injectAntiDebugger();
    
    // Also inject when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAntiDebugger);
    }
    
    // ==================== PHASE 2: VENUE MONITOR ====================
    
    const monitorScript = `
        (function() {
            console.log('%c[MONITOR] Tennis Court Monitor Ready!', 'background: green; color: white; font-weight: bold');
            
            // Global storage
            window.__orderList = [];  // 预订信息
            window.__venueConfig = []; // 场地配置
            window.__venueNameMap = {}; // 场地ID到名称的映射
            window.__salesName = ''; // 网球场名称 (from salesName in config)
            window.__currentXhrUrl = null;
            window.__currentTabDate = null; // 当前点击的tab日期信息
            window.__lastApiCallTime = 0; // 最后一次API调用时间
            window.__getVenueOrderListCallCount = 0; // getVenueOrderList调用次数
            
            // Hook JSON.parse to catch decrypted data
            const originalParse = JSON.parse;
            const processedHashes = new Set();
            let parseCallCount = 0;
            
            JSON.parse = function(text) {
                let result;
                try {
                    result = originalParse.call(this, text);
                } catch(e) {
                    return originalParse.call(this, text);
                }
                
                parseCallCount++;
                
                // Debug: Log all JSON.parse calls with venue data
                if (result && typeof result === 'object') {
                    const resultStr = JSON.stringify(result);
                    if (resultStr && (resultStr.includes('venueId') || resultStr.includes('venue'))) {
                        console.log('%c[DEBUG] JSON.parse #' + parseCallCount + ' with venue data, code=' + result.code, 'color: gray; font-size: 10px');
                    }
                }
                
                // Process all successful responses with data
                if (result && result.code === 0 && result.data) {
                    
                    // Type 1: Array data (getVenueOrderList - booking info)
                    if (Array.isArray(result.data) && result.data.length > 0) {
                        const hasVenueData = result.data.some(item => 
                            item && (item.venueId || item.startTime || item.endTime || 
                                    item.dealId || item.orderId || item.venueName)
                        );
                        
                        if (hasVenueData) {
                            // Use requestId as unique identifier if available, otherwise use timestamp
                            const uniqueId = result.requestId || result.timestamp || Date.now();
                            const fullHash = 'order_' + uniqueId;
                            
                            if (!processedHashes.has(fullHash)) {
                                processedHashes.add(fullHash);
                                
                                // Keep only recent 50 hashes
                                if (processedHashes.size > 50) {
                                    const firstHash = processedHashes.values().next().value;
                                    processedHashes.delete(firstHash);
                                }
                                
                                console.log('%c🎾 [预订信息] getVenueOrderList - 明文数据捕获成功!', 'background: blue; color: white; font-size: 14px; font-weight: bold');
                                console.log('完整响应:', result);
                                console.log('预订数量:', result.data.length);
                                
                                // Attach current tab date info to the result (make a copy to avoid reference issues)
                                if (window.__currentTabDate) {
                                    result.tabDateInfo = {
                                        text: window.__currentTabDate.text,
                                        weekday: window.__currentTabDate.weekday,
                                        date: window.__currentTabDate.date,
                                        fullText: window.__currentTabDate.fullText
                                    };
                                    result.isFromTabClick = true; // Mark as from tab click
                                    console.log('附加tab日期信息:', result.tabDateInfo);
                                } else {
                                    result.isFromTabClick = false; // Mark as not from tab click (initial load)
                                    console.log('%c⚠️ No tab date info, this is likely initial page load data', 'color: orange');
                                }
                                
                                // Try to extract court name from booking data if not already set
                                if (!window.__salesName && result.data.length > 0) {
                                    const firstItem = result.data[0];
                                    if (firstItem.placeName) {
                                        window.__salesName = firstItem.placeName;
                                        console.log('网球场名称 (from booking placeName):', window.__salesName);
                                    } else if (firstItem.sportPlaceName) {
                                        window.__salesName = firstItem.sportPlaceName;
                                        console.log('网球场名称 (from booking sportPlaceName):', window.__salesName);
                                    }
                                }
                                
                                // Show booking table with venue names from config
                                const summary = result.data.map(item => ({
                                    '网球场': window.__salesName || '未知球场',
                                    '场地ID': item.venueId || 'N/A',
                                    '场地名称': window.__venueNameMap[item.venueId] || item.venueName || '未知场地',
                                    '状态': item.dealId ? '🔒已锁定' : (item.orderId ? '✅已确认' : '⭕可用'),
                                    '时间': item.startTime ? 
                                        new Date(item.startTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'}) + 
                                        '-' + 
                                        new Date(item.endTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'}) 
                                        : 'N/A',
                                    '价格': item.price || 'N/A'
                                }));
                                console.table(summary);
                                
                                // Calculate available slots per venue
                                if (result.data[0].startTime) {
                                    const hours = Array.from({length: 16}, (_, i) => i + 7); // 7:00 to 22:00
                                    const venueAvailability = {};
                                    
                                    // Group bookings by venue ID
                                    result.data.forEach(b => {
                                        if (b.venueId && b.startTime && b.endTime) {
                                            if (!venueAvailability[b.venueId]) {
                                                venueAvailability[b.venueId] = {
                                                    booked: new Set(),
                                                    name: window.__venueNameMap[b.venueId] || b.venueName || b.venueId
                                                };
                                            }
                                            const start = new Date(b.startTime).getHours();
                                            const end = new Date(b.endTime).getHours();
                                            for(let h = start; h < end; h++) {
                                                venueAvailability[b.venueId].booked.add(h);
                                            }
                                        }
                                    });
                                    
                                    // Helper function to convert hours array to time ranges
                                    const hoursToRanges = (hours) => {
                                        if (hours.length === 0) return [];
                                        
                                        const ranges = [];
                                        let start = hours[0];
                                        let end = hours[0];
                                        
                                        for (let i = 1; i < hours.length; i++) {
                                            if (hours[i] === end + 1) {
                                                end = hours[i];
                                            } else {
                                                ranges.push(start + ':00-' + (end + 1) + ':00');
                                                start = hours[i];
                                                end = hours[i];
                                            }
                                        }
                                        ranges.push(start + ':00-' + (end + 1) + ':00');
                                        return ranges;
                                    };
                                    
                                    // Build availability table
                                    const availabilityTable = [];
                                    let hasAnyAvailable = false;
                                    
                                    for (const venueId in venueAvailability) {
                                        const venue = venueAvailability[venueId];
                                        const available = hours.filter(h => !venue.booked.has(h));
                                        hasAnyAvailable = hasAnyAvailable || available.length > 0;
                                        
                                        const timeRanges = hoursToRanges(available);
                                        
                                        availabilityTable.push({
                                            '网球场': window.__salesName || '未知球场',
                                            '场地ID': venueId,
                                            '场地名称': venue.name,
                                            '可用时段': timeRanges.length > 0 ? 
                                                timeRanges.join(', ') : 
                                                '❌ 无可用时段',
                                            '可用小时数': available.length
                                        });
                                    }
                                    
                                    console.log('%c📊 各场地可用时段统计:', 'background: teal; color: white; font-weight: bold');
                                    console.table(availabilityTable);
                                    
                                    if (hasAnyAvailable) {
                                        console.log('%c✨ 有可用时段!', 'background: lime; color: black; font-weight: bold');
                                    } else {
                                        console.log('%c❌ 所有场地无可用时段', 'background: red; color: white');
                                    }
                                }
                                
                                window.__orderList.push(result);
                                console.log('%c💾 [DATA] Saved order list #' + window.__orderList.length + ' with tab info:', 'color: cyan', result.tabDateInfo);
                            }
                        }
                    }
                    
                    // Type 2: Object data (getSportVenueConfig - venue configuration)
                    else if (typeof result.data === 'object' && !Array.isArray(result.data)) {
                        // Check if this looks like venue config data
                        const dataStr = JSON.stringify(result.data);
                        const isVenueConfig = dataStr.includes('venue') || dataStr.includes('court') || 
                                             dataStr.includes('场地') || dataStr.includes('sport') ||
                                             dataStr.includes('config') || dataStr.includes('配置');
                        
                        if (isVenueConfig) {
                            // Use requestId or timestamp as unique identifier
                            const uniqueId = result.requestId || result.timestamp || Date.now();
                            const configHash = 'config_' + uniqueId;
                            
                            if (!processedHashes.has(configHash)) {
                                processedHashes.add(configHash);
                                
                                // Keep only recent 50 hashes
                                if (processedHashes.size > 50) {
                                    const firstHash = processedHashes.values().next().value;
                                    processedHashes.delete(firstHash);
                                }
                                
                                console.log('%c⚙️ [场地配置] getSportVenueConfig - 明文数据捕获成功!', 'background: purple; color: white; font-size: 14px; font-weight: bold');
                                console.log('完整响应:', result);
                                console.log('配置详情:', result.data);
                                
                                // Extract salesName (tennis court name) from multiple possible fields
                                if (result.data) {
                                    // Try multiple possible field names for the court name
                                    const possibleFields = ['salesName', 'venueName', 'sportName', 'placeName', 'name', 'title', 'sportPlaceName'];
                                    
                                    for (const field of possibleFields) {
                                        if (result.data[field]) {
                                            window.__salesName = result.data[field];
                                            console.log('网球场名称 (from ' + field + '):', window.__salesName);
                                            break;
                                        }
                                    }
                                    
                                    // If still not found, check nested structures
                                    if (!window.__salesName && result.data.sportPlaceResponse) {
                                        const place = result.data.sportPlaceResponse;
                                        if (place.placeName) {
                                            window.__salesName = place.placeName;
                                            console.log('网球场名称 (from sportPlaceResponse.placeName):', window.__salesName);
                                        } else if (place.name) {
                                            window.__salesName = place.name;
                                            console.log('网球场名称 (from sportPlaceResponse.name):', window.__salesName);
                                        }
                                    }
                                }
                                
                                // Extract venue name mapping from config
                                if (result.data && result.data.venueResponses) {
                                    result.data.venueResponses.forEach(venue => {
                                        if (venue.venueId && venue.venueName) {
                                            window.__venueNameMap[venue.venueId] = venue.venueName;
                                        }
                                    });
                                    console.log('场地名称映射更新:', window.__venueNameMap);
                                }
                                
                                // Parse and display config structure
                                if (result.data) {
                                    const configKeys = Object.keys(result.data);
                                    console.log('配置项:', configKeys);
                                    
                                    // Display venue list if available
                                    if (result.data.venueResponses) {
                                        const venueTable = result.data.venueResponses.map(v => ({
                                            '网球场': window.__salesName || result.data.salesName || '未知球场',
                                            '场地ID': v.venueId,
                                            '场地名称': v.venueName,
                                            '状态': v.platformOpen === 1 ? '✅开放' : '❌关闭',
                                            '备注': v.platformCloseAlert || ''
                                        }));
                                        console.log('场地列表:');
                                        console.table(venueTable);
                                    }
                                }
                                
                                window.__venueConfig.push(result);
                            }
                        }
                    }
                }
                
                return result;
            };
            
            // Hook XHR
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            
            XMLHttpRequest.prototype.open = function(method, url) {
                this._url = url;
                this._method = method;
                
                // Enhanced logging for target API calls
                if (url.includes('getVenueOrderList') || url.includes('getSportVenueConfig')) {
                    if (url.includes('getVenueOrderList')) {
                        window.__lastApiCallTime = Date.now();
                        window.__getVenueOrderListCallCount++;
                        
                        // Parse and log signature
                        const urlObj = new URL(url, window.location.origin);
                        const signature = this.getRequestHeader ? this.getRequestHeader('signature') : null;
                        const nonce = this.getRequestHeader ? this.getRequestHeader('nonce') : null;
                        
                        console.log('%c📡 [API-CALL] getVenueOrderList #' + window.__getVenueOrderListCallCount, 'background: blue; color: white; font-weight: bold');
                        console.log('  🕒 Time:', new Date().toLocaleTimeString());
                        console.log('  🔗 Method:', method);
                        
                        // Extract t parameter for timing analysis
                        const tParam = urlObj.searchParams.get('t');
                        if (tParam) {
                            const requestTime = parseInt(tParam);
                            const currentTime = Date.now();
                            console.log('  ⏰ Request t:', tParam, '(diff:', (currentTime - requestTime) + 'ms)');
                        }
                    } else {
                        console.log('%c[API] ' + method + ' ' + url, 'color: gray; font-size: 11px');
                    }
                }
                
                return originalOpen.apply(this, arguments);
            };
            
            XMLHttpRequest.prototype.send = function(body) {
                const self = this;
                
                // Enhanced monitoring for getVenueOrderList
                if (self._url && self._url.includes('getVenueOrderList')) {
                    // Parse URL parameters
                    const urlObj = new URL(self._url, window.location.origin);
                    const params = Object.fromEntries(urlObj.searchParams);
                    
                    console.log('%c🔍 [MONITOR] getVenueOrderList Request Details', 'background: #4CAF50; color: white; font-weight: bold');
                    console.log('  📍 Full URL:', self._url);
                    console.log('  📊 Parameters:', params);
                    console.log('  🔑 Key params:', {
                        salesItemId: params.salesItemId,
                        curDate: params.curDate,
                        salesId: params.salesId,
                        t: params.t
                    });
                    
                    // Store request info
                    window.__lastVenueRequest = {
                        url: self._url,
                        params: params,
                        timestamp: Date.now(),
                        headers: self._requestHeaders || {}
                    };
                }
                
                // Process target APIs
                if (self._url && (self._url.includes('getVenueOrderList') || self._url.includes('getSportVenueConfig'))) {
                    this.addEventListener('readystatechange', function() {
                        if (self.readyState === 4) {
                            // Enhanced response logging
                            try {
                                const responseText = self.responseText;
                                const responseHeaders = self.getAllResponseHeaders();
                                
                                // Check for JS verification code (captcha)
                                if (responseText.includes('window.location') || 
                                    responseText.includes('document.cookie') ||
                                    responseText.includes('eval(') ||
                                    responseText.includes('setTimeout(') ||
                                    responseText.includes('__jsl_clearance')) {
                                    
                                    console.log('%c⚠️ [CAPTCHA] JavaScript验证码检测到!', 'background: red; color: white; font-size: 14px; font-weight: bold');
                                    console.log('  🔒 Response type: JavaScript Challenge');
                                    console.log('  📝 Response preview:', responseText.substring(0, 500));
                                    console.log('  🌐 Request URL:', self._url);
                                    
                                    // Store captcha response
                                    window.__lastCaptchaResponse = {
                                        url: self._url,
                                        response: responseText,
                                        headers: responseHeaders,
                                        timestamp: Date.now()
                                    };
                                    
                                    // Increment captcha counter
                                    window.__captchaCount = (window.__captchaCount || 0) + 1;
                                    console.log('  📊 Captcha count this session:', window.__captchaCount);
                                    
                                    return;
                                }
                                
                                // Normal JSON response
                                if (self.status === 200) {
                                    const response = JSON.parse(responseText);
                                    
                                    // Log response type
                                    if (response.data && typeof response.data === 'string') {
                                        console.log('%c[API] 收到加密响应，等待解密...', 'color: orange; font-size: 11px');
                                        console.log('  📦 Response type: Encrypted');
                                        console.log('  📏 Data length:', response.data.length);
                                        
                                        if (self._url.includes('getVenueOrderList')) {
                                            console.log('[DEBUG] getVenueOrderList 加密数据长度:', response.data.length);
                                            console.log('[DEBUG] 响应码:', response.code, '消息:', response.msg);
                                            // Store for manual decryption attempts
                                            window.__lastEncryptedVenueData = {
                                                url: self._url,
                                                data: response.data,
                                                timestamp: Date.now(),
                                                requestParams: window.__lastVenueRequest
                                            };
                                        }
                                    } else if (response.code === 429) {
                                        console.warn('%c[RATE-LIMIT] 请求频率限制', 'background: orange; color: white');
                                        console.log('  ⏱️ Message:', response.msg);
                                    } else if (response.code === 401) {
                                        console.warn('%c[AUTH-FAIL] 认证失败', 'background: red; color: white');
                                        console.log('  🔐 Message:', response.msg);
                                    } else if (response.code === 0) {
                                        console.log('%c✅ [SUCCESS] 正常响应', 'color: green');
                                        console.log('  📊 Data type:', typeof response.data);
                                    }
                                } else {
                                    console.warn('%c[HTTP-ERROR] Status: ' + self.status, 'background: red; color: white');
                                    console.log('  Response:', responseText.substring(0, 500));
                                }
                            } catch(e) {
                                // Not JSON response
                                if (self.responseText && self.responseText.length < 5000) {
                                    console.log('%c[NON-JSON] Unexpected response format', 'background: purple; color: white');
                                    console.log('Response preview:', self.responseText.substring(0, 300));
                                }
                            }
                        }
                    });
                }
                
                // Store request headers if available
                self._requestHeaders = {};
                
                return originalSend.apply(this, arguments);
            };
            
            // Hook Fetch API (in case they use fetch)
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                // Only log target API calls
                if (url.includes('getVenueOrderList') || url.includes('getSportVenueConfig')) {
                    console.log('%c[API] Fetch ' + url, 'color: gray; font-size: 11px');
                    window.__currentXhrUrl = url;
                }
                
                return originalFetch.apply(this, arguments).then(response => {
                    return response;
                });
            };
            
            // Add enhanced commands
            window.check = function() {
                console.log('%c===== 监控数据汇总 =====', 'background: black; color: yellow; font-weight: bold');
                console.log('🎾 网球场名称 (salesName):', window.__salesName || '未捕获');
                console.log('📊 预订信息 (getVenueOrderList):', window.__orderList.length + ' 次捕获');
                if (window.__orderList.length > 0) {
                    console.log('  最新预订数据:', window.__orderList[window.__orderList.length - 1]);
                }
                console.log('⚙️ 场地配置 (getSportVenueConfig):', window.__venueConfig.length + ' 次捕获');
                if (window.__venueConfig.length > 0) {
                    console.log('  最新配置数据:', window.__venueConfig[window.__venueConfig.length - 1]);
                }
                console.log('🏷️ 场地名称映射:', window.__venueNameMap);
                console.log('\n===== API调用统计 =====');
                console.log('📡 API调用总数:', window.__getVenueOrderListCallCount || 0);
                console.log('⚠️ 验证码拦截次数:', window.__captchaCount || 0);
                if (window.__lastCaptchaResponse) {
                    console.log('  最后验证码时间:', new Date(window.__lastCaptchaResponse.timestamp).toLocaleTimeString());
                }
                if (window.__lastVenueRequest) {
                    console.log('\n===== 最后请求详情 =====');
                    console.log('🔗 URL:', window.__lastVenueRequest.url);
                    console.log('📝 参数:', window.__lastVenueRequest.params);
                }
            };
            
            // Add debug mode
            window.enableDebug = function() {
                window.__debugMode = true;
                console.log('%c🐛 Debug mode enabled!', 'background: purple; color: white; font-weight: bold');
                console.log('All XHR requests will be logged in detail.');
                
                // Override XHR more verbosely
                const originalXHRSend = XMLHttpRequest.prototype.send;
                XMLHttpRequest.prototype.send = function(body) {
                    if (window.__debugMode) {
                        console.log('%c[DEBUG-XHR] Request:', 'color: purple');
                        console.log('  URL:', this._url);
                        console.log('  Method:', this._method);
                        console.log('  Body:', body);
                        
                        this.addEventListener('load', function() {
                            console.log('%c[DEBUG-XHR] Response:', 'color: purple');
                            console.log('  Status:', this.status);
                            console.log('  Headers:', this.getAllResponseHeaders());
                            if (this.responseText && this.responseText.length < 1000) {
                                console.log('  Body:', this.responseText);
                            } else if (this.responseText) {
                                console.log('  Body (truncated):', this.responseText.substring(0, 500) + '...');
                            }
                        });
                    }
                    return originalXHRSend.apply(this, arguments);
                };
            };
            
            console.log('%c[MONITOR] 监控已启动!', 'background: green; color: white; font-weight: bold');
            console.log('📋 可用命令:');
            console.log('  • check() - 查看监控数据汇总');
            console.log('  • enableDebug() - 开启调试模式');
            console.log('  • window.__lastCaptchaResponse - 查看最后的验证码响应');
            console.log('  • window.__lastVenueRequest - 查看最后的请求详情');
        })();
    `;
    
    // Inject monitor immediately and continuously
    const injectMonitor = () => {
        // Check if already injected
        if (!window.__monitorInjected) {
            const script = document.createElement('script');
            script.textContent = monitorScript;
            (document.head || document.documentElement).appendChild(script);
            window.__monitorInjected = true;
            console.log('[TM] Monitor script injected');
        }
    };
    
    // Inject immediately
    injectMonitor();
    
    // Also inject when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectMonitor);
    } else {
        setTimeout(injectMonitor, 0);
    }
    
    // ==================== PHASE 3: VISUAL INDICATOR ====================
    
    setTimeout(() => {
        // Add floating button
        const button = document.createElement('div');
        button.innerHTML = '🎾';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #00ff00, #00aa00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            cursor: pointer;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(0,255,0,0.5);
            animation: pulse 2s infinite;
        `;
        
        button.onclick = () => {
            if (unsafeWindow.check) {
                unsafeWindow.check();
            } else {
                console.log('Monitor not ready yet');
            }
        };
        
        // Add Airflow sync button
        const airflowButton = document.createElement('div');
        airflowButton.innerHTML = '☁️';
        airflowButton.title = '同步数据到 Airflow';
        airflowButton.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #2196F3, #1976D2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            cursor: pointer;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(33, 150, 243, 0.5);
            animation: pulse 2s infinite;
        `;
        
        airflowButton.onclick = async () => {
            console.log('%c☁️ [MANUAL] Syncing to Airflow...', 'background: blue; color: white; font-weight: bold');
            await sendToAirflow();
        };
        
        // Add animation
        GM_addStyle(`
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `);
        
        if (document.body) {
            document.body.appendChild(button);
            document.body.appendChild(airflowButton);
            console.log('[TM] Visual buttons added');
        }
        
        // Add status banner
        const banner = document.createElement('div');
        banner.innerHTML = '🛡️ ANTI-DEBUGGER ACTIVE | 🎾 MONITOR READY';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(90deg, #4CAF50, #2196F3);
            color: white;
            padding: 5px;
            text-align: center;
            z-index: 999998;
            font-weight: bold;
            font-family: monospace;
        `;
        
        if (document.body) {
            document.body.appendChild(banner);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                banner.style.display = 'none';
            }, 5000);
        }
    }, 1000);
    
    console.log('%c[TM] Tennis Court Monitor Ultimate V2 Loaded', 'background: green; color: white; font-size: 16px; font-weight: bold');
    
    // ==================== PHASE 4: AUTO-REFRESH ====================
    
    // Auto refresh page every 2 minutes
    setTimeout(() => {
        console.log('%c⏰ [AUTO-REFRESH] Starting 2-minute refresh timer', 'background: orange; color: white; font-weight: bold');
        
        let refreshCountdown = 120; // seconds
        
        // Create countdown display
        const countdownDisplay = document.createElement('div');
        countdownDisplay.id = 'refresh-countdown';
        countdownDisplay.style.cssText = `
            position: fixed;
            bottom: 160px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-family: monospace;
            font-size: 12px;
            z-index: 999997;
            min-width: 120px;
            text-align: center;
        `;
        
        if (document.body) {
            document.body.appendChild(countdownDisplay);
        }
        
        // Update countdown every second
        const countdownInterval = setInterval(() => {
            refreshCountdown--;
            
            if (countdownDisplay) {
                countdownDisplay.innerHTML = `⏰ Refresh in: ${refreshCountdown}s`;
            }
            
            if (refreshCountdown <= 10) {
                countdownDisplay.style.background = 'rgba(255, 0, 0, 0.8)';
            }
            
            if (refreshCountdown <= 0) {
                clearInterval(countdownInterval);
                console.log('%c🔄 [AUTO-REFRESH] Refreshing page now!', 'background: red; color: white; font-size: 14px; font-weight: bold');
                
                if (countdownDisplay) {
                    countdownDisplay.innerHTML = '🔄 Refreshing...';
                }
                
                // Perform refresh
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        }, 1000);
        
        // Allow manual refresh by clicking countdown
        countdownDisplay.onclick = () => {
            if (confirm('立即刷新页面？')) {
                clearInterval(countdownInterval);
                window.location.reload();
            }
        };
        
        // Add pause/resume functionality with right-click
        let isPaused = false;
        countdownDisplay.oncontextmenu = (e) => {
            e.preventDefault();
            isPaused = !isPaused;
            
            if (isPaused) {
                clearInterval(countdownInterval);
                countdownDisplay.style.background = 'rgba(255, 165, 0, 0.8)';
                countdownDisplay.innerHTML = '⏸️ Paused';
                console.log('%c⏸️ [AUTO-REFRESH] Timer paused', 'background: orange; color: white');
            } else {
                // Resume with remaining time
                countdownDisplay.style.background = 'rgba(0, 0, 0, 0.8)';
                console.log('%c▶️ [AUTO-REFRESH] Timer resumed', 'background: green; color: white');
                
                // Restart the interval
                const resumeInterval = setInterval(() => {
                    refreshCountdown--;
                    
                    if (countdownDisplay) {
                        countdownDisplay.innerHTML = `⏰ Refresh in: ${refreshCountdown}s`;
                    }
                    
                    if (refreshCountdown <= 10) {
                        countdownDisplay.style.background = 'rgba(255, 0, 0, 0.8)';
                    }
                    
                    if (refreshCountdown <= 0) {
                        clearInterval(resumeInterval);
                        console.log('%c🔄 [AUTO-REFRESH] Refreshing page now!', 'background: red; color: white; font-size: 14px; font-weight: bold');
                        
                        if (countdownDisplay) {
                            countdownDisplay.innerHTML = '🔄 Refreshing...';
                        }
                        
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    }
                }, 1000);
            }
        };
        
        // Add tooltip
        countdownDisplay.title = '左键点击: 立即刷新 | 右键点击: 暂停/继续';
        
    }, 2000); // Start timer after 2 seconds to ensure page is loaded
    
    // ==================== PHASE 5: AIRFLOW API INTEGRATION ====================
    
    // Airflow API configuration
    const AIRFLOW_BASE_URL = 'http://zacks.com.cn:8080/airflow/api/v1';
    
    // Check and prompt for credentials
    const checkCredentials = () => {
        return new Promise((resolve) => {
            let username = GM_getValue('airflow_username', null);
            let password = GM_getValue('airflow_password', null);
            
            if (!username || !password) {
                // First, remove any existing auth modal to avoid duplicates
                const existingModal = document.getElementById('tennis-auth-modal');
                if (existingModal) {
                    existingModal.remove();
                }
                
                // Create modal for credentials input with unique ID
                const modal = document.createElement('div');
                modal.id = 'tennis-auth-modal';
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000000;
                `;
                
                const modalContent = document.createElement('div');
                modalContent.style.cssText = `
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
                    max-width: 400px;
                    width: 90%;
                `;
                
                // Generate unique IDs to avoid conflicts
                const uniqueId = Date.now();
                const usernameId = `tennis-airflow-username-${uniqueId}`;
                const passwordId = `tennis-airflow-password-${uniqueId}`;
                const submitId = `tennis-auth-submit-${uniqueId}`;
                const cancelId = `tennis-auth-cancel-${uniqueId}`;
                
                const togglePasswordId = `tennis-toggle-password-${uniqueId}`;
                
                modalContent.innerHTML = `
                    <h2 style="margin-top: 0; color: #333;">🔐 Airflow API 认证</h2>
                    <p style="color: #666;">首次使用需要输入 Airflow API 账号密码</p>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #555;">用户名:</label>
                        <input type="text" id="${usernameId}" class="tennis-airflow-username" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; color: #555;">密码:</label>
                        <div style="position: relative;">
                            <input type="password" id="${passwordId}" class="tennis-airflow-password" style="width: 100%; padding: 8px 40px 8px 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                            <button type="button" id="${togglePasswordId}" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 5px; color: #666; font-size: 18px;" title="显示/隐藏密码">
                                <span style="display: inline-block; width: 20px; height: 20px;">👁️</span>
                            </button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="${submitId}" style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">保存</button>
                        <button id="${cancelId}" style="flex: 1; padding: 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">取消</button>
                    </div>
                `;
                
                modal.appendChild(modalContent);
                document.body.appendChild(modal);
                
                // Add password toggle functionality
                let passwordVisible = false;
                document.getElementById(togglePasswordId).onclick = () => {
                    const passwordInput = document.getElementById(passwordId);
                    const toggleBtn = document.getElementById(togglePasswordId);
                    
                    if (passwordVisible) {
                        passwordInput.type = 'password';
                        toggleBtn.innerHTML = '<span style="display: inline-block; width: 20px; height: 20px;">👁️</span>';
                        passwordVisible = false;
                    } else {
                        passwordInput.type = 'text';
                        toggleBtn.innerHTML = '<span style="display: inline-block; width: 20px; height: 20px;">👁️‍🗨️</span>';
                        passwordVisible = true;
                    }
                };
                
                // Use the unique IDs for event handlers
                document.getElementById(submitId).onclick = () => {
                    const inputUsername = document.getElementById(usernameId).value;
                    const inputPassword = document.getElementById(passwordId).value;
                    
                    if (inputUsername && inputPassword) {
                        GM_setValue('airflow_username', inputUsername);
                        GM_setValue('airflow_password', inputPassword);
                        modal.remove();
                        console.log('%c✅ [AIRFLOW] Credentials saved', 'background: green; color: white');
                        resolve({ username: inputUsername, password: inputPassword });
                    } else {
                        alert('请输入用户名和密码');
                    }
                };
                
                document.getElementById(cancelId).onclick = () => {
                    modal.remove();
                    console.log('%c❌ [AIRFLOW] Authentication cancelled', 'background: red; color: white');
                    resolve(null);
                };
                
                // Auto-focus username field with safer approach
                setTimeout(() => {
                    const usernameField = document.getElementById(usernameId);
                    if (usernameField) {
                        usernameField.focus();
                    }
                }, 100);
                
            } else {
                console.log('%c✅ [AIRFLOW] Using cached credentials', 'background: green; color: white');
                resolve({ username, password });
            }
        });
    };
    
    // Send data to Airflow
    const sendToAirflow = async () => {
        // First check if we have the necessary data
        if (!unsafeWindow.__salesName || unsafeWindow.__salesName === '') {
            console.log('%c⚠️ [AIRFLOW] 网球场名称未获取，请等待数据加载完成', 'background: orange; color: white; font-weight: bold');
            
            // Show warning notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: linear-gradient(135deg, #ff9800, #f57c00);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 999999;
                font-weight: bold;
                animation: slideIn 0.5s ease;
            `;
            notification.innerHTML = '⚠️ 请先等待场地信息加载完成';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
            return;
        }
        
        // Check if we have actual booking data
        if (!unsafeWindow.__orderList || unsafeWindow.__orderList.length === 0) {
            console.log('%c⚠️ [AIRFLOW] 没有预订数据，请先点击日期标签加载数据', 'background: orange; color: white; font-weight: bold');
            
            // Show warning notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: linear-gradient(135deg, #ff9800, #f57c00);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 999999;
                font-weight: bold;
                animation: slideIn 0.5s ease;
            `;
            notification.innerHTML = '⚠️ 没有预订数据，请先查询场地信息';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
            return;
        }
        
        const credentials = await checkCredentials();
        if (!credentials) {
            console.log('%c⚠️ [AIRFLOW] No credentials provided, skipping API call', 'background: orange; color: white');
            return;
        }
        
        // Get tennis court name and create variable key
        const courtName = unsafeWindow.__salesName;
        // Clean the court name to be used as a variable key (remove special characters, replace spaces with underscores)
        const variableKey = 'tennis_court_' + courtName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').toLowerCase();
        
        const authHeader = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
        const timestamp = new Date().toISOString();
        const dateStr = new Date().toLocaleDateString('zh-CN');
        
        // Process booking data to create formatted tables
        const bookingTable = [];
        const availabilityTable = {}; // New format as requested
        
        // Process all booking data
        if (unsafeWindow.__orderList && unsafeWindow.__orderList.length > 0) {
            console.log('%c📊 [AIRFLOW] Processing ' + unsafeWindow.__orderList.length + ' order lists', 'background: blue; color: white');
            
            // Process all order lists to get data for different dates
            unsafeWindow.__orderList.forEach((orderData, index) => {
                console.log('%c📋 [AIRFLOW] Processing order list #' + (index + 1), 'color: gray');
                console.log('  - Has tabDateInfo:', !!orderData.tabDateInfo);
                console.log('  - Is from tab click:', orderData.isFromTabClick);
                
                // Skip data not from tab click
                if (!orderData.isFromTabClick) {
                    console.log('%c⏭️ [AIRFLOW] Skipping order #' + (index + 1) + ' - not from tab click', 'color: orange');
                    return;
                }
                
                if (orderData.tabDateInfo) {
                    console.log('  - TabDateInfo content:', orderData.tabDateInfo);
                }
                
                if (orderData.data && Array.isArray(orderData.data) && orderData.data.length > 0) {
                    let dateKey = '';
                    
                    // First try to use tab date info if available
                    if (orderData.tabDateInfo) {
                        // Use the tab date info directly
                        const tabInfo = orderData.tabDateInfo;
                        console.log('%c📅 [AIRFLOW] Using tab date info for order #' + (index + 1) + ':', 'color: cyan', tabInfo);
                        
                        // Extract date and weekday from tab info
                        // tabInfo.date might be like "12-25" or "12月25日"
                        // tabInfo.weekday might be like "星期三" or "周三"
                        
                        if (tabInfo.date && tabInfo.weekday) {
                            // Clean up date format
                            let cleanDate = tabInfo.date.replace(/[月日]/g, '-').replace(/-$/, '');
                            if (cleanDate.match(/^\d{1,2}-\d{1,2}$/)) {
                                // Ensure two-digit format
                                const parts = cleanDate.split('-');
                                const month = parts[0].padStart(2, '0');
                                const day = parts[1].padStart(2, '0');
                                dateKey = `${month}-${day}(${tabInfo.weekday})`;
                            } else {
                                // Use full text as fallback
                                dateKey = tabInfo.fullText || tabInfo.text || '';
                            }
                        } else if (tabInfo.fullText) {
                            // Try to parse from full text
                            const match = tabInfo.fullText.match(/(\d{1,2})[-月](\d{1,2})/);
                            if (match) {
                                const month = match[1].padStart(2, '0');
                                const day = match[2].padStart(2, '0');
                                const weekdayMatch = tabInfo.fullText.match(/(星期[一二三四五六日]|周[一二三四五六日])/);
                                const weekday = weekdayMatch ? weekdayMatch[1] : '';
                                dateKey = `${month}-${day}(${weekday})`;
                            } else {
                                dateKey = tabInfo.fullText;
                            }
                        }
                    }
                    
                    // Skip data without tab date info (likely initial page load data)
                    if (!dateKey) {
                        console.log('%c⚠️ [AIRFLOW] Skipping data without tab date info (order #' + (index + 1) + ')', 'color: orange');
                        console.log('  - This is likely initial page load data, not from tab click');
                        return;
                    }
                    
                    console.log('%c📅 [AIRFLOW] Processing date:', 'color: green', dateKey);
                    
                    // Initialize date entry if not exists
                    if (!availabilityTable[dateKey]) {
                        availabilityTable[dateKey] = {};
                        console.log('%c✅ [AIRFLOW] Created new date entry for:', 'color: green', dateKey);
                    } else {
                        console.log('%c⚠️ [AIRFLOW] Date entry already exists for:', 'color: orange', dateKey);
                    }
                    
                    // Calculate availability for each venue
                    const hours = Array.from({length: 16}, (_, i) => i + 7); // 7:00 to 22:00
                    const venueAvailability = {};
                    
                    // Group bookings by venue ID
                    orderData.data.forEach(b => {
                        if (b.venueId && b.startTime && b.endTime) {
                            if (!venueAvailability[b.venueId]) {
                                venueAvailability[b.venueId] = {
                                    booked: new Set(),
                                    name: unsafeWindow.__venueNameMap[b.venueId] || b.venueName || b.venueId
                                };
                            }
                            const start = new Date(b.startTime).getHours();
                            const end = new Date(b.endTime).getHours();
                            for(let h = start; h < end; h++) {
                                venueAvailability[b.venueId].booked.add(h);
                            }
                        }
                    });
                    
                    // Helper function to convert hours array to time ranges
                    const hoursToRanges = (hours) => {
                        if (hours.length === 0) return [];
                        
                        const ranges = [];
                        let start = hours[0];
                        let end = hours[0];
                        
                        for (let i = 1; i < hours.length; i++) {
                            if (hours[i] === end + 1) {
                                end = hours[i];
                            } else {
                                ranges.push(start.toString().padStart(2, '0') + ':00-' + (end + 1).toString().padStart(2, '0') + ':00');
                                start = hours[i];
                                end = hours[i];
                            }
                        }
                        ranges.push(start.toString().padStart(2, '0') + ':00-' + (end + 1).toString().padStart(2, '0') + ':00');
                        return ranges;
                    };
                    
                    // Build availability for each venue
                    for (const venueId in venueAvailability) {
                        const venue = venueAvailability[venueId];
                        const available = hours.filter(h => !venue.booked.has(h));
                        const timeRanges = hoursToRanges(available);
                        
                        // Add to new format
                        const venueName = venue.name;
                        if (timeRanges.length > 0) {
                            availabilityTable[dateKey][venueName] = timeRanges;
                        }
                    }
                    
                    // Create booking summary table
                    orderData.data.forEach(item => {
                        bookingTable.push({
                            courtName: courtName,
                            venueId: item.venueId || null,
                            venueName: unsafeWindow.__venueNameMap[item.venueId] || item.venueName || '未知场地',
                            status: item.dealId ? 'locked' : (item.orderId ? 'confirmed' : 'available'),
                            statusText: item.dealId ? '已锁定' : (item.orderId ? '已确认' : '可用'),
                            startTime: item.startTime || null,
                            endTime: item.endTime || null,
                            timeSlot: item.startTime ? 
                                new Date(item.startTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'}) + 
                                '-' + 
                                new Date(item.endTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'}) 
                                : null,
                            price: item.price || null,
                            date: dateKey
                        });
                    });
                }
            });
        }
        
        // Get venue configuration info
        let venueConfigInfo = null;
        if (unsafeWindow.__venueConfig && unsafeWindow.__venueConfig.length > 0) {
            const latestConfig = unsafeWindow.__venueConfig[unsafeWindow.__venueConfig.length - 1];
            if (latestConfig.data) {
                venueConfigInfo = {
                    salesName: latestConfig.data.salesName || courtName,
                    venues: []
                };
                
                if (latestConfig.data.venueResponses) {
                    venueConfigInfo.venues = latestConfig.data.venueResponses.map(v => ({
                        venueId: v.venueId,
                        venueName: v.venueName,
                        isOpen: v.platformOpen === 1,
                        closeReason: v.platformCloseAlert || null
                    }));
                }
            }
        }
        
        // Format the data for Airflow
        const formattedData = {
            timestamp: timestamp,
            courtName: courtName,
            date: dateStr,
            
            // Formatted tables for easy processing
            bookingTable: bookingTable,
            availabilityTable: availabilityTable, // New format as requested
            
            // Venue configuration
            venueConfig: venueConfigInfo,
            
            // Summary statistics
            summary: {
                totalVenues: Object.keys(unsafeWindow.__venueNameMap || {}).length,
                totalBookings: bookingTable.length,
                totalDates: Object.keys(availabilityTable).length,
                lastUpdate: timestamp
            },
            
            // Raw data for reference
            rawData: {
                venueNameMap: unsafeWindow.__venueNameMap || {},
                orderListCount: unsafeWindow.__orderList ? unsafeWindow.__orderList.length : 0,
                configCount: unsafeWindow.__venueConfig ? unsafeWindow.__venueConfig.length : 0
            }
        };
        
        const jsonString = JSON.stringify(formattedData);
        const description = `${courtName} booking data updated at ${timestamp}`;
        
        // Log summary of data being sent
        console.log('%c📊 [AIRFLOW] 准备发送数据到 Airflow', 'background: purple; color: white; font-weight: bold');
        console.log('网球场名称:', courtName);
        console.log('变量名称:', variableKey);
        console.log('日期:', dateStr);
        
        // Show booking table summary
        if (bookingTable.length > 0) {
            console.log('%c📋 预订信息表 (bookingTable):', 'background: blue; color: white');
            console.table(bookingTable.map(b => ({
                '场地': b.venueName,
                '状态': b.statusText,
                '时段': b.timeSlot,
                '价格': b.price
            })));
        }
        
        // Show new format availability table
        if (Object.keys(availabilityTable).length > 0) {
            console.log('%c⏰ 可用时段表:', 'background: green; color: white');
            console.log('availabilityTable:', availabilityTable);
            
            // Also show in table format for each date
            for (const dateKey in availabilityTable) {
                console.log(`%c📅 ${dateKey}:`, 'color: cyan; font-weight: bold');
                const dateData = [];
                for (const venueName in availabilityTable[dateKey]) {
                    dateData.push({
                        '场地': venueName,
                        '可用时段': availabilityTable[dateKey][venueName].join(', ')
                    });
                }
                if (dateData.length > 0) {
                    console.table(dateData);
                }
            }
        }
        
        // Show summary statistics
        console.log('%c📈 汇总统计 (summary):', 'background: teal; color: white');
        console.log('  - 场地总数:', formattedData.summary.totalVenues);
        console.log('  - 预订记录数:', formattedData.summary.totalBookings);
        console.log('  - 日期数量:', formattedData.summary.totalDates);
        
        // First try to update existing variable
        console.log('%c🔄 [AIRFLOW] Attempting to update variable: ' + variableKey, 'background: blue; color: white');
        
        GM_xmlhttpRequest({
            method: 'PATCH',
            url: `${AIRFLOW_BASE_URL}/variables/${variableKey}`,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: JSON.stringify({
                key: variableKey,
                value: jsonString,
                description: description
            }),
            onload: function(response) {
                if (response.status === 200 || response.status === 204) {
                    console.log('%c✅ [AIRFLOW] Variable updated successfully', 'background: green; color: white; font-size: 14px; font-weight: bold');
                    console.log('Response:', response.responseText);
                    
                    // Show success notification
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 100px;
                        right: 20px;
                        background: linear-gradient(135deg, #4CAF50, #45a049);
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        z-index: 999999;
                        font-weight: bold;
                        animation: slideIn 0.5s ease;
                    `;
                    notification.innerHTML = `✅ 数据已成功同步到 Airflow<br><small>变量: ${variableKey}</small>`;
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 5000);
                    
                } else if (response.status === 404) {
                    // Variable doesn't exist, create it
                    console.log('%c📝 [AIRFLOW] Variable not found, creating new: ' + variableKey, 'background: orange; color: white');
                    
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${AIRFLOW_BASE_URL}/variables`,
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        data: JSON.stringify({
                            key: variableKey,
                            value: jsonString,
                            description: description
                        }),
                        onload: function(createResponse) {
                            if (createResponse.status === 200 || createResponse.status === 201) {
                                console.log('%c✅ [AIRFLOW] Variable created successfully', 'background: green; color: white; font-size: 14px; font-weight: bold');
                                console.log('Response:', createResponse.responseText);
                                
                                // Show success notification
                                const notification = document.createElement('div');
                                notification.style.cssText = `
                                    position: fixed;
                                    top: 100px;
                                    right: 20px;
                                    background: linear-gradient(135deg, #4CAF50, #45a049);
                                    color: white;
                                    padding: 15px 20px;
                                    border-radius: 8px;
                                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                                    z-index: 999999;
                                    font-weight: bold;
                                    animation: slideIn 0.5s ease;
                                `;
                                notification.innerHTML = `✅ 数据已成功创建并同步到 Airflow<br><small>变量: ${variableKey}</small>`;
                                document.body.appendChild(notification);
                                setTimeout(() => notification.remove(), 5000);
                                
                            } else {
                                console.log('%c❌ [AIRFLOW] Failed to create variable', 'background: red; color: white');
                                console.log('Status:', createResponse.status);
                                console.log('Response:', createResponse.responseText);
                                
                                // Check if it's authentication error
                                if (createResponse.status === 401 || createResponse.status === 403) {
                                    console.log('%c🔒 [AIRFLOW] Authentication failed, clearing saved credentials', 'background: red; color: white');
                                    GM_setValue('airflow_username', null);
                                    GM_setValue('airflow_password', null);
                                    alert('Airflow API 认证失败，请重新输入账号密码');
                                }
                            }
                        },
                        onerror: function(error) {
                            console.log('%c❌ [AIRFLOW] Network error creating variable', 'background: red; color: white');
                            console.error(error);
                        }
                    });
                    
                } else {
                    console.log('%c❌ [AIRFLOW] Failed to update variable', 'background: red; color: white');
                    console.log('Status:', response.status);
                    console.log('Response:', response.responseText);
                    
                    // Check if it's authentication error
                    if (response.status === 401 || response.status === 403) {
                        console.log('%c🔒 [AIRFLOW] Authentication failed, clearing saved credentials', 'background: red; color: white');
                        GM_setValue('airflow_username', null);
                        GM_setValue('airflow_password', null);
                        alert('Airflow API 认证失败，请重新输入账号密码');
                    }
                }
            },
            onerror: function(error) {
                console.log('%c❌ [AIRFLOW] Network error updating variable', 'background: red; color: white');
                console.error(error);
            }
        });
    };
    
    // Add CSS for animations
    GM_addStyle(`
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `);
    
    // ==================== PHASE 6: SKIP VERIFICATION - CONTINUE DATA COLLECTION ====================
    
    console.log('%c🚀 [NO-VERIFICATION] Script will continue data collection regardless of any verification', 'background: green; color: white; font-weight: bold');
    
    // Simply log if verification exists but don't stop the script
    const checkForVerification = () => {
        const wafWrapper = document.querySelector('#WAF_NC_WRAPPER, .waf-nc-wrapper');
        const sliderElement = document.querySelector('#aliyunCaptcha-sliding-slider, .aliyunCaptcha-sliding-slider');
        
        if (wafWrapper || sliderElement) {
            console.log('%c⚠️ [NO-VERIFICATION] Verification detected but continuing with data collection...', 'background: orange; color: white');
        }
    };
    
    // Check once on page load
    setTimeout(checkForVerification, 2000);
    
    // ==================== PHASE 7: AUTO-CLICK DATETIME TABS ====================
    
    // Track if we've already clicked tabs to avoid duplicates
    let hasClickedTabs = false;
    
    // Auto-click all datetime tabs after page load with better timing
    const waitForDateTimeTabs = () => {
        // Avoid duplicate execution
        if (hasClickedTabs) {
            console.log('%c⏭️ [AUTO-CLICK] Already clicked tabs, skipping...', 'color: gray');
            return;
        }
        
        console.log('%c🔍 [AUTO-CLICK] Waiting for page to load datetime tabs...', 'background: blue; color: white; font-weight: bold');
        
        let checkCount = 0;
        const maxChecks = 20; // Try for up to 20 seconds
        
        const checkForTabs = setInterval(() => {
            checkCount++;
            
            // Check if page has loaded and tabs are available
            // Look for container elements that might hold date tabs
            const containerElements = document.querySelectorAll('.inline-flex, [class*="flex"], [class*="tab"], .date-container');
            const weekElements = document.querySelectorAll('div.week, div.dt, .week, .dt, [class*="week"], [class*="date"]');
            const hasWeekdayText = document.body && (
                document.body.textContent.includes('星期') || 
                document.body.textContent.includes('周一') ||
                document.body.textContent.includes('今天')
            );
            
            // Check for containers with both week and date
            let hasDateContainers = false;
            containerElements.forEach(container => {
                const weekEl = container.querySelector('.week, .dt.week');
                const dateEl = container.querySelector('.datetime, .dt.datetime');
                if (weekEl && dateEl) {
                    hasDateContainers = true;
                }
            });
            
            console.log(`%c🔍 [AUTO-CLICK] Check #${checkCount}: Found ${weekElements.length} potential tab elements`, 'color: gray');
            
            if (hasDateContainers || weekElements.length > 0 || hasWeekdayText) {
                clearInterval(checkForTabs);
                console.log('%c✅ [AUTO-CLICK] Page loaded, starting auto-click...', 'background: green; color: white; font-weight: bold');
                hasClickedTabs = true; // Mark as clicked
                clickDateTimeTabs();
            } else if (checkCount >= maxChecks) {
                clearInterval(checkForTabs);
                console.log('%c⚠️ [AUTO-CLICK] Timeout waiting for tabs, attempting anyway...', 'background: orange; color: white');
                hasClickedTabs = true; // Mark as clicked
                clickDateTimeTabs();
            }
        }, 1000); // Check every second
        
        const clickDateTimeTabs = async () => {
            console.log('%c🔍 [AUTO-CLICK] Searching for weekday tabs...', 'background: blue; color: white');
            
            // Track clicked dates to avoid duplicates
            const clickedDates = new Set();
            
            // More comprehensive selectors for weekday tabs, but avoid duplicates
            const allElements = document.querySelectorAll('div.week, div.dt, .week, .dt, [class*="week"]:not([class*="weekend"]), [class*="date"], .date-tab, .weekday-tab, .schedule-date');
            const weekdayTabs = [];
            const processedTexts = new Set();
            const processedElements = new Set(); // Track processed elements to avoid duplicates
            
            // Also check for weekday patterns
            const weekdayPatterns = [
                /星期[一二三四五六日]/,
                /周[一二三四五六日]/,
                /\d{1,2}月\d{1,2}日/,
                /今天|明天|后天/
            ];
            
            // Collect all tabs without checking for active tab
            console.log('%c📋 [AUTO-CLICK] Collecting all date tabs...', 'background: blue; color: white');
            
            // Second pass: collect clickable tabs, looking for container elements
            // Try to find parent containers that hold both weekday and date
            const containerElements = document.querySelectorAll('.inline-flex, [class*="flex"], [class*="tab"], .date-container');
            
            containerElements.forEach(container => {
                // Check if this container has both week and date elements
                const weekElement = container.querySelector('.week, .dt.week, [class*="week"]');
                const dateElement = container.querySelector('.datetime, .dt.datetime, [class*="date"]:not([class*="week"])');
                
                if (weekElement && dateElement) {
                    const weekText = (weekElement.textContent || '').trim();
                    const dateText = (dateElement.textContent || '').trim();
                    const fullText = `${weekText} ${dateText}`;
                    
                    // Add all tabs without skipping any
                    if (!processedTexts.has(fullText) && !processedElements.has(container)) {
                        const rect = container.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            weekdayTabs.push({
                                element: container,
                                text: fullText,
                                weekday: weekText,
                                date: dateText,
                                rect: rect
                            });
                            processedTexts.add(fullText);
                            processedElements.add(container);
                            console.log('%c✓ Found date tab container: ' + fullText, 'color: cyan');
                        }
                    }
                }
            });
            
            // Fallback: if no containers found, try individual elements
            if (weekdayTabs.length === 0) {
                allElements.forEach(el => {
                    // Skip if already processed this element
                    if (processedElements.has(el)) {
                        return;
                    }
                    
                    const text = (el.textContent || '').trim();
                    
                    // Process all tabs without skipping
                    
                    // Check if contains weekday text and not already processed
                    const hasWeekday = weekdayPatterns.some(pattern => pattern.test(text));
                    
                    if (hasWeekday && !processedTexts.has(text)) {
                        const rect = el.getBoundingClientRect();
                        
                        // Only add visible elements
                        if (rect.width > 0 && rect.height > 0) {
                            // Check for parent-child relationships to avoid duplicates
                            let isDuplicate = false;
                            for (const existing of weekdayTabs) {
                                if (existing.element.contains(el) || el.contains(existing.element)) {
                                    isDuplicate = true;
                                    break;
                                }
                            }
                            
                            if (!isDuplicate) {
                                weekdayTabs.push({
                                    element: el,
                                    text: text,
                                    rect: rect
                                });
                                processedTexts.add(text);
                                processedElements.add(el);
                                console.log('%c✓ Will click weekday element: ' + text, 'color: cyan');
                            }
                        }
                    }
                });
            }
            
            // Sort by position (left to right)
            weekdayTabs.sort((a, b) => {
                if (Math.abs(a.rect.top - b.rect.top) > 10) {
                    return a.rect.top - b.rect.top;
                }
                return a.rect.left - b.rect.left;
            });
            
            console.log('%c📅 [AUTO-CLICK] Found ' + weekdayTabs.length + ' weekday tabs', 'background: green; color: white; font-weight: bold');
            
            if (weekdayTabs.length > 0) {
                let clickCount = 0;
                
                // Create status display
                const statusDisplay = document.createElement('div');
                statusDisplay.style.cssText = `
                    position: fixed;
                    top: 50px;
                    right: 20px;
                    background: rgba(0, 100, 200, 0.9);
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    font-family: monospace;
                    font-size: 12px;
                    z-index: 999996;
                    max-width: 300px;
                `;
                
                if (document.body) {
                    document.body.appendChild(statusDisplay);
                }
                
                // Show all found tabs
                console.log('%c📋 Will click the following tabs in order:', 'background: blue; color: white');
                weekdayTabs.forEach((tab, index) => {
                    console.log('  ' + (index + 1) + '. ' + tab.text);
                });
                
                // Print all tabs that will be clicked
                console.log('%c📋 [AUTO-CLICK] Found ' + weekdayTabs.length + ' tabs to click:', 'background: purple; color: white; font-weight: bold');
                weekdayTabs.forEach((tab, index) => {
                    console.log(`  ${index + 1}. ${tab.date || ''} ${tab.weekday || ''} (${tab.text})`);
                });
                console.table(weekdayTabs.map((tab, index) => ({
                    '序号': index + 1,
                    '日期': tab.date || 'N/A',
                    '星期': tab.weekday || 'N/A',
                    '完整文本': tab.text
                })));
                
                // Click each tab with delay
                for (let i = 0; i < weekdayTabs.length; i++) {
                    const tabInfo = weekdayTabs[i];
                    const tab = tabInfo.element;
                    const tabText = tabInfo.text;
                    const dateKey = tabInfo.date || tabText; // Use date field if available
                    
                    // Skip if already clicked this date
                    if (clickedDates.has(dateKey)) {
                        console.log('%c⏭️ [AUTO-CLICK] Already clicked date: ' + dateKey + ', skipping...', 'color: gray');
                        continue;
                    }
                    clickedDates.add(dateKey);
                    
                    // Update status
                    if (statusDisplay) {
                        statusDisplay.innerHTML = `
                            🤖 自动点击日期标签...<br>
                            进度: ${i + 1}/${weekdayTabs.length}<br>
                            当前: ${tabText}<br>
                            <small>等待数据加载 (最多20秒)...</small>
                        `;
                    }
                    
                    try {
                        // Highlight the tab being clicked
                        const originalBorder = tab.style.border;
                        const originalBackground = tab.style.background;
                        const originalBoxShadow = tab.style.boxShadow;
                        
                        tab.style.border = '3px solid #ff0000';
                        tab.style.background = 'rgba(255, 0, 0, 0.3)';
                        tab.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)';
                        
                        // Scroll into view if needed
                        tab.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Wait for scroll animation to complete
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        // Save current tab date info before clicking
                        unsafeWindow.__currentTabDate = {
                            text: tabText,
                            weekday: tabInfo.weekday || '',
                            date: tabInfo.date || '',
                            fullText: tabInfo.text || tabText
                        };
                        console.log('%c📅 [AUTO-CLICK] Saving tab date info:', 'color: cyan', unsafeWindow.__currentTabDate);
                        
                        // Click the tab
                        tab.click();
                        clickCount++;
                        
                        console.log('%c✅ [AUTO-CLICK] Clicked tab #' + (i + 1) + ': ' + tabText, 'background: green; color: white');
                        
                        // Add a delay after click to allow page to respond
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Wait for data to load and be captured
                        const dataLoadStartTime = Date.now();
                        const maxWaitTime = 20000; // Max 20 seconds per tab
                        let dataLoaded = false;
                        
                        // Store the current data count and API call count before click
                        const previousOrderCount = unsafeWindow.__orderList ? unsafeWindow.__orderList.length : 0;
                        const previousApiCallCount = unsafeWindow.__getVenueOrderListCallCount || 0;
                        
                        console.log('%c⏳ [AUTO-CLICK] Waiting for getVenueOrderList API call...', 'color: cyan');
                        console.log('  - Previous API call count:', previousApiCallCount);
                        console.log('  - Previous data count:', previousOrderCount);
                        
                        // First wait for API call
                        let apiCalled = false;
                        const apiWaitStartTime = Date.now();
                        while (!apiCalled && (Date.now() - apiWaitStartTime) < 5000) { // Wait up to 5 seconds for API call
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            const currentApiCallCount = unsafeWindow.__getVenueOrderListCallCount || 0;
                            if (currentApiCallCount > previousApiCallCount) {
                                apiCalled = true;
                                console.log('%c📡 [AUTO-CLICK] getVenueOrderList API called! Call #' + currentApiCallCount, 'background: blue; color: white');
                            }
                        }
                        
                        if (!apiCalled) {
                            console.log('%c⚠️ [AUTO-CLICK] No API call detected for tab: ' + tabText, 'background: orange; color: white');
                        }
                        
                        // Then wait for data to be captured
                        while (!dataLoaded && (Date.now() - dataLoadStartTime) < maxWaitTime) {
                            await new Promise(resolve => setTimeout(resolve, 1000)); // Check every 1 second
                            
                            // Check if new data has been captured
                            const currentOrderCount = unsafeWindow.__orderList ? unsafeWindow.__orderList.length : 0;
                            
                            if (currentOrderCount > previousOrderCount) {
                                dataLoaded = true;
                                console.log('%c✅ [AUTO-CLICK] Data captured! New data count: ' + currentOrderCount, 'background: green; color: white');
                                
                                // Wait more to ensure all data is fully processed
                                await new Promise(resolve => setTimeout(resolve, 2000));
                            }
                            
                            // Also check for loading indicators
                            const loadingIndicator = document.querySelector('.loading, .spinner, [class*="loading"], [class*="spinner"]');
                            if (loadingIndicator) {
                                console.log('%c⏳ [AUTO-CLICK] Loading indicator detected, waiting...', 'color: gray');
                            }
                        }
                        
                        if (!dataLoaded) {
                            console.log('%c⚠️ [AUTO-CLICK] Timeout waiting for data on tab: ' + tabText, 'background: orange; color: white');
                        }
                        
                        // Restore original style
                        tab.style.border = originalBorder;
                        tab.style.background = originalBackground;
                        tab.style.boxShadow = originalBoxShadow;
                        
                        // Add delay before clicking next tab
                        if (i < weekdayTabs.length - 1) {
                            console.log('%c⏸️ [AUTO-CLICK] Pausing before next tab...', 'color: gray');
                            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause between tabs
                        }
                        
                    } catch(e) {
                        console.log('%c❌ [AUTO-CLICK] Failed to click tab: ' + tabText, 'color: red');
                        console.error(e);
                    }
                }
                
                // Show completion message
                if (statusDisplay) {
                    statusDisplay.style.background = 'rgba(0, 200, 0, 0.9)';
                    statusDisplay.innerHTML = `
                        ✅ 自动点击完成!<br>
                        成功点击 ${clickCount}/${weekdayTabs.length} 个标签<br>
                        所有场地数据已捕获
                    `;
                    
                    // Remove status after 5 seconds
                    setTimeout(() => {
                        statusDisplay.remove();
                    }, 5000);
                }
                
                console.log('%c🎉 [AUTO-CLICK] Completed! Clicked ' + clickCount + ' tabs', 'background: green; color: white; font-size: 14px; font-weight: bold');
                
                // Trigger data check after all clicks
                setTimeout(() => {
                    if (unsafeWindow.check) {
                        console.log('%c📊 [AUTO-CLICK] Showing captured data summary', 'background: purple; color: white');
                        unsafeWindow.check();
                    }
                    
                    // Send captured data to Airflow only if we have data
                    console.log('%c🔍 [AUTO-CLICK] 检查数据完整性...', 'background: blue; color: white');
                    console.log('  - unsafeWindow.__salesName:', unsafeWindow.__salesName);
                    console.log('  - unsafeWindow.__orderList:', unsafeWindow.__orderList);
                    console.log('  - unsafeWindow.__orderList.length:', unsafeWindow.__orderList ? unsafeWindow.__orderList.length : 0);
                    console.log('  - unsafeWindow.__venueConfig.length:', unsafeWindow.__venueConfig ? unsafeWindow.__venueConfig.length : 0);
                    
                    if (unsafeWindow.__salesName && unsafeWindow.__orderList && unsafeWindow.__orderList.length > 0) {
                        console.log('%c📤 [AUTO-CLICK] Sending data to Airflow...', 'background: purple; color: white; font-weight: bold');
                        sendToAirflow();
                    } else {
                        console.log('%c⚠️ [AUTO-CLICK] 数据不完整，跳过 Airflow 同步', 'background: orange; color: white');
                        console.log('  - 网球场名称:', unsafeWindow.__salesName || '未获取');
                        console.log('  - 预订数据数量:', unsafeWindow.__orderList ? unsafeWindow.__orderList.length : 0);
                        
                        // Additional debug: check what data we actually have
                        if (unsafeWindow.__venueConfig && unsafeWindow.__venueConfig.length > 0) {
                            const lastConfig = unsafeWindow.__venueConfig[unsafeWindow.__venueConfig.length - 1];
                            console.log('  - 最新配置数据字段:', Object.keys(lastConfig.data || {}));
                        }
                        if (unsafeWindow.__orderList && unsafeWindow.__orderList.length > 0) {
                            const lastOrder = unsafeWindow.__orderList[unsafeWindow.__orderList.length - 1];
                            if (lastOrder.data && lastOrder.data.length > 0) {
                                console.log('  - 最新预订数据字段:', Object.keys(lastOrder.data[0] || {}));
                            }
                        }
                    }
                }, 2000);
                
            } else {
                console.log('%c⚠️ [AUTO-CLICK] No weekday tabs found on this page', 'background: orange; color: white');
                console.log('Looking for elements with patterns: 周一-周日, 星期一-星期日, 今天, 明天, 后天, or date format like 12月25日');
            }
        };
    };
    
    // Start waiting for tabs with initial delay to ensure page is ready
    setTimeout(() => {
        // Always run auto-click regardless of WAF/verification
        console.log('%c🚀 [AUTO-CLICK] Starting auto-click (ignoring any verification)...', 'background: green; color: white');
        waitForDateTimeTabs();
    }, 3000); // Initial 3 second delay
    
})();