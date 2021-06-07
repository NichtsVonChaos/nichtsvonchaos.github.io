---
title: Rust 中函数与闭包与 Fn Traits 探讨
date: 2021-4-24 20:31:52 +0800
categories: [杂记 , Rust]
tags: [rust, closure, trait]     # TAG names should always be lowercase
---

## 闭包

闭包，或者又名匿名函数，lambda 函数，它在官方文档中被定义为**可以捕获环境的匿名函数**。通常，闭包的定义具有以下的形式：

```rust
let closure_name = |arg1: type1, arg2: type2| -> return_type {
    // closure body
}
```

在闭包定义中，可以省略参数的类型和返回值类型，Rust 将通过第一次调用该闭包时的参数类型来决定闭包的参数类型以及返回值类型，甚至，如果闭包体只有一句代码时，可以省略花括号不写：

```rust
let just_print = |num| println!("{}", num);
just_print(12);
```

闭包同时有一个函数无法做到的功能：捕获上下文变量。举个例子：

```rust
let delta = 5;
let add_delta = |num| num + delta;
println!("{}", add_delta(15));
```

以上例子将在控制台输出 `20`。

那么闭包的类型是什么呢？如果你借助 rust-analyzer 或者其他工具的自动类型推导，它可能会告诉你 `just_print` 的类型是 `|i32| -> ()`{:.language-rust}，但是你会发现，如果你把这个类型写到代码里：

```rust
let just_print: |i32| -> () = |num| println!("{}", num);
```

这是通不过编译的。再者，你会发现，“同类型”的闭包也不能赋值，比如下面的代码：

```rust
let mut just_print = |num| println!("{}", num);
just_print = |num| println!("{}", num);
```

Rust 编译器会明确的告诉你两个闭包的类型不同，即使他们有着完全一样的定义。

{% raw %}
如果使用 std 库函数中的 `std::any::type_name::<T>()`{:.language-rust} 来输出闭包的类型，你会得到 `crate_name::function_name::{{closure}}`。显然这也不是闭包的真实类型。
{% endraw %}

那么闭包究竟是什么类型呢？事实上，闭包的类型是在编译期间生成的独一无二的结构体。关于更详细的内容，我们将在后面探讨。

## `Fn` Traits

`Fn` Traits 指：`Fn`, `FnMut`, `FnOnce` 这三个 Trait。通常，编译器会为函数以及闭包自动实现这些 Trait。

### `FnOnce`

**任何一个函数、闭包都必定会实现 `FnOnce`**，我们可以从源码中看到它的定义为：

```rust
pub trait FnOnce<Args> {
    type Output;
    extern "rust-call" fn call_once(self, args: Args) -> Self::Output;
}
```

着重看到 `fn call_once(self, args: Args)`{:.language-rust} 这里，它的第一个参数类型为 `self`{:.language-rust}，这意味着它将夺取该对象（函数或闭包）的所有权。

对于下面这种类型的闭包，编译器只会为它实现 `FnOnce` Trait：

```rust
let vec = vec![1, 2, 3];
let just_return = || vec;
```

在本例中，闭包必须拥有上下文变量 `vec` 的所有权，编译器只为该闭包实现 `FnOnce`。

### `FnMut`

同样，先来看其源码定义：

```rust
pub trait FnMut<Args>: FnOnce<Args> {
    extern "rust-call" fn call_mut(&mut self, args: Args) -> Self::Output;
}
```

注意，`trait FnMut<Args>: FnOnce<Args>`{:.language-rust} 表示在实现 `FnMut` 之前必须先给类型实现 `FnOnce`，因此，实现了 `FnMut` 的类型必定实现了 `FnOnce`。

**任何一个函数都实现了 `FnMut`**。对于闭包，如果闭包可以仅通过可变引用，而不是获取其所有权的方式访问上下文变量，则编译器会为该闭包实现 `FnMut`。例如，下面的例子中，闭包会实现 `FnMut` 并可以多次调用：

```rust
let mut vec = vec![1, 2, 3];
let mut vec_push = |num| vec.push(num);
vec_push(4);
vec_push(5);
vec_push(6);
```

注意：你必须给闭包也声明为 mut。

### `Fn`

同样，来看到其定义：

```rust
pub trait Fn<Args>: FnMut<Args> {
    extern "rust-call" fn call(&self, args: Args) -> Self::Output;
}
```

注意，`trait Fn<Args>: FnMut<Args>`{:.language-rust} 表示在实现 `Fn` 之前必须先给类型实现 `FnMut`，因此，实现了 `Fn` 的类型必定实现了 `FnMut` 和 `FnOnce`。

**任何一个函数都实现了 `Fn`**。对于闭包，如果闭包可以仅通过不可变引用的方式访问上下文变量，则编译器会为该闭包实现 `Fn`。例如，在下面的例子中，闭包会实现 `Fn` 并可以多次调用：

