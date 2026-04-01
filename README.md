# cc-region-lock

`cc-region-lock` 是一个面向中文用户的 `macOS + Chrome` 小工具：自动根据当前代理出口地区，同步锁定系统时区、地区设置和浏览器语言。

## 背景

这次 `Claude Code` 相关代码泄露之后，社区里出现了不少围绕请求重写、遥测改写、身份统一的项目，`cc-gateway` 就是其中比较有代表性的一个。

这类项目的价值很明显，但也有一个共同问题：很多实现依赖当前版本的客户端内部字段、请求结构、prompt 模板或 telemetry 路径。一旦官方补洞、改字段、换策略，这类“跟着内部实现打补丁”的方案维护成本会明显上升。

`cc-region-lock` 走的是另一条更偏底层的路线：

- 不改 Claude 内部请求结构
- 不依赖泄露代码里的具体字段名
- 直接统一更底层、更持久的系统画像

也就是优先把这些基础环境对齐到当前出口地区：

- 系统时区
- 系统地区 / 语言
- Chrome `Accept-Language`

这类设置就算以后 `Claude` 自己改策略、改字段、补内部实现，也依然成立，因为服务看到的基础环境本来就是第一层事实。

## 适用范围

- 只支持 `macOS`
- 只支持 `Google Chrome`
- 不依赖额外 npm 第三方包

## 当前能力

`cc-region-lock` 会根据当前出口国家，自动选择内置画像并应用到本机：

- 通过 `ipinfo.io` 探测当前出口地区
- 根据国家匹配对应画像
- 优雅退出 Chrome
- 修改 macOS 时区
- 修改 `AppleLocale`
- 修改 `AppleLanguages`
- 修改 Chrome `intl.accept_languages`

如果修改时区需要管理员权限，系统会要求输入 `sudo` 密码。

## 目前支持

- 新加坡 `SG`
- 日本 `JP`

后续可以继续补更多国家画像。

## 安装

不需要先下载仓库，直接一行命令安装：

```bash
curl -fsSL https://raw.githubusercontent.com/feitangyuan/cc-region-lock/main/install.sh | zsh
```

安装完成后，后续直接使用 `cc-region-lock` 即可。

如果你已经 clone 了仓库，也可以本地执行：

```bash
./install.sh
```

## 使用方式

先检查当前探测结果：

```bash
cc-region-lock --check
```

只看将要应用什么，不真正写入：

```bash
cc-region-lock --dry-run
```

直接应用：

```bash
cc-region-lock
```

## 为什么说它更“持久”

和 `cc-gateway` 这类更靠近客户端内部实现的方案相比，`cc-region-lock` 更偏“基础设施层”：

- 更少依赖 Claude 当前内部细节
- 更少受到字段改名、上报路径变化的影响
- 主要维护成本来自你自己的本地环境变化，而不是官方客户端升级

换句话说，它不是试图“追着 Claude 当前实现补丁”，而是先把更基础、更稳定的地区画像统一好。

## 验证

```bash
npm test
npm run check
```
