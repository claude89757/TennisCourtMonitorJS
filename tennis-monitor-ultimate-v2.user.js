// ==UserScript==
// @name         Tennis Court Monitor Ultimate V2
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Ultimate anti-debugger bypass with aggressive injection
// @author       Claude
// @match        https://wxsports.ydmap.cn/booking/schedule/*
// @match        https://wxsports.ydmap.cn/*
// @match        http://wxsports.ydmap.cn/*
// @match        *://*.ydmap.cn/*
// @icon         🎾
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_log
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
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
                                
                                // Extract salesName (tennis court name)
                                if (result.data && result.data.salesName) {
                                    window.__salesName = result.data.salesName;
                                    console.log('网球场名称:', window.__salesName);
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
                
                // Only log target API calls
                if (url.includes('getVenueOrderList') || url.includes('getSportVenueConfig')) {
                    console.log('%c[API] ' + method + ' ' + url, 'color: gray; font-size: 11px');
                }
                
                return originalOpen.apply(this, arguments);
            };
            
            XMLHttpRequest.prototype.send = function(body) {
                const self = this;
                
                // Only process target APIs - let JSON.parse handle the decrypted data
                if (self._url && (self._url.includes('getVenueOrderList') || self._url.includes('getSportVenueConfig'))) {
                    this.addEventListener('readystatechange', function() {
                        if (self.readyState === 4 && self.status === 200) {
                            // Log that we received encrypted response
                            try {
                                const response = JSON.parse(self.responseText);
                                if (response.data && typeof response.data === 'string') {
                                    console.log('%c[API] 收到加密响应，等待解密...', 'color: orange; font-size: 11px');
                                }
                            } catch(e) {}
                        }
                    });
                }
                
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
            
            // Add commands
            window.check = function() {
                console.log('%c===== 数据汇总 =====', 'background: black; color: yellow; font-weight: bold');
                console.log('预订信息 (getVenueOrderList):', window.__orderList.length + ' 次捕获');
                if (window.__orderList.length > 0) {
                    console.log('最新预订数据:', window.__orderList[window.__orderList.length - 1]);
                }
                console.log('场地配置 (getSportVenueConfig):', window.__venueConfig.length + ' 次捕获');
                if (window.__venueConfig.length > 0) {
                    console.log('最新配置数据:', window.__venueConfig[window.__venueConfig.length - 1]);
                }
            };
            
            console.log('%c[MONITOR] 监控已启动! 输入 check() 查看数据', 'background: green; color: white; font-weight: bold');
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
            console.log('[TM] Visual button added');
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
    
    // Auto refresh page every 1 minute
    setTimeout(() => {
        console.log('%c⏰ [AUTO-REFRESH] Starting 1-minute refresh timer', 'background: orange; color: white; font-weight: bold');
        
        let refreshCountdown = 60; // seconds
        
        // Create countdown display
        const countdownDisplay = document.createElement('div');
        countdownDisplay.id = 'refresh-countdown';
        countdownDisplay.style.cssText = `
            position: fixed;
            bottom: 90px;
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
    
    // ==================== PHASE 5: AUTO-CLICK DATETIME TABS ====================
    
    // Auto-click all datetime tabs after page load
    setTimeout(() => {
        console.log('%c🔍 [AUTO-CLICK] Looking for datetime tabs...', 'background: blue; color: white; font-weight: bold');
        
        const clickDateTimeTabs = async () => {
            console.log('%c🔍 [AUTO-CLICK] Searching for weekday tabs...', 'background: blue; color: white');
            
            // Simple and precise: target div.week or div.dt elements
            const weekdayElements = document.querySelectorAll('div.week, div.dt, .week, .dt');
            const weekdayTabs = [];
            const processedTexts = new Set();
            let currentActiveTab = null;
            
            // Also check for weekday patterns
            const weekdayPatterns = [
                /星期[一二三四五六日]/,
                /周[一二三四五六日]/,
                /\d{1,2}月\d{1,2}日/,
                /今天|明天|后天/
            ];
            
            // First pass: find the currently visible/active tab by checking computed styles
            let activeTabText = null;
            weekdayElements.forEach(el => {
                const text = (el.textContent || '').trim();
                const hasWeekday = weekdayPatterns.some(pattern => pattern.test(text));
                
                if (hasWeekday) {
                    // Check various ways to detect if this is the current tab
                    const computedStyle = window.getComputedStyle(el);
                    const parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
                    
                    // Check for distinctive active styles
                    const possiblyActive = 
                        // Check element's own styles
                        computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                        computedStyle.backgroundColor !== 'transparent' &&
                        computedStyle.backgroundColor !== '' ||
                        computedStyle.color === 'rgb(255, 255, 255)' || // Often active tabs have white text
                        computedStyle.fontWeight === 'bold' ||
                        computedStyle.fontWeight === '700' ||
                        // Check parent's styles
                        (parentStyle && (
                            parentStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                            parentStyle.backgroundColor !== 'transparent'
                        )) ||
                        // Check classes
                        el.classList.contains('active') ||
                        el.classList.contains('selected') ||
                        el.classList.contains('on') ||
                        (el.parentElement && (
                            el.parentElement.classList.contains('active') ||
                            el.parentElement.classList.contains('selected')
                        ));
                    
                    if (possiblyActive && !activeTabText) {
                        activeTabText = text;
                        currentActiveTab = el;
                        console.log('%c🎯 Detected current active tab: ' + text, 'background: red; color: yellow; font-weight: bold');
                        console.log('  Background:', computedStyle.backgroundColor);
                        console.log('  Color:', computedStyle.color);
                        console.log('  Classes:', el.className);
                    }
                }
            });
            
            // If no active tab detected by styles, assume the first visible one is active
            if (!activeTabText) {
                console.log('%c⚠️ Could not detect active tab by styles, will click all visible tabs', 'color: orange');
            }
            
            // Second pass: collect clickable tabs, skipping the active one
            weekdayElements.forEach(el => {
                const text = (el.textContent || '').trim();
                
                // Skip if this is the active tab we detected
                if (activeTabText && text === activeTabText) {
                    console.log('%c⏭️ Skipping current active tab: ' + text, 'background: orange; color: white; font-weight: bold');
                    return;
                }
                
                // Check if contains weekday text and not already processed
                const hasWeekday = weekdayPatterns.some(pattern => pattern.test(text));
                
                if (hasWeekday && !processedTexts.has(text)) {
                    const rect = el.getBoundingClientRect();
                    
                    // Only add visible elements
                    if (rect.width > 0 && rect.height > 0) {
                        weekdayTabs.push({
                            element: el,
                            text: text,
                            rect: rect
                        });
                        processedTexts.add(text);
                        console.log('%c✓ Will click weekday element: ' + text, 'color: cyan');
                    }
                }
            });
            
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
                
                // Show which tab was skipped
                if (activeTabText) {
                    console.log('%c⏭️ Active tab detected and skipped: ' + activeTabText, 'background: orange; color: white; font-weight: bold');
                }
                
                // Click each tab with delay
                for (let i = 0; i < weekdayTabs.length; i++) {
                    const tabInfo = weekdayTabs[i];
                    const tab = tabInfo.element;
                    const tabText = tabInfo.text;
                    
                    // Update status
                    if (statusDisplay) {
                        statusDisplay.innerHTML = `
                            🤖 自动点击日期标签...<br>
                            进度: ${i + 1}/${weekdayTabs.length}<br>
                            当前: ${tabText}<br>
                            <small>等待5秒加载数据...</small>
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
                        
                        // Small delay for scroll
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Click the tab
                        tab.click();
                        clickCount++;
                        
                        console.log('%c✅ [AUTO-CLICK] Clicked tab #' + (i + 1) + ': ' + tabText, 'background: green; color: white');
                        
                        // Wait for data to load (5 seconds between clicks)
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        
                        // Restore original style
                        tab.style.border = originalBorder;
                        tab.style.background = originalBackground;
                        tab.style.boxShadow = originalBoxShadow;
                        
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
                }, 2000);
                
            } else {
                console.log('%c⚠️ [AUTO-CLICK] No weekday tabs found on this page', 'background: orange; color: white');
                console.log('Looking for elements with patterns: 周一-周日, 星期一-星期日, 今天, 明天, 后天, or date format like 12月25日');
            }
        };
        
        // Execute auto-click
        clickDateTimeTabs();
        
        // Also set up to run after each refresh
        window.addEventListener('load', () => {
            setTimeout(clickDateTimeTabs, 3000);
        });
        
    }, 5000); // Wait 5 seconds after page load to ensure everything is rendered
    
})();