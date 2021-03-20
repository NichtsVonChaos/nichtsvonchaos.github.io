---
title: 使用Valine替换Chirpy主题中的Disqus评论系统
date: 2021-3-21 00:21:08 +0800
categories: [Miscellanea, Site]
tags: [jekyll, site, valine]     # TAG names should always be lowercase
---

## 前置工作

根据[Valine 官方教程](https://valine.js.org/quickstart.html)注册LeanCloud以获取APP ID和APP Key。

如果是fork主题搭建博客，修改对应文件即可。如果是使用theme或者remote_theme，则需要下载对应的文件放在相应目录后再修改。

## 配置`_config.yml`

找到disqus数据段并删除：

```yml
disqus:
  comments: false
  shortname: ''
```

增加valine的数据段：

```yml
valine:
  comments: true            # 是否启用valine 
  leancloud_appid:          # 填入你的APP ID 
  leancloud_appkey:         # 填入你的APP Key 
  placeholder: Go go go!    # 空白评论栏的占位符 
  avatar: mp                # 默认头像，参考 https://valine.js.org/avatar.html 
```

## 配置`valine.html`

在`_includes`目录下创建`valine.html`填入以下内容，可删除`_includes/disqus.html`。

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

更多参数配置可以参考[Valine官方文档](https://valine.js.org/configuration.html)。

## 配置`head.html`

打开`_includes/head.html`，在`{% seo title=false %}`这一行**前面**，插入下面的代码：

```html
{% if page.layout == 'post' %}
  {% if site.valine.comments and page.comments %}
    <script src="//unpkg.com/valine/dist/Valine.min.js"></script>
  {% endif %}
{% endif %}
```

## 修改layout

打开`_layouts/page.html`，找到disqus的相关行：

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

将其修改为：

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

打开`_layouts/post.html`，找到disqus的相关行：

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

将其修改为：

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

## 大功告成

快使用`bundle exec jekyll serve`来测试你的Valine评论系统吧！

想要管理评论，可以进入[LeanCloud](https://console.leancloud.cn/apps)应用控制台，打开存储→结构化数据→Comment。
