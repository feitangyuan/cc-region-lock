# cc-region-lock

`cc-region-lock` 不是给普通用户自己一点点手配的脚本，而是一个面向 `Codex / Claude Code` 的本机地区锁定仓库。

核心目标只有一件事：

- 根据当前代理出口地区，统一本机时区、终端代理环境和一致性检查能力

## 背景

这次 `Claude Code` 相关代码泄露之后，社区里出现了不少围绕请求重写、遥测改写、身份统一的项目，`cc-gateway` 就是其中比较有代表性的一个。

这类方案有价值，但很多实现依赖客户端内部字段、请求结构、prompt 模板或 telemetry 路径。官方一旦补洞、改字段、换策略，维护成本会迅速上升。

`cc-region-lock` 走的是更底层的路线：

- 不改 Claude 内部请求结构
- 不依赖泄露代码里的具体字段名
- 先统一更持久的外层事实

也就是：

- 当前代理出口 `IP / 国家 / 时区 / ASN`
- macOS 系统时区
- 终端默认代理环境
- 一致性检查与健康检查入口

## 适用方式

推荐用法不是“用户手动照 README 一条条执行”，而是：

1. 把这个仓库丢给 `Codex` 或 `Claude Code`
2. 让 agent 在本机执行安装与锁定
3. 需要 `sudo`、修改 `~/.zshrc`、安装检查命令时，直接授权

也就是说，这个仓库本质上是一个可执行的地区锁定 playbook。

## 当前会做什么

默认执行 `cc-region-lock` 时会完成这几个动作：

1. 检测当前出口：
   - `ip`
   - `country`
   - `timezone`
   - `org / ASN`
2. 根据出口国家选择内置画像
3. 同步 macOS 系统时区
4. 往 `~/.zshrc` 写入终端代理环境：
   - `HTTP_PROXY`
   - `HTTPS_PROXY`
   - `ALL_PROXY`
   - `NO_PROXY`
5. 安装本地检查命令：
   - `cc-region-check`
   - `cc-egress-check`
   - `cc-region-health`
   - `cc-region-proxy`
6. 输出最终状态，确认出口和本机时区是否一致

## 当前不会做什么

默认不会修改：

- `AppleLocale`
- `AppleLanguages`
- Chrome `Accept-Language`

原因很简单：这些设置会直接改变用户的语言和地区体验，默认强改副作用太大。

## 当前支持

- `SG`
- `JP`

后续可以继续补更多国家画像。

## 安装

如果你就是要一行安装：

```bash
curl -fsSL https://raw.githubusercontent.com/feitangyuan/cc-region-lock/main/install.sh | zsh
```

安装完成后可以直接执行：

```bash
cc-region-lock
```

如果你是把仓库直接交给 `Codex / Claude Code`，也可以让 agent 在仓库目录里直接：

```bash
./install.sh
cc-region-lock
```

## 命令

主命令：

```bash
cc-region-lock
```

只检查，不写入：

```bash
cc-region-lock --check
```

检查当前出口：

```bash
cc-egress-check
```

检查本机时区：

```bash
cc-region-check
```

检查整体健康状态：

```bash
cc-region-health
```

让单个命令显式走代理环境：

```bash
cc-region-proxy <command> [args...]
```

## 为什么它仍然有价值

和 `cc-gateway` 这类更靠近客户端内部实现的方案相比，`cc-region-lock` 更偏“基础设施层”：

- 更少依赖 Claude 当前内部细节
- 更少受到字段改名、上报路径变化的影响
- 主要维护成本来自本地代理端口、shell 配置和国家画像，而不是官方客户端升级

换句话说，它不是追着 Claude 当前实现打补丁，而是先把出口、时区和终端环境这几层更稳定的事实统一好。

## 验证

```bash
npm test
npm run check
```
