// ==UserScript==
// @name         Anti-Debugger Bypass Ultimate
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Ultimate anti-debugger bypass - blocks all debugger statements and infinite loops
// @author       Claude
// @match        https://wxsports.ydmap.cn/*
// @match        http://wxsports.ydmap.cn/*
// @match        *://*.ydmap.cn/*
// @icon         🛡️
// @grant        GM_addStyle
// @grant        GM_log
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/claude89757/TennisCourtMonitorJS/main/anti-debugger.user.js
// @downloadURL  https://raw.githubusercontent.com/claude89757/TennisCourtMonitorJS/main/anti-debugger.user.js
// @homepageURL  https://github.com/claude89757/TennisCourtMonitorJS
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('%c[ANTI-DEBUG] 🛡️ Anti-Debugger Script Loading...', 'background: blue; color: white; font-size: 14px; font-weight: bold');
    
    // ==================== ANTI-DEBUGGER CORE ====================
    
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
            
            console.log('%c[ANTI-DEBUG] 🛡️ Protection active!', 'background: green; color: white; font-weight: bold');
        })();
    `;
    
    // ==================== INJECTION MECHANISM ====================
    
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
                console.log('[ANTI-DEBUG] Anti-debugger injected to:', target.tagName);
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
    
    // ==================== VISUAL INDICATOR ====================
    
    setTimeout(() => {
        // Add status banner
        const banner = document.createElement('div');
        banner.innerHTML = '🛡️ ANTI-DEBUGGER ACTIVE';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(90deg, #FF6B6B, #4ECDC4);
            color: white;
            padding: 8px;
            text-align: center;
            z-index: 999999;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        `;
        
        if (document.body) {
            document.body.appendChild(banner);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                banner.style.transition = 'opacity 0.5s ease';
                banner.style.opacity = '0';
                setTimeout(() => banner.remove(), 500);
            }, 5000);
        }
        
        // Add floating indicator
        const indicator = document.createElement('div');
        indicator.innerHTML = '🛡️';
        indicator.title = 'Anti-Debugger Active';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            z-index: 999998;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
            animation: shieldPulse 2s infinite;
        `;
        
        if (document.body) {
            document.body.appendChild(indicator);
        }
    }, 1000);
    
    // Add animation
    GM_addStyle(`
        @keyframes shieldPulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
    `);
    
    console.log('%c[ANTI-DEBUG] 🛡️ Anti-Debugger Script Loaded Successfully', 'background: green; color: white; font-size: 16px; font-weight: bold');
    
})();
