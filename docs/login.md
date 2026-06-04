# 登录与权限

<span class="quick-path">入口：/dev-login 或 X 登录回调后进入首页</span>

<div class="guide-shot">

<img :src="'/ai-chain-dashboard-guides/screenshots/login.png'" alt="登录成功后进入的产品界面。截图不会包含真实 Agent token。">

<p class="guide-caption">登录成功后进入的产品界面。截图不会包含真实 Agent token。</p>

</div>

## 用途

登录用于把你的自选树、文章、数据视图、订阅组合和告警配置隔离到个人账户下。普通用户通过 X OAuth 登录；内部自动化验收可使用受保护的 Agent 登录入口。

## 常用操作

- 登录完成后，页面右下角会显示当前用户标识。
- 如果登录态失效，页面会回到登录卡片，并提示重新登录。
- 会员相关功能包括个人组合树、公开组合订阅、告警订阅、AI 研报任务和通知配置。

## 注意事项

- 不要把 Agent 登录 token 写入文档、截图说明或公开仓库。
- 若无法进入页面，优先确认后端是否可访问、会员状态是否有效、浏览器是否保存了旧 token。
