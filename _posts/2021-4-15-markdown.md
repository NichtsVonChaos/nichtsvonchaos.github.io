---
title: Markdown 一些奇技淫巧
date: 2021-4-15 22:00:31 +0800
categories: [教程, Markdown]
tags: [markdown, 教程]     # TAG names should always be lowercase
---

## 列表内分段

举个例子，假如我们想要在列表中换行，最简单的办法就是双空格法：

````markdown
* 第一项第一行  <!-- 注意这里有两个空格 -->
第一项第二行
* 第二项第一行  <!-- 注意这里有两个空格 -->
```
一段代码
```  <!-- 注意这里有两个空格 -->
第二项第二行
````

效果：

* 第一项第一行  
第一项第二行
* 第二项第一行  
```
一段代码
```  
第二项第二行

但是这种做法有点太暴力了，我更倾向于使用下面的方法：

````markdown
* 第一项第一行

  第一项第二行

* 第二项第一行

  ```
  一段代码
  ```

  第二项第二行
````

效果：

* 第一项第一行

  第一项第二行

* 第二项第一行

  ```
  一段代码
  ```

  第二项第二行

## Markdown 代码段中的代码段

如果你要写 Markdown 代码段，但是又在代码段里使用代码段，比如：

````markdown
## 在 markdown 中使用代码段

你可以使用 ```` ``` ```` 包裹代码段使代码染色，并且可以指定代码的语言：

```markdown
使用 C++ 写一个 `Hello World` 程序吧：

```cpp
#include <iostream>

int main(int argc, char *argv[])
{
    std::cout << "Hello World!" << std::endl;
    return 0;
}
```
```
````

但是这样写解析器会炸裂的，```` ```markdown ```` 会匹配第一个 ```` ``` ````，然后第二个 ```` ``` ```` 会被视为新的代码段起始点把剩下的内容全部包裹起来。

正确的写法是：

`````markdown
## 在 markdown 中使用代码段

你可以使用 ```` ``` ```` 包裹代码段使代码染色，并且可以指定代码的语言：

````markdown
使用 C++ 写一个 `Hello World` 程序吧：

```cpp
#include <iostream>

int main(int argc, char *argv[])
{
    std::cout << "Hello World!" << std::endl;
    return 0;
}
```
````
`````

即：在外层使用四个 `` ` `` 来表示代码框。同理，继续叠代码框就需要写五个 `` ` ``，六个 `` ` ``...

对于行内代码也是同理，外层的 `` ` `` 比内层多就行了，比如 ``` ``a`b`` ``` 就会显示为 ``a`b``，````` ```` ``` ```` ````` 会显示为 ```` ``` ````。

## HTML 标签内使用 Markdown

很多人都知道，可以在 Markdown 中混入 HTML 标签以实现 Markdown 不好做到的效果。但是可能有人并不清楚怎么在 Markdown 中的 HTML 标签内部再启用 Markdown 语法。事实上，只要一个块前后都用空行包围，解析器就会对这一块启用 Markdown 语法。

例如：

```markdown
<details>
<summary>点击此处展开</summary>

这里是重新启用了 `Markdown` 语法的段落，比如：**加粗**，*斜体*。

</details>
```

效果：

<p><details markdown="1">
<summary>点击此处展开</summary>
这里是重新启用了 `Markdown` 语法的段落，比如：**加粗**，*斜体*。
</details></p>

**注意，对 [kramdown](https://kramdown.gettalong.org/) 不起作用。**但是 kramdown 有自己的办法，你可以在 HTML 标签中增加一条属性 `markdown="1"` 对该标签内部启用 Markdown 语法解析，此时不需要空行即可。上述的例子在 kramdown 下应写为：

```markdown
<details markdown="1">
<summary>点击此处展开</summary>
这里是重新启用了 `Markdown` 语法的段落，比如：**加粗**，*斜体*。
</details>
```

切记不要随便给 HTML 标签缩进，否则容易被解析器当成 Markdown 的缩进来渲染。

如果想要在表格中使用代码框，也可以用这种办法，例如：

````markdown
<table>
<thead>
<tr>
<th>结构</th><th>示例</th>
</tr>
</thead>
<tbody>
<tr>
<td>if-else</td>
<td>

```c
if (expr)
    stmt;
else
    stmt;
```

</td>
</tr>
<tr>
<td>for</td>
<td>

```c
for (init; expr; incr)
    stmt;
```

</td>
</tr>
</tbody>
</table>
````

效果：

<table>
<thead>
<tr>
<th>结构</th><th>示例</th>
</tr>
</thead>
<tbody>
<tr>
<td>if-else</td>
<td markdown="1">
```c
if (expr)
    stmt;
else
    stmt;
```
</td>
</tr>
<tr>
<td>for</td>
<td markdown="1">
```c
for (init; expr; incr)
    stmt;
```
</td>
</tr>
</tbody>
</table>
