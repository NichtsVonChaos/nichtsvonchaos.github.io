---
title: Rust 中函数与闭包与 Fn Traits 探讨
date: 2021-4-24 20:31:52 +0800
categories: [杂记 , Rust]
tags: [rust, closure, trait]     # TAG names should always be lowercase
---

## 概念

### 函数

在 Rust 中，函数通常以下面这种形式定义：

```rust
fn function_name(arg1: type1, arg2: type2) -> return_type {
    // function body
}
```

以 `fn` 关键字作为函数定义的标志，在其后依次写下**函数名**，**参数列表**，**返回值类型**和**函数体**。其中，`-> return_type` 可以不写，此时 Rust 视函数的返回类型为 `()`。

与 C++ 不同的是，Rust 允许你在函数中定义函数：

```rust
fn outside_function() {
    fn inside_function() {

    }
}
```

同时，在 Rust 中，函数名享有与变量相同的待遇，它可以赋值给变量、作为另一个函数的参数、作为另一个函数的返回值、作为泛型参数等等。

由于 Rust 是强类型语言，因此函数也有确定的类型。举个例子，上述函数 `function_name` 它的类型是 `fn(type1, type2) -> return_type`。

下面是一个将函数名当作变量来操作的例子：

```rust
fn print_and_return(num: i32) -> i32 {
    println!("{}", num);
    num
}

fn just_return(f: fn(i32) -> i32) -> fn(i32) -> i32 {
    f
}

fn main() {
    let func: fn(i32) -> i32 = print_and_return;
    just_return(func)(12);
}
```

运行之后，控制台将打印 `12`。

### 闭包

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

那么闭包的类型是什么呢？如果你借助 rust-analyzer 或者其他工具的自动类型推导，它可能会告诉你 `just_print` 的类型是 `|i32| -> ()`，但是你会发现，如果你把这个类型写到代码里：

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
如果使用 std 库函数中的 `std::any::type_name::<T>()` 来输出闭包的类型，你会得到 `crate_name::function_name::{{closure}}`。显然这也不是闭包的真实类型。
{% endraw %}

那么闭包究竟是什么类型呢？事实上，闭包的类型是在编译期间生成的独一无二的结构体。关于更详细的内容，我们将在后面探讨。

### Trait

Trait 是 Rust 中的接口抽象方式，类似于 Java 的 Interface 但是又不完全相同。一个 Trait 的定义通常如下所示：

```rust
trait TraitName {
    type TypeAlias;
    fn function_in_trait(args);
}
```

`type` 关键字定义 Trait 内的关联类型，可以用在 Trait 内的函数参数或者返回值中。

为一个结构体实现某个 Trait 可以使用 `impl`，例如：

```rust
impl MyTrait for MyStruct {
    type ReturnType = i32;
    fn my_func() -> ReturnType {
        1
    }
}
```

有关 Trait 更详细的介绍请参考相关书籍，这里仅列出基本概念以方便后面探讨 `Fn` Traits。

### 泛型

泛型类似于 C++ 中的模板，可以在写代码时使用“未知的类型”这一概念，等到编译时再根据具体的调用来实例化，这非常适合编写那些只有类型不同的代码。例如：

```rust
fn just_print<T: std::fmt::Display>(arg: T) {
    println!("{}", arg);
}

fn main() {
    just_print(12);
    just_print(0.123);
    just_print("hello world");
}
```

我们使用“未知的类型” `T` 作为函数 `just_print` 的参数类型，使得我们可以在 `main` 函数里给 `just_print` 函数传递各种各样类型的数据来打印。

注意，在定义 `T` 时，我们写的是 `T: std::fmt::Display`，这是在用 Trait 来限制泛型，即，必须是实现了 `std::fmt::Display` 这个 Trait 的类型才能被传递给 `just_print` 作参数。

除了函数之外，泛型也可以被用在结构体和 Trait 定义上。比如，如果我们要给类型实现加法，就需要让类型实现 `std::ops::Add` 这个 Trait，该 Trait 的简化定义为：

```rust
pub trait Add<Rhs = Self> {
    type Output;
    fn add(self, rhs: Rhs) -> Self::Output;
}
```

我们可以这样来使用：

```rust
impl std::ops::Add for MyStruct {
    type Output = Self;
    fn add(self, rhs: Self) -> Self::Output {
        Self { num : self.num + rhs.num }
    }
}

impl std::ops::Add<YourStruct> for MyStruct {
    type Output = HisStruct;
    fn add(self, rhs: YourStruct) -> Self::Output {
        HisStruct { num : self.num + rhs.num }
    }
}
```

