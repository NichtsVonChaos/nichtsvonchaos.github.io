---
title: 使用 Valine 替换 Chirpy 主题中的 Disqus 评论系统
date: 2021-3-21 00:21:08 +0800
categories: [Miscellanea, Site]
tags: [jekyll, site, valine]     # TAG names should always be lowercase
---

## 前置工作

根据 [Valine 官方教程](https://valine.js.org/quickstart.html)注册 LeanCloud 以获取 APP ID 和 APP Key。

如果是 fork 主题搭建博客，修改对应文件即可。如果是使用 theme 或者 remote_theme，则需要下载对应的文件放在相应目录后再修改。

## 配置 `_config.yml`

找到 disqus 数据段并删除：

```yml
disqus:
  comments: false
  shortname: ''
```

增加 valine 的数据段：

```yml
valine:
  comments: true            # 是否启用valine 
  leancloud_appid:          # 填入你的APP ID 
  leancloud_appkey:         # 填入你的APP Key 
  placeholder: Go go go!    # 空白评论栏的占位符 
  avatar: mp                # 默认头像，参考 https://valine.js.org/avatar.html 
```

## 配置 `valine.html`

在 `_includes` 目录下创建 `valine.html` 填入以下内容，可删除 `_includes/disqus.html`。

{% raw %}
```html
<div id="vcomments"></div>
<script>
    new Valine({
        el: '#vcomments',
        appId: '{{ site.valine.leancloud_appid }}',
        appKey: '{{ site.valine.leancloud_appkey }}',
        placeholder:'{{ site.valine.placeholder }}',
        avatar: '{{ site.valine.avatar }}',
        enableQQ: true    // 当在昵称栏填入QQ号时自动获取QQ昵称和QQ头像，不需要该功能请删除。
    });
</script>
```
{% endraw %}

更多参数配置可以参考 [Valine官方文档](https://valine.js.org/configuration.html)。

## 配置 `head.html`

{% raw %}
打开 `_includes/head.html`，在 `{% seo title=false %}` 这一行**前面**，插入下面的代码：
{% endraw %}

{% raw %}
```html
{% if page.layout == 'post' %}
  {% if site.valine.comments and page.comments %}
    <script src="//unpkg.com/valine/dist/Valine.min.js"></script>
  {% endif %}
{% endif %}
```
{% endraw %}

## 修改 layout

打开 `_layouts/page.html`，找到 disqus 的相关行：

{% raw %}
```html
{% if site.disqus.comments and page.comments %}
<div class="row">
  <div class="col-12 col-lg-11 col-xl-8">
    <div class="pl-1 pr-1 pl-sm-2 pr-sm-2 pl-md-4 pr-md-4">

    {% include disqus.html %}

    </div> <!-- .pl-1 pr-1 -->
  </div> <!-- .col-12 -->
</div> <!-- .row -->
{% endif %}
```
{% endraw %}

将其修改为：

{% raw %}
```html
{% if site.valine.comments and page.comments %}
<div class="row">
  <div class="col-12 col-lg-11 col-xl-8">
    <div class="pl-1 pr-1 pl-sm-2 pr-sm-2 pl-md-4 pr-md-4">

      {% include valine.html %}

    </div> <!-- .pl-1 pr-1 -->
  </div> <!-- .col-12 -->
</div> <!-- .row -->
{% endif %}
```
{% endraw %}

打开 `_layouts/post.html`，找到 disqus 的相关行：

{% raw %}
```html
<div class="row">
  <div class="col-12 col-lg-11 col-xl-8">
    <div id="post-extend-wrapper" class="pl-1 pr-1 pl-sm-2 pr-sm-2 pl-md-4 pr-md-4">

    {% include related-posts.html %}

    {% include post-nav.html %}

    {% if site.disqus.comments and page.comments %}
      {% include disqus.html %}
    {% endif %}

    </div> <!-- #post-extend-wrapper -->

  </div> <!-- .col-* -->

</div> <!-- .row -->
```
{% endraw %}

将其修改为：

{% raw %}
```html
<div class="row">
  <div class="col-12 col-lg-11 col-xl-8">
    <div id="post-extend-wrapper" class="pl-1 pr-1 pl-sm-2 pr-sm-2 pl-md-4 pr-md-4">

    {% include related-posts.html %}

    {% include post-nav.html %}

    {% if site.valine.comments and page.comments %}
      {% include valine.html %}
    {% endif %}

    </div> <!-- #post-extend-wrapper -->

  </div> <!-- .col-* -->

</div> <!-- .row -->
```
{% endraw %}

## 移除脱机服务

如果你此时部署到服务端，会发现虽然 Valine 评论系统显示在帖子的底部，但是本机发表的评论无法在其他设备看到，同样其他设备发表的评论无法在本机看到。

同时，打开控制台，可以看到浏览器报错：

```js
Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Request method 'POST' is unsupported
    at sw.js:1
```

这是因为 Valine 评论系统和脱机服务冲突了。由于本人才学疏浅，没有什么好的解决方案，因此选择移除脱机服务系统。

首先删除 `sw.js`, `app.js`, `assets/js/data/cache-list.js` 文件。

然后，打开`_includes/js-selector.html`文件，找到并删除

{% raw %}
```html
<script defer src="{{ '/app.js' | relative_url }}"></script>
```
{% endraw %}

## 大功告成

快使用 `bundle exec jekyll serve` 来测试你的 Valine 评论系统吧！

想要管理评论，可以进入 [LeanCloud](https://console.leancloud.cn/apps) 应用控制台，打开存储→结构化数据→Comment。
