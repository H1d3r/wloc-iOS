/**
 * WLOC 设置写入脚本 (http-request / script-echo-response)
 * 拦截 gs-loc.apple.com/wloc-settings/save 请求
 * 
 * 支持三种操作 (通过 action 参数区分):
 *   ?lon=x&lat=y&acc=z  — 写入坐标 (默认)
 *   ?action=query        — 查询当前已保存的坐标
 *   ?action=clear        — 清除已保存的坐标
 */
import { $app, Console, done, Storage } from "@nsnanocat/util";
import { BOXJS_KEY } from "./config/index.mjs";

const url = $request.url || "";
let params;
try {
	params = new URL(url).searchParams;
} catch {
	params = new URLSearchParams(url.split("?")[1] || "");
}
const action = params.get("action") || "save";
Console.debug(`[wloc-settings] url=${url}, action=${action}`);

let result;

if (action === "query") {
	try {
		const stored = Storage.getItem(BOXJS_KEY);
		if (stored && typeof stored === "object" && stored.longitude && stored.latitude) {
			result = { success: true, longitude: stored.longitude, latitude: stored.latitude, accuracy: stored.accuracy || 25, updatedAt: stored.updatedAt || null };
			Console.debug(`[wloc-settings] 查询: ${stored.longitude}, ${stored.latitude}`);
		} else {
			result = { success: false, error: "无已保存的坐标" };
		}
	} catch (e) {
		result = { success: false, error: e.message || "读取失败" };
	}
} else if (action === "clear") {
	try {
		Storage.setItem(BOXJS_KEY, null);
		result = { success: true };
		Console.info("[wloc-settings] 已清除坐标数据");
	} catch (e) {
		result = { success: false, error: e.message || "清除失败" };
		Console.error(`[wloc-settings] 清除失败: ${e.message}`);
	}
} else {
	const longitude = parseFloat(params.get("lon") || params.get("longitude") || "0");
	const latitude = parseFloat(params.get("lat") || params.get("latitude") || "0");
	const accuracy = parseInt(params.get("acc") || params.get("accuracy") || "25", 10);

	if (!longitude || !latitude) {
		result = { success: false, error: "缺少 lon/lat 参数" };
	} else {
		const data = { longitude, latitude, accuracy, updatedAt: new Date().toISOString() };
		try {
			const ok = Storage.setItem(BOXJS_KEY, data);
			if (ok) {
				result = { success: true, longitude, latitude, accuracy };
				Console.info(`[wloc-settings] 已保存: ${longitude}, ${latitude}`);
			} else {
				result = { success: false, error: "Storage.setItem 返回 false" };
				Console.error("[wloc-settings] setItem 返回 false");
			}
		} catch (e) {
			result = { success: false, error: e.message || "写入失败" };
			Console.error(`[wloc-settings] ${e.message}`);
		}
	}
}

const response = {
	status: 200,
	headers: {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, OPTIONS",
	},
	body: JSON.stringify(result),
};

// QX script-echo-response 需要直接传 {status, headers, body}
// Surge/Loon http-request 需要 {response: {status, headers, body}}
if ($app === "Quantumult X") {
	done(response);
} else {
	done({ response });
}
