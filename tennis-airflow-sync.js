// ==UserScript==
// @name         Tennis Court Airflow Sync
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  定时同步网球场预订数据到 Airflow（自动点击多日期收集数据）
// @author       Claude
// @match        https://wxsports.ydmap.cn/booking/schedule/*
// @match        https://wxsports.ydmap.cn/*
// @match        http://wxsports.ydmap.cn/*
// @match        *://*.ydmap.cn/*
// @icon         ☁️
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/claude89757/TennisCourtMonitorJS/main/tennis-airflow-sync.js
// @downloadURL  https://raw.githubusercontent.com/claude89757/TennisCourtMonitorJS/main/tennis-airflow-sync.js
// @homepageURL  https://github.com/claude89757/TennisCourtMonitorJS
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('%c[AIRFLOW-SYNC] Tennis Court Airflow Sync 已加载', 'background: blue; color: white; font-weight: bold');
    
    // ==================== 配置 ====================
    
    const AIRFLOW_BASE_URL = 'http://zacks.com.cn:8080/airflow/api/v1';
    const SYNC_INTERVAL = 3 * 60 * 1000; // 3分钟
    
    // ==================== 日期标签查找和点击 ====================
    
    /**
     * 查找页面上的所有日期标签
     * @returns {Array} 日期标签信息数组
     */
    function findDateTabs() {
        console.log('%c🔍 [AIRFLOW-SYNC] 开始查找日期标签...', 'background: blue; color: white');
        
        const weekdayTabs = [];
        const processedTexts = new Set();
        const processedElements = new Set();
        
        // 星期匹配模式
        const weekdayPatterns = [
            /星期[一二三四五六日]/,
            /周[一二三四五六日]/,
            /\d{1,2}月\d{1,2}日/,
            /今天|明天|后天/
        ];
        
        // 查找所有可能的元素
        const allElements = document.querySelectorAll(
            'div.week, div.dt, .week, .dt, [class*="week"]:not([class*="weekend"]), ' +
            '[class*="date"], .date-tab, .weekday-tab, .schedule-date'
        );
        
        // 方法1: 查找包含星期和日期的容器元素
        const containerElements = document.querySelectorAll(
            '.inline-flex, [class*="flex"], [class*="tab"], .date-container'
        );
        
        containerElements.forEach(container => {
            const weekElement = container.querySelector('.week, .dt.week, [class*="week"]');
            const dateElement = container.querySelector('.datetime, .dt.datetime, [class*="date"]:not([class*="week"])');
            
            if (weekElement && dateElement) {
                const weekText = (weekElement.textContent || '').trim();
                const dateText = (dateElement.textContent || '').trim();
                const fullText = `${weekText} ${dateText}`;
                
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
                        console.log('%c✓ 找到日期标签: ' + fullText, 'color: cyan');
                    }
                }
            }
        });
        
        // 方法2: 如果没找到容器，尝试单个元素
        if (weekdayTabs.length === 0) {
            allElements.forEach(el => {
                if (processedElements.has(el)) {
                    return;
                }
                
                const text = (el.textContent || '').trim();
                const hasWeekday = weekdayPatterns.some(pattern => pattern.test(text));
                
                if (hasWeekday && !processedTexts.has(text)) {
                    const rect = el.getBoundingClientRect();
                    
                    if (rect.width > 0 && rect.height > 0) {
                        // 检查是否与已有元素重复
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
                                weekday: '',
                                date: text,
                                rect: rect
                            });
                            processedTexts.add(text);
                            processedElements.add(el);
                            console.log('%c✓ 找到日期标签: ' + text, 'color: cyan');
                        }
                    }
                }
            });
        }
        
        // 按位置排序（从左到右，从上到下）
        weekdayTabs.sort((a, b) => {
            if (Math.abs(a.rect.top - b.rect.top) > 10) {
                return a.rect.top - b.rect.top;
            }
            return a.rect.left - b.rect.left;
        });
        
        console.log('%c📅 [AIRFLOW-SYNC] 共找到 ' + weekdayTabs.length + ' 个日期标签', 'background: green; color: white; font-weight: bold');
        
        return weekdayTabs;
    }
    
    // ==================== Vue 数据获取 ====================
    
    // 内部函数：获取 Vue 数据
    function _getVueData() {
        // 方法1: 从全局变量获取
        if (window.__vueInstance__ && window.__vueInstance__.$data) {
            return window.__vueInstance__.$data;
        }

        // 方法2: 从 DOM 查找 Vue 实例
        const vueElement = document.querySelector('[data-v-5b450033]');
        if (vueElement && vueElement.__vue__) {
            window.__vueInstance__ = vueElement.__vue__;
            return vueElement.__vue__.$data;
        }

        // 方法3: 尝试其他常见的 Vue 选择器
        const selectors = [
            '[data-v-5b450033]',
            '.schedule__body-wrapper',
            'table[cellspacing="0"]',
            'td[data-platform-id]'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                let current = el;
                while (current) {
                    if (current.__vue__) {
                        window.__vueInstance__ = current.__vue__;
                        return current.__vue__.$data;
                    }
                    current = current.parentElement;
                }
            }
        }

        return null;
    }
    
    // ==================== 时间段处理工具函数 ====================
    
    /**
     * 解析时间段字符串为分钟数
     * @param {string} timeSlot - 时间段字符串，如 "08:00-10:00"
     * @returns {Object} { start: 480, end: 600 } (以分钟为单位)
     */
    const parseTimeSlot = (timeSlot) => {
        const [startStr, endStr] = timeSlot.split('-');
        const [startHour, startMin] = startStr.split(':').map(Number);
        const [endHour, endMin] = endStr.split(':').map(Number);
        return {
            start: startHour * 60 + startMin,
            end: endHour * 60 + endMin
        };
    };
    
    /**
     * 将分钟数转换回时间段字符串
     * @param {number} start - 开始时间（分钟）
     * @param {number} end - 结束时间（分钟）
     * @returns {string} 时间段字符串，如 "08:00-10:00"
     */
    const minutesToTimeSlot = (start, end) => {
        const startHour = Math.floor(start / 60);
        const startMin = start % 60;
        const endHour = Math.floor(end / 60);
        const endMin = end % 60;
        return `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    };
    
    /**
     * 计算每个场地的可预订时间段
     * @param {Object} availability - 可用时段信息
     * @param {Array} bookings - 已预订信息
     * @param {Array} venues - 场地信息
     * @returns {Array} 可预订时间段数组
     */
    const calculateAvailableSlots = (availability, bookings, venues) => {
        const noBookings = [];
        
        // 获取全天可用时间范围
        const allSlotsData = availability['全部场地'] || [];
        if (allSlotsData.length === 0) {
            console.log('%c⚠️ [AIRFLOW-SYNC] 没有可用时段数据', 'color: orange');
            return noBookings;
        }
        
        // 找到最大的时间范围（合并所有时段）
        let minStart = Infinity;
        let maxEnd = 0;
        const priceMap = {}; // 时段 -> 价格映射
        
        allSlotsData.forEach(slot => {
            const { start, end } = parseTimeSlot(slot.timeSlot);
            minStart = Math.min(minStart, start);
            maxEnd = Math.max(maxEnd, end);
            priceMap[slot.timeSlot] = slot.price;
        });
        
        // 为每个场地计算可预订时段
        venues.forEach(venue => {
            // 创建时间轴（每分钟一个标记）
            const timeline = new Array(maxEnd - minStart).fill(false); // false 表示未预订
            
            // 标记该场地已预订的时段
            bookings.forEach(booking => {
                if (booking.venueId === venue.venueId) {
                    const { start, end } = parseTimeSlot(booking.timeSlot);
                    for (let i = start; i < end; i++) {
                        if (i >= minStart && i < maxEnd) {
                            timeline[i - minStart] = true; // true 表示已预订
                        }
                    }
                }
            });
            
            // 找出连续的未预订时段
            let i = 0;
            while (i < timeline.length) {
                if (!timeline[i]) {
                    // 找到未预订时段的开始
                    const slotStart = minStart + i;
                    let j = i;
                    while (j < timeline.length && !timeline[j]) {
                        j++;
                    }
                    const slotEnd = minStart + j;
                    
                    // 为这个时段匹配价格
                    const timeSlotStr = minutesToTimeSlot(slotStart, slotEnd);
                    let price = '0.00';
                    
                    // 尝试从 priceMap 中查找匹配的价格
                    for (const [priceTimeSlot, priceValue] of Object.entries(priceMap)) {
                        const { start: priceStart, end: priceEnd } = parseTimeSlot(priceTimeSlot);
                        // 如果可预订时段在价格时段范围内，使用该价格
                        if (slotStart >= priceStart && slotEnd <= priceEnd) {
                            price = priceValue;
                            break;
                        }
                    }
                    
                    noBookings.push({
                        venueId: venue.venueId,
                        venueName: venue.venueName,
                        timeSlot: timeSlotStr,
                        price: price
                    });
                    
                    i = j;
                } else {
                    i++;
                }
            }
        });
        
        return noBookings;
    };
    
    // ==================== 随机数据生成 ====================
    
    // 从浏览器标题中提取网球场名称
    const getCourtNameFromTitle = () => {
        // 尝试从 document.title 中提取网球场名称
        const title = document.title;
        console.log('%c[AIRFLOW-SYNC] 浏览器标题:', 'color: cyan', title);
        
        // 常见的标题格式：
        // "场馆名称 - 预订" 或 "预订 - 场馆名称" 或直接是场馆名称
        let courtName = title;
        
        // 移除常见的分隔符和后缀
        courtName = courtName.split('-')[0].trim();
        courtName = courtName.split('|')[0].trim();
        courtName = courtName.split('_')[0].trim();
        courtName = courtName.replace(/预订|订场|booking|schedule/gi, '').trim();
        
        // 如果提取失败或为空，使用默认名称
        if (!courtName || courtName.length === 0) {
            courtName = '未知网球场';
            console.log('%c⚠️ [AIRFLOW-SYNC] 无法从标题提取场馆名称，使用默认名称', 'color: orange');
        } else {
            console.log('%c✅ [AIRFLOW-SYNC] 从标题提取的场馆名称:', 'color: green', courtName);
        }
        
        return courtName;
    };
    
    // 获取真实网球场数据
    const getRealCourtData = () => {
        // 获取 Vue 数据
        const vueData = _getVueData();
        if (!vueData || !vueData.serverData) {
            console.log('%c⚠️ [AIRFLOW-SYNC] 无法获取 Vue 数据，页面可能未加载完成，跳过本次同步', 'background: orange; color: white');
            return null;
        }
        
        const serverData = vueData.serverData;
        console.log('%c✅ [AIRFLOW-SYNC] 成功获取 Vue 数据', 'background: green; color: white');
        
        // 提取基本信息
        const courtName = serverData.salesName || getCourtNameFromTitle();
        const timestamp = new Date().toISOString();
        const dateStr = new Date().toLocaleDateString('zh-CN');
        
        // 状态映射
        const statusMap = {
            2: { status: 'confirmed', statusText: '已预约' },
            88: { status: 'completed', statusText: '已完成' },
            null: { status: 'locked', statusText: '锁定中' }
        };
        
        // 提取场地列表
        const venues = serverData.sportPlatformList || [];
        const venueNameMap = {};
        venues.forEach(venue => {
            venueNameMap[venue.venueId] = venue.venueName;
        });
        
        // 提取订单信息并转换为预订表
        const orders = serverData.orderInfoList || [];
        const bookingTable = orders.map(order => {
            // 时间戳转换（保留原有转换逻辑）
            const startTime = new Date(order.startTime + 1760313600000 - 1356998400000);
            const endTime = new Date(order.endTime + 1760313600000 - 1356998400000);
            
            // 获取状态
            const statusInfo = statusMap[order.dealState] || { status: 'unknown', statusText: '未知' };
            
            // 格式化时间段
            const startHour = startTime.getHours();
            const startMinute = startTime.getMinutes();
            const endHour = endTime.getHours();
            const endMinute = endTime.getMinutes();
            const timeSlot = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
            
            return {
                courtName: courtName,
                venueId: order.venueId,
                venueName: venueNameMap[order.venueId] || `场地${order.venueId}`,
                status: statusInfo.status,
                statusText: statusInfo.statusText,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                timeSlot: timeSlot,
                orderId: order.orderId || `锁定-${order.lockId}`,
                orderType: order.relType === 222 ? '锁定' : '正常订单',
                dealState: order.dealState,
                date: startTime.toLocaleDateString('zh-CN')
            };
        });
        
        // 提取价格信息并生成可用时段表
        const prices = serverData.sportPlatformPriceList || [];
        const availabilityTable = {};
        
        // 按日期和场地组织可用时段
        prices.forEach(price => {
            const startTime = new Date(price.startTime + 1760313600000 - 1356998400000);
            const endTime = new Date(price.endTime + 1760313600000 - 1356998400000);
            
            const month = (startTime.getMonth() + 1).toString().padStart(2, '0');
            const day = startTime.getDate().toString().padStart(2, '0');
            const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            const weekday = weekdays[startTime.getDay()];
            const dateKey = `${month}-${day}(${weekday})`;
            
            if (!availabilityTable[dateKey]) {
                availabilityTable[dateKey] = {};
            }
            
            const startHour = startTime.getHours();
            const startMinute = startTime.getMinutes();
            const endHour = endTime.getHours();
            const endMinute = endTime.getMinutes();
            const timeSlot = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
            
            // 按场地组织（如果有价格ID关联的场地）
            // 这里简化处理，将时段添加到通用列表
            if (!availabilityTable[dateKey]['全部场地']) {
                availabilityTable[dateKey]['全部场地'] = [];
            }
            availabilityTable[dateKey]['全部场地'].push({
                timeSlot: timeSlot,
                price: (price.price / 100).toFixed(2),
                priceId: price.priceId
            });
        });
        
        // 生成场地配置
        const venueConfigInfo = {
            salesName: courtName,
            salesItemName: serverData.salesItemName,
            venues: venues.map(venue => ({
                venueId: venue.venueId,
                venueName: venue.venueName,
                isOpen: venue.platformOpen !== 0,
                onlineBooking: venue.onlineBooking !== 0,
                closeReason: venue.platformCloseAlert || null,
                parentVenueName: venue.parentVenueName || null
            }))
        };
        
        // 完整数据结构
        const formattedData = {
            timestamp: timestamp,
            courtName: courtName,
            date: dateStr,
            
            bookingTable: bookingTable,
            availabilityTable: availabilityTable,
            
            venueConfig: venueConfigInfo,
            
            summary: {
                totalVenues: venues.length,
                totalBookings: bookingTable.length,
                totalDates: Object.keys(availabilityTable).length,
                totalPrices: prices.length,
                lastUpdate: timestamp,
                minBookTime: `${(serverData.singleMinBookTime || 0) / 60000}分钟`,
                maxBookTime: `${(serverData.maxBookTime || 0) / 60000}分钟`,
                delayBookingDay: serverData.delayBookingDay || 0
            },
            
            rawData: {
                venueNameMap: venueNameMap,
                orderListCount: orders.length,
                priceListCount: prices.length,
                configCount: venues.length
            },
            
            testMode: false // 标记为真实数据
        };
        
        console.log('%c✅ [AIRFLOW-SYNC] 真实数据提取完成', 'background: green; color: white; font-weight: bold');
        console.log('  - 场地数量:', venues.length);
        console.log('  - 订单数量:', orders.length);
        console.log('  - 价格数量:', prices.length);
        
        return formattedData;
    };
    
    /**
     * 收集单个日期的数据
     * @param {Object} dateInfo - 日期标签信息
     * @returns {Object|null} 该日期的数据
     */
    const collectDateData = (dateInfo) => {
        // 获取 Vue 数据
        const vueData = _getVueData();
        if (!vueData || !vueData.serverData) {
            console.log('%c⚠️ [AIRFLOW-SYNC] 无法获取 Vue 数据', 'color: orange');
            return null;
        }
        
        const serverData = vueData.serverData;
        const timestamp = new Date().toISOString();
        
        // 提取基本信息
        const courtName = serverData.salesName || getCourtNameFromTitle();
        
        // 状态映射
        const statusMap = {
            2: { status: 'confirmed', statusText: '已预约' },
            88: { status: 'completed', statusText: '已完成' },
            null: { status: 'locked', statusText: '锁定中' }
        };
        
        // 提取场地列表
        const venues = serverData.sportPlatformList || [];
        const venueNameMap = {};
        venues.forEach(venue => {
            venueNameMap[venue.venueId] = venue.venueName;
        });
        
        // 提取订单信息
        const orders = serverData.orderInfoList || [];
        const bookings = orders.map(order => {
            // 时间戳转换
            const startTime = new Date(order.startTime + 1760313600000 - 1356998400000);
            const endTime = new Date(order.endTime + 1760313600000 - 1356998400000);
            
            // 获取状态
            const statusInfo = statusMap[order.dealState] || { status: 'unknown', statusText: '未知' };
            
            // 格式化时间段
            const startHour = startTime.getHours();
            const startMinute = startTime.getMinutes();
            const endHour = endTime.getHours();
            const endMinute = endTime.getMinutes();
            const timeSlot = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
            
            return {
                venueId: order.venueId,
                venueName: venueNameMap[order.venueId] || `场地${order.venueId}`,
                status: statusInfo.status,
                statusText: statusInfo.statusText,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                timeSlot: timeSlot,
                orderId: order.orderId || `锁定-${order.lockId}`,
                orderType: order.relType === 222 ? '锁定' : '正常订单',
                dealState: order.dealState
            };
        });
        
        // 提取价格信息并生成可用时段
        const prices = serverData.sportPlatformPriceList || [];
        const availability = {};
        
        // 按场地组织可用时段
        prices.forEach(price => {
            const startTime = new Date(price.startTime + 1760313600000 - 1356998400000);
            const endTime = new Date(price.endTime + 1760313600000 - 1356998400000);
            
            const startHour = startTime.getHours();
            const startMinute = startTime.getMinutes();
            const endHour = endTime.getHours();
            const endMinute = endTime.getMinutes();
            const timeSlot = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
            
            // 按场地组织
            if (!availability['全部场地']) {
                availability['全部场地'] = [];
            }
            availability['全部场地'].push({
                timeSlot: timeSlot,
                price: (price.price / 100).toFixed(2),
                priceId: price.priceId
            });
        });
        
        console.log(`%c✅ [AIRFLOW-SYNC] 收集到日期 ${dateInfo.text} 的数据: ${bookings.length} 条预订`, 'color: green');
        
        // 删除 bookings 中的 startTime 和 endTime 字段
        const cleanedBookings = bookings.map(booking => {
            const { startTime, endTime, ...rest } = booking;
            return rest;
        });
        
        // 计算可预订时间段
        const venueInfoArray = venues.map(venue => ({
            venueId: venue.venueId,
            venueName: venue.venueName,
            isOpen: venue.platformOpen !== 0
        }));
        
        const noBookings = calculateAvailableSlots(availability, bookings, venueInfoArray);
        
        console.log(`%c📊 [AIRFLOW-SYNC] 计算出 ${noBookings.length} 个可预订时段`, 'color: cyan');
        
        return {
            date: dateInfo.date,
            weekday: dateInfo.weekday,
            fullText: dateInfo.text,
            bookings: cleanedBookings,
            noBookings: noBookings,
            availability: availability,
            timestamp: timestamp,
            venueInfo: venueInfoArray
        };
    };
    
    /**
     * 收集所有日期的数据
     * @returns {Object} 包含所有日期数据的对象
     */
    const collectAllDatesData = async () => {
        console.log('%c🔍 [AIRFLOW-SYNC] 开始收集所有日期数据...', 'background: blue; color: white; font-weight: bold');
        
        // 1. 等待页面加载（确保日期标签可见）
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. 查找所有日期标签
        const dateTabs = findDateTabs();
        
        if (dateTabs.length === 0) {
            console.log('%c⚠️ [AIRFLOW-SYNC] 未找到日期标签，使用当前页面数据', 'background: orange; color: white');
            
            // 如果没有找到标签，尝试获取当前页面数据
            const currentData = getRealCourtData();
            if (currentData) {
                return {
                    courtName: currentData.courtName,
                    dates: [{
                        date: new Date().toLocaleDateString('zh-CN').substring(5).replace('/', '-'),
                        weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][new Date().getDay()],
                        fullText: '当前日期',
                        bookings: currentData.bookingTable || [],
                        availability: currentData.availabilityTable || {},
                        timestamp: currentData.timestamp
                    }],
                    venueConfig: currentData.venueConfig
                };
            }
            return null;
        }
        
        // 3. 获取球场名称
        const courtName = getCourtNameFromTitle();
        
        // 4. 依次点击每个日期并收集数据
        const allDatesData = [];
        const clickedDates = new Set(); // 防止重复点击
        
        for (let i = 0; i < dateTabs.length; i++) {
            const tab = dateTabs[i];
            const dateKey = tab.date || tab.text;
            
            // 跳过已点击的日期
            if (clickedDates.has(dateKey)) {
                console.log(`%c⏭️ [AIRFLOW-SYNC] 跳过重复日期: ${dateKey}`, 'color: gray');
                continue;
            }
            clickedDates.add(dateKey);
            
            try {
                console.log(`%c👆 [AIRFLOW-SYNC] 点击日期标签 ${i + 1}/${dateTabs.length}: ${tab.text}`, 'background: blue; color: white');
                
                // 点击标签
                tab.element.click();
                
                // 等待数据加载（延迟 2.5 秒）
                await new Promise(resolve => setTimeout(resolve, 2500));
                
                // 收集当前日期数据
                const dateData = collectDateData(tab);
                if (dateData) {
                    allDatesData.push(dateData);
                    console.log(`%c✅ [AIRFLOW-SYNC] 成功收集日期 ${tab.text} 的数据`, 'background: green; color: white');
                } else {
                    console.log(`%c⚠️ [AIRFLOW-SYNC] 未能收集日期 ${tab.text} 的数据`, 'background: orange; color: white');
                }
                
                // 标签之间的延迟
                if (i < dateTabs.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (e) {
                console.error(`%c❌ [AIRFLOW-SYNC] 处理日期 ${tab.text} 时出错:`, 'color: red', e);
            }
        }
        
        console.log(`%c🎉 [AIRFLOW-SYNC] 数据收集完成! 共收集 ${allDatesData.length} 个日期`, 'background: green; color: white; font-weight: bold');
        
        // 获取场地配置信息
        const vueData = _getVueData();
        let venueConfig = null;
        if (vueData && vueData.serverData) {
            const serverData = vueData.serverData;
            const venues = serverData.sportPlatformList || [];
            venueConfig = {
                salesName: courtName,
                salesItemName: serverData.salesItemName,
                venues: venues.map(venue => ({
                    venueId: venue.venueId,
                    venueName: venue.venueName,
                    isOpen: venue.platformOpen !== 0,
                    onlineBooking: venue.onlineBooking !== 0,
                    closeReason: venue.platformCloseAlert || null,
                    parentVenueName: venue.parentVenueName || null
                }))
            };
        }
        
        return {
            courtName: courtName,
            dates: allDatesData,
            venueConfig: venueConfig
        };
    };
    
    // ==================== 认证管理 ====================
    
    // 检查并获取认证凭据
    const checkCredentials = () => {
        return new Promise((resolve) => {
            let username = GM_getValue('airflow_username', null);
            let password = GM_getValue('airflow_password', null);
            
            if (!username || !password) {
                // 移除已存在的认证模态框
                const existingModal = document.getElementById('tennis-auth-modal');
                if (existingModal) {
                    existingModal.remove();
                }
                
                // 创建认证模态框
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
                
                // 生成唯一ID
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
                
                // 密码显示/隐藏功能
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
                
                // 保存按钮
                document.getElementById(submitId).onclick = () => {
                    const inputUsername = document.getElementById(usernameId).value;
                    const inputPassword = document.getElementById(passwordId).value;
                    
                    if (inputUsername && inputPassword) {
                        GM_setValue('airflow_username', inputUsername);
                        GM_setValue('airflow_password', inputPassword);
                        modal.remove();
                        console.log('%c✅ [AIRFLOW] 认证凭据已保存', 'background: green; color: white');
                        resolve({ username: inputUsername, password: inputPassword });
                    } else {
                        alert('请输入用户名和密码');
                    }
                };
                
                // 取消按钮
                document.getElementById(cancelId).onclick = () => {
                    modal.remove();
                    console.log('%c❌ [AIRFLOW] 认证已取消', 'background: red; color: white');
                    resolve(null);
                };
                
                // 自动聚焦用户名输入框
                setTimeout(() => {
                    const usernameField = document.getElementById(usernameId);
                    if (usernameField) {
                        usernameField.focus();
                    }
                }, 100);
                
            } else {
                console.log('%c✅ [AIRFLOW] 使用缓存的认证凭据', 'background: green; color: white');
                resolve({ username, password });
            }
        });
    };
    
    // ==================== 数据同步 ====================
    
    // 发送数据到 Airflow
    const sendToAirflow = async () => {
        const credentials = await checkCredentials();
        if (!credentials) {
            console.log('%c⚠️ [AIRFLOW] 未提供认证凭据，跳过同步', 'background: orange; color: white');
            return false;
        }
        
        // 自动点击所有日期标签并收集数据
        console.log('%c🔄 [AIRFLOW-SYNC] 开始收集多日期数据...', 'background: purple; color: white; font-weight: bold');
        const allDatesData = await collectAllDatesData();
        
        if (!allDatesData || !allDatesData.dates || allDatesData.dates.length === 0) {
            console.log('%c⏭️ [AIRFLOW-SYNC] 没有可用数据，跳过本次同步', 'background: orange; color: white');
            return false;
        }
        
        const courtName = allDatesData.courtName;
        
        // 格式化为新的数据结构（数组格式）
        const formattedData = {
            courtName: courtName,
            lastUpdate: new Date().toISOString(),
            summary: {
                totalDates: allDatesData.dates.length,
                totalBookings: allDatesData.dates.reduce((sum, d) => sum + d.bookings.length, 0),
                totalNoBookings: allDatesData.dates.reduce((sum, d) => sum + (d.noBookings ? d.noBookings.length : 0), 0),
                totalVenues: allDatesData.venueConfig ? allDatesData.venueConfig.venues.length : 0,
                dateRange: allDatesData.dates.length > 0 ? {
                    first: allDatesData.dates[0].fullText,
                    last: allDatesData.dates[allDatesData.dates.length - 1].fullText
                } : null
            },
            dates: allDatesData.dates,
            venueConfig: allDatesData.venueConfig,
            testMode: false
        };
        
        // 创建变量键名
        const variableKey = 'tennis_court_' + courtName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').toLowerCase();
        
        const authHeader = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
        const jsonString = JSON.stringify(formattedData);
        const description = `${courtName} booking data (${formattedData.summary.totalDates} dates) updated at ${formattedData.lastUpdate}`;
        
        // 输出数据摘要
        console.log(`%c📊 [AIRFLOW] 准备同步数据到 Airflow`, 'background: purple; color: white; font-weight: bold');
        console.log('网球场名称:', courtName);
        console.log('变量名称:', variableKey);
        console.log('日期数量:', formattedData.summary.totalDates);
        console.log('预订记录总数:', formattedData.summary.totalBookings);
        console.log('可预订时段总数:', formattedData.summary.totalNoBookings);
        console.log('日期范围:', formattedData.summary.dateRange);
        
        // 显示每个日期的数据摘要
        console.log('%c📅 各日期数据明细:', 'background: teal; color: white');
        formattedData.dates.forEach((dateData, index) => {
            console.log(`  ${index + 1}. ${dateData.fullText}: ${dateData.bookings.length} 条预订, ${dateData.noBookings ? dateData.noBookings.length : 0} 个可预订时段`);
        });
        
        return new Promise((resolve) => {
            // 先尝试更新变量
            console.log('%c🔄 [AIRFLOW] 尝试更新变量: ' + variableKey, 'background: blue; color: white');
            
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
                        console.log('%c✅ [AIRFLOW] 变量更新成功', 'background: green; color: white; font-size: 14px; font-weight: bold');
                        // console.log('响应:', response.responseText);
                        showNotification('✅ 数据已成功同步到 Airflow', `变量: ${variableKey}`, 'success');
                        resolve(true);
                        
                    } else if (response.status === 404) {
                        // 变量不存在，创建新变量
                        console.log('%c📝 [AIRFLOW] 变量不存在，创建新变量: ' + variableKey, 'background: orange; color: white');
                        
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
                                    console.log('%c✅ [AIRFLOW] 变量创建成功', 'background: green; color: white; font-size: 14px; font-weight: bold');
                                    console.log('响应:', createResponse.responseText);
                                    showNotification('✅ 数据已成功创建并同步到 Airflow', `变量: ${variableKey}`, 'success');
                                    resolve(true);
                                } else {
                                    console.log('%c❌ [AIRFLOW] 变量创建失败', 'background: red; color: white');
                                    console.log('状态:', createResponse.status);
                                    console.log('响应:', createResponse.responseText);
                                    
                                    if (createResponse.status === 401 || createResponse.status === 403) {
                                        console.log('%c🔒 [AIRFLOW] 认证失败，清除已保存的凭据', 'background: red; color: white');
                                        GM_setValue('airflow_username', null);
                                        GM_setValue('airflow_password', null);
                                        alert('Airflow API 认证失败，请重新输入账号密码');
                                    }
                                    resolve(false);
                                }
                            },
                            onerror: function(error) {
                                console.log('%c❌ [AIRFLOW] 网络错误（创建变量）', 'background: red; color: white');
                                console.error(error);
                                resolve(false);
                            }
                        });
                        
                    } else {
                        console.log('%c❌ [AIRFLOW] 变量更新失败', 'background: red; color: white');
                        console.log('状态:', response.status);
                        console.log('响应:', response.responseText);
                        
                        if (response.status === 401 || response.status === 403) {
                            console.log('%c🔒 [AIRFLOW] 认证失败，清除已保存的凭据', 'background: red; color: white');
                            GM_setValue('airflow_username', null);
                            GM_setValue('airflow_password', null);
                            alert('Airflow API 认证失败，请重新输入账号密码');
                        }
                        resolve(false);
                    }
                },
                onerror: function(error) {
                    console.log('%c❌ [AIRFLOW] 网络错误（更新变量）', 'background: red; color: white');
                    console.error(error);
                    resolve(false);
                }
            });
        });
    };
    
    // 显示通知
    const showNotification = (title, message, type = 'info') => {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, #ff9800, #f57c00)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 999999;
            font-weight: bold;
            animation: slideIn 0.5s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        notification.innerHTML = `${title}<br><small>${message}</small>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    };
    
    // ==================== UI ====================
    
    // 等待页面加载完成后添加UI
    const initUI = () => {
        // 添加浮动同步按钮
        const syncButton = document.createElement('div');
        syncButton.id = 'tennis-airflow-sync-btn';
        syncButton.innerHTML = '☁️';
        syncButton.title = '点击立即同步到 Airflow';
        syncButton.style.cssText = `
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
        
        syncButton.onclick = async () => {
            console.log('%c☁️ [MANUAL] 手动触发同步...', 'background: blue; color: white; font-weight: bold');
            syncButton.style.animation = 'spin 1s linear infinite';
            const success = await sendToAirflow();
            if (success) {
                updateLastSyncTime();
            }
            syncButton.style.animation = 'pulse 2s infinite';
        };
        
        document.body.appendChild(syncButton);
        
        // 添加状态显示
        const statusDisplay = document.createElement('div');
        statusDisplay.id = 'tennis-airflow-status';
        statusDisplay.style.cssText = `
            position: fixed;
            bottom: 160px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-family: monospace;
            font-size: 12px;
            z-index: 999998;
            min-width: 150px;
            text-align: center;
        `;
        statusDisplay.innerHTML = '☁️ 等待同步...';
        statusDisplay.title = '右键点击暂停/继续自动同步';
        
        document.body.appendChild(statusDisplay);
        
        console.log('[AIRFLOW-SYNC] UI 组件已添加');
    };
    
    // 更新最后同步时间
    const updateLastSyncTime = () => {
        const lastSyncTime = new Date().toLocaleTimeString('zh-CN');
        GM_setValue('last_sync_time', lastSyncTime);
        
        const statusDisplay = document.getElementById('tennis-airflow-status');
        if (statusDisplay) {
            statusDisplay.innerHTML = `☁️ 上次: ${lastSyncTime}`;
        }
    };
    
    // 更新倒计时显示
    let countdown = SYNC_INTERVAL / 1000;
    const updateCountdown = () => {
        const statusDisplay = document.getElementById('tennis-airflow-status');
        if (statusDisplay && !isPaused) {
            const minutes = Math.floor(countdown / 60);
            const seconds = countdown % 60;
            statusDisplay.innerHTML = `☁️ 下次同步: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        countdown--;
        if (countdown < 0) {
            countdown = SYNC_INTERVAL / 1000;
        }
    };
    
    // ==================== 定时同步 ====================
    
    let syncInterval = null;
    let countdownInterval = null;
    let isPaused = false;
    
    // 启动定时同步
    const startAutoSync = () => {
        console.log(`%c🚀 [AIRFLOW-SYNC] 启动自动同步，间隔: ${SYNC_INTERVAL / 1000 / 60} 分钟`, 'background: green; color: white; font-weight: bold');
        
        // 首次立即同步
        setTimeout(async () => {
            const success = await sendToAirflow();
            if (success) {
                updateLastSyncTime();
            }
        }, 3000);
        
        // 设置定时同步
        syncInterval = setInterval(async () => {
            if (!isPaused) {
                console.log('%c⏰ [AIRFLOW-SYNC] 定时同步触发', 'background: blue; color: white');
                const success = await sendToAirflow();
                if (success) {
                    updateLastSyncTime();
                    countdown = SYNC_INTERVAL / 1000; // 重置倒计时
                }
            }
        }, SYNC_INTERVAL);
        
        // 设置倒计时更新
        countdownInterval = setInterval(updateCountdown, 1000);
    };
    
    // 暂停/继续功能
    const setupPauseControl = () => {
        const statusDisplay = document.getElementById('tennis-airflow-status');
        if (statusDisplay) {
            statusDisplay.oncontextmenu = (e) => {
                e.preventDefault();
                isPaused = !isPaused;
                
                if (isPaused) {
                    statusDisplay.style.background = 'rgba(255, 165, 0, 0.8)';
                    statusDisplay.innerHTML = '⏸️ 已暂停';
                    console.log('%c⏸️ [AIRFLOW-SYNC] 自动同步已暂停', 'background: orange; color: white');
                } else {
                    statusDisplay.style.background = 'rgba(0, 0, 0, 0.8)';
                    countdown = SYNC_INTERVAL / 1000;
                    console.log('%c▶️ [AIRFLOW-SYNC] 自动同步已继续', 'background: green; color: white');
                }
            };
        }
    };
    
    // ==================== 样式 ====================
    
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
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `);
    
    // ==================== 初始化 ====================
    
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                initUI();
                setupPauseControl();
                startAutoSync();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            initUI();
            setupPauseControl();
            startAutoSync();
        }, 1000);
    }
    
    console.log('%c[AIRFLOW-SYNC] 初始化完成', 'background: green; color: white; font-weight: bold');
    
})();

