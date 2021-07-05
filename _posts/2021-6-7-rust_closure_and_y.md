---
title: Rust 中的闭包递归与 Y 组合子
date: 2021-6-7 23:45:52 +0800
categories: [杂记 , Rust]
tags: [rust, closure]     # TAG names should always be lowercase
---

## λ 函数递归

**λ 函数**也即**匿名函数**，在 Rust 中体现为**闭包**。在一些语言中，你可以简单地在 λ 函数内调用自己实现递归，例如在 JavaScript 中实现一个阶乘：

```js
fact = n => {
    if (n == 0) return 1;
    else return n * fact(n - 1);
}
console.log(fact(5)) // 输出120
```

但是当你想在 Rust 中复现这一操作时：

```rust
let fact = |n| match n {
    0 => 1,
    _ => n * fact(n - 1),
};
println!("{}", fact(5));
```

你只会得到编译器报错：

```text
_ => n * fact(n - 1),
         ^^^^ not found in this scope
```

**Rust 并不允许你在 `fact` 的定义结束之前就使用 `fact`。**这涉及到语言的设计理念，对于函数，仅需要通过其参数和返回值类型就可以指定其类型和大小，因此函数中可以调用自己；但是对于闭包，闭包的类型和大小依赖于其完整定义，因为闭包的本质是储存了被捕获的值的结构体，因此在调用 `fact` 时闭包定义不完全，大小未知，Rust 无法为其分配栈内存。即使 Rust 有那么聪明，可以通过假设闭包的类型来完成闭包结构体的构建，也会出现自引用，破坏 Rust 的借用规则。

## λ 演算与 Y 组合子

### λ 演算

λ 演算的函数定义为：

```text
(λx.M)
```

`.` 前为**参数声明**，`.` 后为**函数体**，在无歧义的情况下可以省略括号。例如简单函数 `f(x) = x + 2` 可以给出 λ 演算：`λx.x + 2`。

如果将函数 `M` 应用给参数 `N`，则写作：

```text
(M N)
```

在无歧义的情况下可以省略括号。例如，将上述函数作用于数值 3 上，即求 `f(3)`，用 λ 演算表示则是：`(λx.x + 2) 3`。

对于多参数函数也是类似，例如将 `f(x, y) = x + y` 转换为 λ 演算则是 `λx y.x + y`，作用于 2, 3 上为 `(λx y.x + y) 2 3`。

在这个例子中，我们可以将 `(λx y.x + y) 2 3` 视为 `((λx y.x + y) 2) 3`，也就是将 `f` 定义为 `f(x) = x + y`，注意到 `y` 并不是参数，因此 `f(x)` 的返回值也是函数，为了区分这种情况，我们**依照 Rust 的闭包语法**（也就是说，**对于任何一个函数有 `g = |x| g(x)`**）将 `f` 定义为：`f(x) = |y| x + y`。将 `2` 代入其中，得到一个新函数 `g(y) = f(2)(y) = 2 + y`（或 `λy.2 + y`），再计算 `g(3)` 的值。

### α 等价

α 等价意味着**参数的命名不影响结果**，也就是说 `λx.x + 2` 与 `λy.y + 2` 完全等效，这也符合我们的编程逻辑：

```rust
let f1 = |x| x + 2;
let f2 = |y| y + 2;
assert!(f1(3) == f2(3));
```

### β 规约

β 规约实际上等同于**将函数调用时的参数替换到未知数上**，例如将 `(λx.x + 2) 3` 规约后就得到 `3 + 2`，这意味着 `(λx.x + 2) 3` 等价于 `3 + 2`。

### 组合子逻辑

我们之前的讨论都建立在参数是数值类型的前提下，如果**参数本身就是一个 λ 演算**呢？

考虑 `g(f) = f(3)`，该函数将 `3` 传递给参数 `f` 并将其返回值作为自己的返回值，用 λ 演算表示即是 `λf.f 3`。注意这种写法并不是将 `λf.f` 作用于 `3`，而是将 `f 3` 作为 λ 演算的函数体。如果要表示前者，则需要写成 `(λf.f) 3`，或者，为了避免歧义，可以将后者表示为 `λf.(f 3)`。

