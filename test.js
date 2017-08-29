// 请根据不用的测试环境添加引用
/**
 * collisionTree
 * Rect
 */
var w = 1000,
    h = 500,
    rectsArr = [],
    tree, i;

tree = new collisionTree(new Rect(0, 0, w, h));

// 随机创建
for (i = 0; i < 5000; i++) {
    rectsArr.push(
        new Rect(Math.floor(Math.random() * (w - 20)),
            Math.floor(Math.random() * (h - 20)), 20, 20)
    );
}
// 添加到树
rectsArr.forEach(function (rect) {
    tree.insert(rect);
});

// // 移动
// rectsArr.forEach(function (rect) {
//     rect.rePositon(600, 50);
// });
// // 更新树
// tree.refresh();

console.log('碰撞体:', rectsArr.length, '个');

var m = 0;
console.time('普通');
rectsArr.forEach(function (r) {
    rectsArr.forEach(function (rect) {
        if (rect.intersect(r)) {
            // todo
        }
        m++;
    });
});
console.timeEnd('普通');
console.log('普通:', m, '次');

var n = 0;
console.time('碰撞树');
rectsArr.forEach(function (r) {
    var result = tree.getCollisions(r);
    result.forEach(function (rect) {
        if (rect.intersect(r)) {
            // todo
        }
        n++;
    });
});
console.timeEnd('碰撞树');
console.log('碰撞树:', n, '次');

console.log('运算次数减少:', (1 - n / m) * 100, '%');