```rust
let vec = vec![1, 2, 3];
let get_num = |index| vec[index];
let num_0 = get_num(0);
let num_1 = get_num(1);
let num_2 = get_num(2);
```

与 `FnMut` 不同的是，仅实现了 `FnMut` 的闭包拥有上下文变量的可变引用，因此该闭包是不可以拷贝的，比如，在 `FnMut` 的例子中，我们：

```rust
let mut vec = vec![1, 2, 3];
let mut vec_push = |num| vec.push(num);
let mut vec_push_moved = vec_push;
```

会导致闭包所有权转移到 `vec_push_moved` 从而 `vec_push` 不能再被访问。但是在 `Fn` 中，我们可以：

```rust
let vec = vec![1, 2, 3];
let get_num = |index| vec[index];
let get_num_copy = get_num;
let num_0 = get_num(0);
let num_1 = get_num_copy(1);
let num_2 = get_num(2);
```

因为该闭包仅仅包含上下文变量的不可变引用，因此编译器会为它实现 `Fn` 的同时实现 `Copy`，我们可以随意拷贝数份闭包来使用。

### 总结

任何一个函数都实现了 `FnOnce`, `FnMut`, `Fn`, `Copy`。

对于闭包：

* 必定实现 `FnOnce`。
* 如果闭包能仅通过可变引用访问上下文变量，则实现 `FnOnce` 和 `FnMut`。
* 如果闭包能仅通过不可变引用访问上下文变量，或者不访问上下文变量，则实现 `FnOnce`, `FnMut`, `Fn`, `Copy`。

当调用一个函数或闭包时，编译器首先寻找 `call` 来调用，如果没有，则寻找 `call_mut`，再没有再寻找 `call_once`。

### `move`

`move` 可能是一个很容易带来误解的关键字。例如下面的代码：

```rust
let mut vec = vec![1, 2, 3];
let mut vec_push = move |num| vec.push(num);
```

以及

```rust
let vec = vec![1, 2, 3];
let get_num = move |index| vec[index];
```

这可能很容易让人以为，这两个闭包会只实现 `FnOnce`。但是事实上，前者依然实现了 `FnMut`，后者依然实现了 `Fn`，两处的 `move` 似乎对它们的使用没有造成任何影响。

还记得我们之前说过，闭包的类型是在编译时生成的独一无二的结构体吗，而 `move` 实际上负责的是如何将上下文变量移动到该结构体内，但是 `Fn`, `FnMut`, `FnOnce` 的实现取决于闭包在调用时的行为，因此 `move` 不会影响到一个闭包会实现哪些 `Fn` Traits。

例如，在 `FnMut` 的例子中，如果我们写：

```rust
let mut vec = vec![1, 2, 3];
let mut vec_push = |num| vec.push(num);
vec_push(4);
vec_push(5);
vec.push(6);
```

是可以的，但是如果你改成：

```rust
let mut vec = vec![1, 2, 3];
let mut vec_push = move |num| vec.push(num);
vec_push(4);
vec_push(5);
vec.push(6);
```

`vec.push(6)`{:.language-rust} 就会报错，提示你 `` borrow of moved value: `vec` ``。在第一个例子中，闭包在其结构体中只储存 `vec` 的可变引用，而在第二个例子中，闭包会转移 `vec` 的所有权保存在自己的结构体中。

> 值得注意的是，由于此时闭包的结构体持有 `vec` 而不是持有它的不可变引用，因此**闭包不会自动实现 `Copy`**，除非被 `move` 的类型实现了 `Copy` 闭包才会自动实现 `Copy`。

更多的情况下，`move` 需要处理的是生命周期的问题。我们来看到下面的例子：

```rust
let x = 5;
std::thread::spawn(|| println!("captured {} by value", x))
    .join()
    .unwrap();
```

在这个例子中，`x` 在闭包中可以仅以不可变引用的方式访问，因此该闭包会实现 `Fn`。但是问题来了，虽然我们在此处通过 `.join().unwrap()` 的方式直接等待线程运行结束，但在实际中，我们无法保证线程的运行时机，也就是说：我们无法保证线程在访问 `x` 的时候，主线程的 `x` 仍然存在——主线程可能早就已经跑去做其他事情了。因此，这种时候我们就需要通过 `move` 关键字将 `x` 移入闭包的结构体中：

```rust
let x = 5;
std::thread::spawn(move || println!("captured {} by value", x))
    .join()
    .unwrap();
```

此时结构体获得 `x` 的所有权，而不只是获得 `x` 的引用，就能够保证闭包调用时 `x` 的生命周期。此时该闭包仍然实现了 `Fn` 而不是仅实现了 `FnOnce`，这一点可以通过下面的代码验证：