有关泛型更详细的介绍请参考相关书籍，这里仅列出基本概念以方便后面探讨 `Fn` Traits。

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

着重看到 `call_once(self, args: Args)`这里，它的第一个参数类型为 `self`，这意味着它将夺取该对象（函数或闭包）的所有权。

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

注意，`trait FnMut<Args>: FnOnce<Args>` 表示在实现 `FnMut` 之前必须先给类型实现 `FnOnce`，因此，实现了 `FnMut` 的类型必定实现了 `FnOnce`。

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

注意，`trait Fn<Args>: FnMut<Args>` 表示在实现 `Fn` 之前必须先给类型实现 `FnMut`，因此，实现了 `Fn` 的类型必定实现了 `FnMut` 和 `FnOnce`。

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

任何一个函数都实现了 `FnOnce`, `FnMut`, `Fn`。

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

`vec.push(6)` 就会报错，提示你 `` borrow of moved value: `vec` ``。

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

我们只需要 `vec` 的不可变引用即可，因此我们的闭包类型是一个需要实现 `Fn` 的结构体。我们定义如下结构体来储存一个 `&Vec<i32>`：

```rust
#[derive(Copy, Clone)]
struct MyClosure<'a> {
    _vec: &'a Vec<i32>,
}
```

注意，`'a` 在这里定义了一个生命周期给 `&Vec<i32>`，生命周期在写代码时类似于泛型参数，它可以由编译器自动推导。关于生命周期更详细的内容，请参考相关书籍。

`#[derive(Copy, Clone)]` 并非是必须的，但是我们要模仿闭包的行为，因此我们也给我们即将实现 `Fn` 的结构体也实现 `Copy`。

### 实现 Trait

首先从 `FnOnce` 开始：

```rust
impl<'a> FnOnce<(usize,)> for MyClosure<'a> {
    type Output = ();
    extern "rust-call" fn call_once(self, (index,): (usize,)) -> Self::Output {
        println!("{}", self._vec[index]);
    }
}
```

`(usize,)` 是提供给 `FnOnce` 的泛型参数，注意有个逗号是为了表示自己是“包含一个元素的元组”而不是“一对括号加一个数据”。

由于我们的闭包不需要返回值，因此我们定义 `type Output = ();`。

`extern "rust-call"` 是一种定义将接收的元组扩展为函数参数调用的 ABI，我们可以不去理会它，照着抄。

最后，我们在 `call_once` 的函数体中打印 `_vec` 的第 `index` 个元素。

同理，我们再给结构体实现 `FnMut` 和 `Fn`：

```rust
impl<'a> FnMut<(usize,)> for MyClosure<'a> {
    extern "rust-call" fn call_mut(&mut self, (index,): (usize,)) -> Self::Output {
        println!("{}", self._vec[index]);
    }
}

impl<'a> Fn<(usize,)> for MyClosure<'a> {
    extern "rust-call" fn call(&self, (index,): (usize,)) -> Self::Output {
        println!("{}", self._vec[index]);
    }
}
```

### 验证

```rust
fn main() {
    let vec = vec![1, 2, 3];
    let just_print = MyClosure { _vec: &vec };
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

## ZST 闭包

这是一种特殊类型的闭包，它不捕捉任何上下文变量，因此它的结构体大小是 0，即 Zero Sized Type。

对于编译器实现的闭包，我们可能体会不到 ZST 闭包和一般的闭包有啥不同，但是，如果是我们自己实现的 ZST 闭包：

```rust
struct JustPrint;

impl FnOnce<(i32,)> for JustPrint {
    type Output = ();
    extern "rust-call" fn call_once(self, (num,): (i32,)) -> Self::Output {
        println!("{}", num);
    }
}

impl FnMut<(i32,)> for JustPrint {
    extern "rust-call" fn call_mut(&mut self, (num,): (i32,)) -> Self::Output {
        println!("{}", num);
    }
}

impl Fn<(i32,)> for JustPrint {
    extern "rust-call" fn call(&self, (num,): (i32,)) -> Self::Output {
        println!("{}", num);
    }
}

fn main() {
    JustPrint(0);
    JustPrint(1);
    JustPrint(2);
}
```

你会发现特殊的地方来了：我们可以直接通过 `JustPrint(0)` 的方式来调用闭包函数，我们甚至没有实例化一个 `JustPrint` 的对象！
