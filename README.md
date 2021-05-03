基于 [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 主题定制化的个人博客，[点击此处进入](https://nihil.cc/)。

[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)

与原版 Chirpy 不同的点：

* 汉化了大部分英文。
* 使用并入了 [#357](https://github.com/xCss/Valine/pull/357) 的 [Valine 评论系统](https://valine.js.org/)替换 Disqus，参见 `_config.yml` 里的 `valine`。
* 使用[知乎式 404 界面](https://404.life/zhihu-404-template.html)，可以返回首页或者返回上一页。
* 新增了分享到 Line，QQ，QQ 空间，贴吧和微博，参见 `_data/share.yml`。
* 使用 [iconfont](https://www.iconfont.cn/) 取代 [Font Awesome](https://fontawesome.com/)，有更多的图标选择空间，参见 `_config.yml` 里的 `iconfont_css`。
* 右侧边栏添加了外部链接块，参见 `_data/external_links.yml`。
* 可以自由地控制在帖子中显示右侧边栏哪些块。参见 `_config.yml` 里的 `panel`。
* 添加滚动条样式以适应主题，而不是将其隐藏。
* 添加了子域页。参见 `_data/subdomain.yml`。
* 添加了 `<details>` 标签的样式。
* 使用改自 [`just the docs`](https://github.com/pmarsceill/just-the-docs) 的表格样式。
* 优化了代码段 scss，使其能够适应表格内嵌代码段。

如果喜欢我这个定制化的版本，欢迎 Fork，但是请修改 `_config.yml` 中的 `google_site_verification`, `google_analytics` 的 `id` 以及 `valine` 的 `leancloud_appid` 和 `leancloud_appkey`，以及 `CNAME` 文件中配置的域名，请勿使用我的配置。

通常，每周会至少 merge 一次 [`upstream/master`](https://github.com/cotes2020/jekyll-theme-chirpy) 以追踪新的功能。