如果我们将之前的函数 `f(x) = x + 2` 即 `λx.x + 2` 作为 `g(f)` 的参数，则得到 `(λf.f 3) (λx.x + 2)`，该 λ 演算经过 β 规约后等效于 `(λx.x + 2) 3`，并且等效于 `3 + 2`。

现在，我们来考虑不能被 β 规约的情况。如果有函数 `f(g) = g(g)`，且用 `f` 自身作为其调用时的参数，即 `f(f)`，这就构成了一个最简单的**无限递归**，`f` 函数内部不断地以 `f` 为参数调用 `f`。我们把该函数写作 λ 演算为 `λg.g g`，根据 α 等价，我们可以写成 `λx.x x`，这被称为 **ω 组合子**，其函数调用 `f(f)` 就是把自己的定义作为参数，因此我们将 `f(f)` 转换为 λ 演算也是将自身作为参数：`(λx.x x) (λx.x x)`，这被称为 **Ω 组合子**，该组合子无论经过多少次 β 规约仍保持不变。考虑函数 `f(g) = g(g(g))`，其写作 λ 演算表示为 `λx.x x x`，仍然以 `f` 自身作为参数调用：`f(f)`，以 λ 演算表示为 `(λx.x x x) (λx.x x x)`，这被称为 **Ω<sub>2</sub> 组合子**，该组合子经过三个步骤后会规约到自身。以此类推。

### Y 组合子

上述递归都是把函数把自身作为参数来调用，它与我们编程时写的递归并不相同。我们写的递归更多的是形如 `f(x) = M(f(x - 1))` 的结构，即默认 `f` 在自己的函数体内是已知的，不需要通过参数传递。这种情况显然是很难使用 λ 演算中表示的，因为 **λ 演算具有匿名性**，你无法在 λ 演算内部得到该演算的名字。

要在 λ 演算中实现匿名递归，我们要改变一下思路，仍然以 `f(x) = M(f(x - 1))` 为例，我们将其当作一个**匿名函数**，即我们无法在 `f` 的函数定义内直接调用 `f`，因此我们定义一个新函数 `g(f) = |x| M(f(x - 1))`，因为 `f` 是 `g` 的参数，所以我们可以在 `g` 的定义中使用 `f`。

然后，我们寻找关于 `g(f)` 的**不动点**，即寻找一个函数 `f'`，它使得 `g(f') = f'` 成立。你会发现，因为 `f' = g(f')`，所以实质上 `f' = |x| M(f'(x - 1))`，即 `f'(x) = M(f'(x - 1))`，这说明 `f'` 本质上就是我们的匿名函数 `f`，只不过 `f'` 是 `g` 函数的一个参数，拥有自己的名字，所以它可以自己调用自己。

现在最大的问题是，我们要怎么**从 `g` 里把 `f'` 拿出来用**？直接调用 `g` 是肯定不行的，因为 `g` 又要求 `f'` 作为自己的参数，这会陷入死循环。

为了得到 `f'`，我们需要找到一个函数 `Y`，对于任何函数 `g`，它都能使 `f' = Y(g)`，也就是输入一个函数，输出它的不动点，这个 `Y` 称为**不动点算子**。

我们用**阶乘**作为例子来理解，阶乘的通常定义为：

```text
fact(x) = (x == 0 ? 1 : x * fact(x - 1))
```

将上述代码包装为 `g(f)` ：

```text
g(f) = |x| (x == 0 ? 1 : x * f(x - 1))
```

由于 Y 和 g 都已知，因此我们需要的真正的 `fact` 函数为：

```text
fact(x) = Y(g)(x)
```

现在就是最后一个问题，是否真的存在一个不动点算子 Y 对于任何函数 `g(f)` 和其不动点 `f'` 都有 `f' = Y(g)` 成立？答案是**存在**，直接说结论：

```text
Y = λf.(λx.(f (x x)) λx.(f (x x)))
```

这就是大名鼎鼎的 **Y 组合子**。如果要将其写成函数形式，就是：

```text
Y(g) = (|f| f(f))(|f| g(f(f)))
```

证明其对于任何函数 `g(f)` 和其不动点 `f'` 都有 `f' = Y(g)`：