```rust
let x = 5;
let closure = move || println!("captured {} by value", x);
let closure_copy = closure;
closure();
closure_copy();
std::thread::spawn(closure).join().unwrap();
```

## 自己实现 `Fn` Traits

为了更好地理解闭包的工作，我们来自己实现一个类似于闭包的结构体。

值得注意的是，`Fn` Traits 并不是稳定的功能，你必须使用 nightly 版本的 Rust，并且在 `main.rs` 顶端加上这一行：

```rust
#![feature(unboxed_closures, fn_traits)]
```

### 需求

首先，给出一个简单的需求：

```rust
let vec = vec![1, 2, 3];
let just_print = ...;
just_print(0);
just_print(1);
just_print(2);
```

能够依次打印 `vec` 内的元素。

### 定义结构体

我们只需要 `vec` 的不可变引用即可，因此我们的闭包类型是一个需要实现 `Fn` 的结构体。我们定义如下结构体来储存一个 `&Vec<i32>`{:.language-rust}：

```rust
#[derive(Copy, Clone)]
struct MyClosure<'a> {
    captured_data: &'a Vec<i32>,
}
```

注意，`'a`{:.language-rust} 在这里定义了一个生命周期给 `&Vec<i32>`{:.language-rust}，生命周期在写代码时类似于泛型参数，它可以由编译器自动推导。关于生命周期更详细的内容，请参考相关书籍。

`#[derive(Copy, Clone)]`{:.language-rust} 并非是必须的，但是我们要模仿闭包的行为，因此我们也给我们即将实现 `Fn` 的结构体也实现 `Copy`。

### 实现 Trait

首先从 `FnOnce` 开始：

```rust
impl<'a> FnOnce<(usize,)> for MyClosure<'a> {
    type Output = ();
    extern "rust-call" fn call_once(self, (index,): (usize,)) -> Self::Output {
        println!("{}", self.captured_data[index]);
    }
}
```

`(usize,)`{:.language-rust} 是提供给 `FnOnce` 的泛型参数，注意有个逗号是为了表示自己是“包含一个元素的元组”而不是“一对括号加一个数据”。

由于我们的闭包不需要返回值，因此我们定义 `type Output = ();`{:.language-rust}。

`extern "rust-call"`{:.language-rust} 是一种定义将接收的元组扩展为函数参数调用的 ABI，我们可以不去理会它，照着抄。

最后，我们在 `call_once` 的函数体中打印 `captured_data` 的第 `index` 个元素。

同理，我们再给结构体实现 `FnMut` 和 `Fn`：

```rust
impl<'a> FnMut<(usize,)> for MyClosure<'a> {
    extern "rust-call" fn call_mut(&mut self, (index,): (usize,)) -> Self::Output {
        println!("{}", self.captured_data[index]);
    }
}

impl<'a> Fn<(usize,)> for MyClosure<'a> {
    extern "rust-call" fn call(&self, (index,): (usize,)) -> Self::Output {
        println!("{}", self.captured_data[index]);
    }
}
```

### 验证

```rust
fn main() {
    let vec = vec![1, 2, 3];
    let just_print = MyClosure { captured_data: &vec };
    just_print(0);
    just_print(1);
    just_print(2);
}
```

使用上述的代码验证我们的闭包结构体，编译，运行成功，在控制台输出：

```text
1
2
3
```

### 理解 `move` 关键字

通过自己实现闭包结构体，我们能够更加清晰地理解 `move` 为何物。在本例中，如果要模拟 `move`，实际上就等同于修改 `MyClosure` 的定义为：

```rust
#[derive(Clone)]
struct MyClosure {
    captured_data: Vec<i32>,
}
```

闭包结构体持有所有权，且不自动实现 `Copy`（当闭包结构体内所有类型实现了 `Copy` 的类型时仍然自动实现 `Copy`）。

实现 `Fn` traits 只需要删除生命周期参数即可：

```rust
impl FnOnce<(usize,)> for MyClosure {
    type Output = ();
    extern "rust-call" fn call_once(self, (index,): (usize,)) -> Self::Output {
        println!("{}", self.captured_data[index]);
    }
}

impl FnMut<(usize,)> for MyClosure {
    extern "rust-call" fn call_mut(&mut self, (index,): (usize,)) -> Self::Output {
        println!("{}", self.captured_data[index]);
    }
}

impl Fn<(usize,)> for MyClosure {
    extern "rust-call" fn call(&self, (index,): (usize,)) -> Self::Output {
        println!("{}", self.captured_data[index]);
    }
}
```

在测试时，需要将 `vec` 移入结构体内而不是获取它的引用：

```rust
    let vec = vec![1, 2, 3];
    let just_print = MyClosure { captured_data: vec };
    just_print(0);
    just_print(1);
    just_print(2);
```
