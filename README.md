<p align="center">
  <img src="wloc.jpg" width="144" />
</p>

# Apple WLOC 定位修改

修改 Apple 网络定位服务 (WiFi/基站) 返回的坐标，实现 iOS 网络定位虚拟定位。打开在线选点页面选位置即可生效，无需手动填经纬度。

---

## 订阅地址

**Surge:**
https://raw.githubusercontent.com/Yu9191/wloc/refs/heads/main/modules/wloc.sgmodule

**Quantumult X:**
https://raw.githubusercontent.com/Yu9191/wloc/refs/heads/main/modules/wloc.conf

**Loon:**
https://raw.githubusercontent.com/Yu9191/wloc/refs/heads/main/modules/wloc.lpx

> Egern 可直接使用 Surge 模块

---

<details>
<summary><b>使用方法</b></summary>

1. 订阅模块并启用 MITM
2. 打开在线选点页面（公共 Worker，建议添加到主屏幕）
3. 地图选位置 / 搜索地名 / 粘贴地图链接
4. 点击「储存到设备」
5. 下次 Apple 定位触发时自动生效

支持 Apple Maps / Google Maps / 高德 / 百度 / 坐标文本 链接解析。

> **iOS 26/27 及更高版本注意：** Apple 从 iOS 26 开始大幅强化了 `locationd` 的定位缓存机制，系统会将之前获取的真实定位结果缓存在内存中并长时间复用。这意味着安装模块或切换目标坐标后，即使脚本已成功修改了 WLOC 响应（日志显示"已修改"），系统仍可能继续使用缓存中的旧坐标，导致定位看起来没有变化。
>
> **解决方法：重启设备。** 重启会清空 `locationd` 的内存缓存，系统重新发起 WLOC 请求时会拿到修改后的坐标。飞行模式开关、关闭定位服务等方式在 iOS 26+ 上**无法**清除此缓存，必须重启。iOS 15~18 通常不需要重启即可生效。

**高版本系统推荐操作流程（成功率最高）：**

方法一：
1. 先在选点页面选好需要修改的定位并储存到设备
2. 开飞行模式 → 关闭定位服务 → 重启设备
3. 关闭飞行模式（WiFi 也要关）→ 连接代理工具（确认 VPN 图标出现）→ 打开定位服务
4. 打开地图验证

方法二：
1. 关闭定位服务
2. 在选点页面选好位置并储存到设备
3. 打开定位服务 → 弹出「允许访问位置信息」时选择**「下次询问或在我共享时」**
4. 打开地图验证

</details>

<details>
<summary><b>工作原理</b></summary>

```
选点页面 → fetch gs-loc.apple.com/wloc-settings/save?lon=x&lat=y
         → 代理模块拦截 → wloc-settings.js 写入 $persistentStore
         → 下次 WLOC 触发 → wloc.js 读取坐标 → patch protobuf 响应
```

模块包含两条规则：
- `wloc.js` — 拦截 `/clls/wloc` 响应，解析 protobuf 并替换坐标
- `wloc-settings.js` — 拦截 `/wloc-settings/save` 请求，写入持久化存储

</details>

<details>
<summary><b>参数配置</b></summary>

| 参数 | 说明 | 默认值 |
|------|------|--------|
| longitude | 目标经度(在线选点优先) | 113.94114 |
| latitude | 目标纬度(在线选点优先) | 22.544577 |
| accuracy | 精度(米) | 25 |
| logLevel | 日志级别 | info |

优先级: 在线选点储存 > 模块参数 > 默认值

</details>

<details>
<summary><b>取消虚拟定位 / 恢复真实定位</b></summary>

**方法一：关闭或删除模块**（推荐）

关闭模块后脚本不再拦截 WLOC 请求，系统自动恢复真实定位。iOS 26+ 需要重启设备清除定位缓存。

**方法二：仅清除已保存的坐标**

如果想保留模块但清除在线选点写入的坐标（回退到模块参数或默认值），需要在代理工具中删除持久化数据，字段名为 `wloc_settings`：

- **Surge** — 脚本编辑器运行: `$persistentStore.write(null, "wloc_settings")`
- **Quantumult X** — 运行: `$prefs.removeValueForKey("wloc_settings")`
- **Loon** — 运行: `$persistentStore.write(null, "wloc_settings")`

清除后重启设备即可生效。

</details>

<details>
<summary><b>收藏位置功能</b></summary>

在线选点页面支持收藏多个位置，方便来回切换：

- **添加收藏**：选好位置后点击「收藏位置」→ 输入备注名称（支持中文/英文/数字，最多 30 字）→ 保存
- **快速切换**：点击收藏列表中的位置 → 地图自动跳转 → 点「储存到设备」即可切换
- **当前生效标记**：与设备已保存坐标一致的收藏会显示「✓ 当前生效」
- **删除管理**：单个删除（×按钮）或清空全部
- **当前生效坐标**：页面显示设备端持久化数据（wloc_settings），支持刷新查询和清除

**数据存储说明：**
- **收藏列表** → 保存在浏览器 `localStorage`（仅用于选点页面的 UI 便捷操作）
- **生效坐标** → 保存在代理工具持久化存储 `$persistentStore`（脚本运行时实际读取的数据）

两者独立存储。收藏列表是浏览器端的辅助数据，清除浏览器缓存或换浏览器后需重新收藏，但不影响已储存到设备的生效坐标。

</details>

<details>
<summary><b>自部署 Worker（推荐）</b></summary>

公共选点页面有请求上限，建议部署自己的实例：

- **Workers**: `https://wloc-spoofer.wloc.workers.dev/`
- **Pages**: `https://wloc-pages.pages.dev/`

**一键部署（Workers）：**

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Yu9191/wloc/tree/main/worker)

> 一键部署仅支持 Workers 模式，点击按钮后按提示授权即可完成部署。

**手动部署（Workers）：**

```bash
# 1. 克隆仓库
git clone https://github.com/Yu9191/wloc.git
cd wloc/worker

# 2. 安装依赖
npm install

# 3. 登录 Cloudflare（首次需要）
npx wrangler login

# 4. 部署
npm run deploy
```

部署成功后会得到你自己的 Worker 地址（如 `https://wloc-spoofer.<你的子域名>.workers.dev`），用这个地址选点即可。

> 免费账户每天 10 万次请求，个人使用完全够用。

<details>
<summary>高级：Pages 部署</summary>

Pages 部署不支持一键按钮，需要手动执行：

```bash
git clone https://github.com/Yu9191/wloc.git
cd wloc/worker
npm install
npx wrangler pages deploy dist --project-name <自定义项目名>
```

部署时会提示设置 production branch，输入 `main` 即可。部署成功后得到 `https://<项目名>.pages.dev` 地址。

Pages 和 Workers 功能完全一致，按需选择即可。

</details>

</details>

<details>
<summary><b>注意事项</b></summary>

- 需要 MITM 证书信任 `gs-loc.apple.com` 和 `gs-loc-cn.apple.com`
- 仅修改网络定位(WiFi/基站)，不影响 GPS 硬件定位
- iOS 在 GPS 信号强时可能忽略网络定位结果
- 适用于 WiFi 定位为主的室内场景效果最佳
- 选点页面需在代理模式下使用（Safari 走代理才能拦截储存请求）

</details>

---

## 致谢

- [proxypin-wloc-spoofer](https://github.com/FFF686868/proxypin-wloc-spoofer) - 原始 WLOC 定位修改思路 by FFF686868
- [NSNanoCat/Util](https://github.com/NSRingo/NanoKitFramework) - 跨平台脚本工具框架