```text
Y g
= λf.(λx.(f (x x)) λx.(f (x x))) g      // 使用 Y 的定义替换 Y
= λx.(g (x x)) λx.(g (x x))             // β 规约，将 g 代入 f
= λy.(g (y y)) λx.(g (x x))             // α 等价，重命名第一个 λ 算子的参数为 y
= g (λx.(g (x x)) λx.(g (x x)))         // β 规约，将 λx.(g (x x)) 带入到 y 中
= g (λf.(λx.(f (x x)) λx.(f (x x))) g)  // 逆 β 规约，将 g 提取出来
= g (Y g)                               // 将 Y 的定义重新替换成 Y
```

因为 `Y g = g (Y g)`，根据不动点的定义 `f' = g(f')`，可见 `Y g` 确实是 `g(f)` 的不动点。

## 在 Rust 中实现 Y 组合子

我们按照之前的逻辑，将 `g` 定义为：

```rust
let g = |f| {
    |x| match x {
        0 => 1,
        _ => x * f(x - 1),
    }
};
```

那么，你需要将 Y 算子定义为：

```rust
fn y<A, R, G, F>(g: G) -> impl Fn(A) -> R
where
    F: Fn(A) -> R,
    G: Fn(F) -> F,
{
    (|f| f(f))(|f| g(f(f)))
}
```

问题就出现了，在闭包 `|f| g(f(f))`{:.language-rust} 中，参数 `f` 的类型是什么？因为闭包作为 `|f| f(f)`{:.language-rust} 的参数，因此可以得知，它输入自身的类型，返回 `F` 类型。假设闭包 `|f| g(f(f))`{:.language-rust} 的类型是 `T`，那么 `f` 的类型是 `Fn(T) -> F`{:.language-rust}，代回原本 `T` 就是 `Fn(Fn(T) -> F) -> F`{:.language-rust}，这就迎来了喜闻乐见的**无限展开**，你可以把这个类型扩展到无穷，自然，Rust 也无法接受一个无限展开的类型作为参数。

那么我们可以换个思路，使用闭包自身类型的**引用**（准确的说，是 Trait Object 的引用），因为引用的大小是固定的，所以 Rust 能够确定类型的大小：

```rust
struct Func<'a, F>(&'a dyn Fn(Func<F>) -> F);
```

为其实现 `Clone` 和 `Copy`：

```rust
impl<'a, F> Clone for Func<'a, F> {
    fn clone(&self) -> Self {
        Self(self.0)
    }
}

impl<'a, F> Copy for Func<'a, F> {}
```

为了让这个 `Func` 类型能够调用其包裹的函数，我们给它实现一个 **`call` 方法**来充当**函数调用**：

```rust
impl<'a, F> Func<'a, F> {
    fn call(&self, t: Func<'a, F>) -> F {
        (self.0)(t)
    }
}
```

这样，原本的 Y 算子就变成了：

```rust
fn y<A, R, G, F>(g: G) -> impl Fn(A) -> R
where
    F: Fn(A) -> R,
    G: Fn(F) -> F,
{
    (|f: Func<F>| f.call(f))(Func(&move |x| g(x.call(x))))
}
```

乍一看，好像已经解决了问题，但是我们再回过头来看 `g`：

```rust
let g = |f| {
    |x| match x {
        0 => 1,
        _ => x * f(x - 1),
    }
};
```

这里又迎来了一个全新的问题，那就是 `f` 的类型。Rust 会表示无自动推导这么复杂的情况，要求我们注明 `f` 的类型，但是我们要怎么在一个闭包作为另一个闭包的参数时标注它的类型呢？我们只能考虑使用引用（实际上是 Trait Object 的引用），即 `&dyn Fn(usize) -> usize`{:.language-rust} 的形式来表示 `f`，自然，`g` 函数也应该返回一个引用：

```rust
let g = |f: &dyn Fn(usize) -> usize| {
    &|x| match x {
        0 => 1,
        _ => x * f(x - 1),
    }
};
```

Boom！全部木大，我们**无法做到将一个具有捕获值的临时闭包的引用传递到 `g` 的外面**，即使你用 `Func` 也不能改变结果。

