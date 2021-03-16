---
title: 记一次Manjaro下Grub炸裂的问题
date: 2021-3-15 00:51:43 +0800
categories: [Linux, Problem]
tags: [manjaro, linux]     # TAG names should always be lowercase
---

## 问题的发生

最近嫌弃Ubuntu实在是太傻逼了，遂卸载换Manjaro。

我原本以为以自己的经验完全不成问题，没想到装好系统后，第二天就打不开了。具体的特征是，开机时电脑一直**黑屏**，不久后电源指示灯熄灭，电脑重启进入BIOS的引导提示界面。以前我遇到过系统进不去、Grub只有命令行的问题，但是连Grub命令行都没有的情况我还是第一次见到。

我以为是自己哪里操作有问题，没在意就重装了一次，没想到一番鼓捣之后，这个问题再次出现了！这可得了，我一定要找出问题所在。

## Live CD

刚好我是用U盘装的Manjaro，插上U盘就可以当Live CD用，启动U盘里的Manjaro。

## 挂载系统

```sh
sudo manjaro-chroot -a
```

等待一段时间后，会出现以下提示：

```c
==> detected systems:
–> 0) ManjaroLinux
==>Select system to mount [0-0]
```

选0之后却出现：

```c
==>ERROR: You cant mount 0!
```

选1反而成功了，原理不明。

如果/boot和/boot/efi没挂载上，需要手动挂载一下。

然后另开一个终端，把proc,sys,dev这些也给挂上：

```sh
sudo mount -t proc /proc /mnt/proc/
sudo mount --rbind /sys /mnt/sys/
sudo mount --rbind /dev /mnt/dev/
```

## 排查错误

接下来就开始了漫长的排查错误。。。

### update-grub

首先执行了`update-grub`，显然事情没有这么简单就能解决。

再次尝试先`grub-install /dev/sda4`（sda4是我的/boot分区，自己的分区用`fdisk -l`查看），再`update-grub`，无果。

### 重装内核

使用pacman发现连不上网，需要先在外面的终端调用：

```sh
cp -L /etc/resolv.conf /mnt/etc/resolv.conf
```

联网成功。调用命令

```sh
pacman -S linux
pacman -Syu
```

之后再`update-grub`，没有效果。

### 卸载N卡驱动

想起来我把N卡驱动换成了闭源驱动，是不是这个问题？

```sh
mhwd -f -r pci video-hybrid-intel-nvidia-prime
```

仍然无效。

## 问题的解决

那还能是什么问题呢？我前前后后花了快两个小时，碰了一鼻子的灰，硬是没有一点进展。突然，我的脑海里突然闪过一段记忆碎片，我似乎曾经改过/etc/default/grub，把

```sh
GRUB_DEFAULT=saved
```

改成了

```sh
GRUB_DEFAULT=2
```

难道是这个问题？这是个很离谱的想法，但是一筹莫展的我也就瞎猫碰上死耗子随缘试试了。`update-grub`，重启、、、竟然开机了！

我简直喜极而泣好吧。不过还是没有grub页面直接进的系统。

## 产生的原因

找到问题点之后，我又仔细研究了一下/etc/default/grub，发现

```sh
GRUB_TIMEOUT_STYLE=hidden
```

原来不是没有grub，而是默认设置的隐藏界面，将其改为

```sh
GRUB_TIMEOUT_STYLE=menu
```

后显示grub。

我之前修改

```sh
GRUB_DEFAULT=2
```

是基于在Ubuntu上的经验，第三个选项是Windows，但是我的manjaro没有识别到Windows的引导，第三个选项是BIOS设置，两者混合的结果就是导致grub默认进入BIOS，在不知情的情况下，就好像是grub崩溃了一样。

向/etc/default/grub中写入

```sh
GRUB_DISABLE_OS_PROBER=false
```

后，`update-grub`，重启，成功找到Windows。问题解决。

## 参考

[manjaro+win10双系统修复grub的艰辛过程](https://zhuanlan.zhihu.com/p/155981949)

[使用Live CD修复UEFI模式下Manjaro Linux启动问题](https://ld246.com/article/1577419136203)

[mount dev, proc, sys in a chroot environment?](https://superuser.com/questions/165116/mount-dev-proc-sys-in-a-chroot-environment)

[Chroot (简体中文)](https://wiki.archlinux.org/index.php/Chroot_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))