那该怎么办呢？让我们换个角度来思考，`g(f)(x)` 也就是 λ 演算 `(g f) x` 等效于 λ 演算 `g f x` 也就是 `g(f, x)`，我们何不**把 `g` 定义为双参函数 `g(f, x)`**，不返回闭包，而是直接在 `g` 内部求解答案并返回呢？

```rust
let g = |f, x| match x {
    0 => 1,
    _ => x * f(x - 1),
};
```

这样 `g` 函数的返回值就是整数，我们也不必要去头疼 `g(f)` 返回闭包引用的问题了。现在再来考虑 `f` 和 `g` 的类型，Rust 仍然会要求我们手动给 `f` 添加类型，因此我们依旧给 `f` 的类型定义为 `&dyn Fn(usize) -> usize`{:.language-rust}，这样 `g` 的类型是 `Fn(&dyn Fn(usize) -> usize, usize) -> usize`{:.language-rust}：

```rust
let g = |f: &dyn Fn(usize) -> usize, x| match x {
    0 => 1,
    _ => x * f(x - 1),
};
```

我们再来看到 Y 算子怎么修改，我们先把原本的 `Y(g)(x)` 逻辑写出：

```text
Y(g)(x) = (|f| f(f))(|f| g(f(f)))(x)
```

双参函数 `g(f, x)` 仅仅改变了 `x` 的传递过程：

```text
Y(g)(x) = (|f| f(f))(|f, x| g(f(f), x))
```

注意到定义中所有的 `f` 接收的都是 `|f, x| g(f(f), x)` 闭包，因此所有的 `f` 都是双参函数，修改为：

```text
Y(g)(x) = (|f, x| f(f, x))(|f, x| g(|x| f(f, x), x), x)
```

提取出 `x`，得到新的 Y 算子：

```text
Y(g) = |x| (|f, x| f(f, x))(|f, x| g(|x| f(f, x), x), x)
```

因为闭包 `|f, x| f(f, x)` 将闭包 `|f, x| g(|x| f(f, x), x)` 作为自己的 `f` 参数调用，因此，我们在推导闭包 `|f, x| g(|x| f(f, x), x)` 的类型时又会遇到**无限展开**。我们仍然使用之前定义 **`Func`** 的办法来处理：

```rust
struct Func<'a, A, F>(&'a dyn Fn(Func<'a, A, F>, A) -> F);

impl<'a, A, F> Clone for Func<'a, A, F> {
    fn clone(&self) -> Self {
        Self(self.0)
    }
}

impl<'a, A, F> Copy for Func<'a, A, F> {}

impl<'a, A, F> Func<'a, A, F> {
    fn call(&self, f: Func<'a, A, F>, x: A) -> F {
        (self.0)(f, x)
    }
}
```

我们可以将闭包 `|f, x| g(|x| f(f, x), x)` 包装为 `Func` 类型的对象 `Func(&|f, x| g(|x| f(f, x), x))`{:.language-rust}，那么其中的 `f` 由于是自身的类型，也是 `Func`，其函数调用 `f(f, x)` 就转换成了 `f.call(f, x)`{:.language-rust}。同样，因为 `|f, x| f(f, x)` 中的 `f` 类型接受 `Func(&|f, x| g(|x| f(f, x), x))`{:.language-rust} 作为参数，所以 `|f, x| f(f, x)` 中的 `f` 也转换为 `f.call`：

```text
Y(g) = |x| (|f, x| f.call(f, x))(Func(&|f, x| g(|x| f.call(f, x), x)), x)
```

**事实上我们已经用 Rust 把 `y` 函数写出来了。**注意到我们定义的 `g` 接受一个**闭包引用**而不是闭包，因此需要将 `g(|x| f.call(f, x), x)`{:.language-rust} 的第一个参数修改为引用：

```rust
fn y<A, R>(g: impl Fn(&dyn Fn(A) -> R, A) -> R) -> impl Fn(A) -> R {
    |x| (|f, x| f.call(f, x))(Func(&|f, x| g(&|x| f.call(f, x), x)), x)
}
```

出于 Rust 无法推导这么复杂的类型，我们给 `f` 标注类型：

```rust
fn y<A, R>(g: impl Fn(&dyn Fn(A) -> R, A) -> R) -> impl Fn(A) -> R {
    |x| (|f: Func<A, R>, x| f.call(f, x))(Func(&|f, x| g(&|x| f.call(f, x), x)), x)
}
```

最后，考虑到 `g` 的生命周期，我们加上 `move` 将 `g` 移入闭包，以保证闭包被调用期间 `g` 始终有效：

```rust
fn y<A, R>(g: impl Fn(&dyn Fn(A) -> R, A) -> R) -> impl Fn(A) -> R {
    move |x| (|f: Func<A, R>, x| f.call(f, x))(Func(&|f, x| g(&|x| f.call(f, x), x)), x)
}
```

### 最终实现

将所有代码整合在一起：

```rust
struct Func<'a, A, F>(&'a dyn Fn(Func<'a, A, F>, A) -> F);

impl<'a, A, F> Clone for Func<'a, A, F> {
    fn clone(&self) -> Self {
        Self(self.0)
    }
}

impl<'a, A, F> Copy for Func<'a, A, F> {}

impl<'a, A, F> Func<'a, A, F> {
    fn call(&self, f: Func<'a, A, F>, x: A) -> F {
        (self.0)(f, x)
    }
}

fn y<A, R>(g: impl Fn(&dyn Fn(A) -> R, A) -> R) -> impl Fn(A) -> R {
    move |x| (|f: Func<A, R>, x| f.call(f, x))(Func(&|f, x| g(&|x| f.call(f, x), x)), x)
}

fn main() {
    let g = |f: &dyn Fn(usize) -> usize, x| match x {
        0 => 1,
        _ => x * f(x - 1),
    };
}
```

我们来测试一下 Y 组合子是否正常工作，修改 `main` 函数为：

```rust
fn main() {
    let g = |f: &dyn Fn(usize) -> usize, x| match x {
        0 => 1,
        _ => x * f(x - 1),
    };

    let fact = y(g);
    println!("{}", fact(5));    // 将会输出120
}
```

编译，运行，控制台成功输出了120。

### 尝鲜：未稳定的 `Fn` Traits

关于 `Fn` Traits，可以阅读我的另一篇博客 [Rust 中函数与闭包与 Fn Traits 探讨](https://nihil.cc/posts/rust_fn_traits/)，我们可以通过给 `Func` 实现 `Fn` Traits 来模拟函数调用，以省略 `call`。

```rust
// Fn Traits 未稳定，需要使用 feature 引入
#![feature(unboxed_closures, fn_traits)]

struct Func<'a, A, F>(&'a dyn Fn(Func<'a, A, F>, A) -> F);

impl<'a, A, F> Clone for Func<'a, A, F> {
    fn clone(&self) -> Self {
        Self(self.0)
    }
}

impl<'a, A, F> Copy for Func<'a, A, F> {}

// 实现 Fn Traits
impl<'a, A, F> FnOnce<(Func<'a, A, F>, A)> for Func<'a, A, F> {
    type Output = F;
    extern "rust-call" fn call_once(self, (f, x): (Func<'a, A, F>, A)) -> Self::Output {
        (self.0)(f, x)
    }
}

impl<'a, A, F> FnMut<(Func<'a, A, F>, A)> for Func<'a, A, F> {
    extern "rust-call" fn call_mut(&mut self, (f, x): (Func<'a, A, F>, A)) -> Self::Output {
        (self.0)(f, x)
    }
}

impl<'a, A, F> Fn<(Func<'a, A, F>, A)> for Func<'a, A, F> {
    extern "rust-call" fn call(&self, (f, x): (Func<'a, A, F>, A)) -> Self::Output {
        (self.0)(f, x)
    }
}

fn y<A, R>(g: impl Fn(&dyn Fn(A) -> R, A) -> R) -> impl Fn(A) -> R {
    move |x| (|f: Func<A, R>, x| f(f, x))(Func(&|f, x| g(&|x| f(f, x), x)), x)
}

fn main() {
    let g = |f: &dyn Fn(usize) -> usize, x| match x {
        0 => 1,
        _ => x * f(x - 1),
    };
    
    let fact = y(g);
    println!("{}", fact(5));
}
```

## 参考

[如何在Rust中写Y组合子？ - Nugine的回答 - 知乎](https://www.zhihu.com/question/266186457/answer/1062284485)
