// cc.Intersection

/**
 * 节点基类
 * @param {*} x 
 * @param {*} y 
 * @param {*} w 
 * @param {*} h 
 */
var Rect = function Rect(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;

    this.minX = this.x;
    this.midX = this.x + this.width / 2;
    this.maxX = this.x + this.width;

    this.minY = this.y;
    this.midY = this.y + this.height / 2;
    this.maxY = this.y + this.height;

    this.isValid = true;
};

Rect.prototype.rePositon = function rePositon(x, y) {
    this.x = x;
    this.y = y;

    this.minX = this.x;
    this.midX = this.minX + this.width / 2;
    this.maxX = this.minX + this.width;

    this.minY = this.y;
    this.midY = this.minY + this.height / 2;
    this.maxY = this.minY + this.height;
};

Rect.prototype.reSize = function reSize(w, h) {
    this.width = w;
    this.height = h;

    this.midX = this.minX + this.width / 2;
    this.maxX = this.minX + this.width;

    this.midY = this.minY + this.height / 2;
    this.maxY = this.minY + this.height;
};

/**
 * !#zh 测试自身矩形是否与rect矩形相交
 * @method intersect
 * @param {Rect} rect 
 * @return {boolean}
 */
Rect.prototype.intersect = function intersect(rect) {
    return rect.maxX >= this.minX &&
        rect.minX <= this.maxX &&
        rect.maxY >= this.minY &&
        rect.minY <= this.maxY;
};

/**
 * !#zh 测试自身矩形是否包含rect矩形
 * @method contain
 * @param {Rect} rect 
 * @return {boolean}
 */
Rect.prototype.contain = function contain(rect) {
    return this.minX <= rect.maxX &&
        this.maxX >= rect.minX &&
        this.minY <= rect.maxY &&
        this.maxY >= rect.minY;
};

Rect.prototype.destroy = function destroy() {
    this.isValid = false;
};

var collisionTree = function collisionTree(rect, level, parent) {
    this.rect = rect;
    this.level = level ? level : 0;
    this.parent = parent;

    this.nodes = [];
    this.objects = [];
    this.invalid_objects = [];
};

collisionTree.prototype.MAX_OBJECTS = 10;
collisionTree.prototype.MAX_LEVELS = 5;

collisionTree.prototype.isRoot = function isRoot() {
    return !this.parent;
};

// 分裂
collisionTree.prototype.split = function split() {
    if (!this.nodes.length) {
        var x = this.rect.x;
        var y = this.rect.y;
        var w = this.rect.width / 2;
        var h = this.rect.height / 2;
        var l = this.level + 1;
        this.nodes.push(
            new collisionTree(new Rect(x + w, y + h, w, h), l, this),
            new collisionTree(new Rect(x, y + h, w, h), l, this),
            new collisionTree(new Rect(x, y, w, h), l, this),
            new collisionTree(new Rect(x + w, y, w, h), l, this)
        );
    }
};

// 获取树子节点的大小
collisionTree.prototype.getSize = function getSize() {
    var n = 0;
    for (var i = 0; i < this.nodes.length; i++) {
        n += this.nodes[i].getSize();
    }
    return n + this.objects.length;
};

collisionTree.prototype.getIndexs = function getIndexs(rect) {
    if (!this.rect.intersect(rect)) {
        /**
         * 不相交
         */
        return [];
    }

    var rigth = rect.minX >= this.rect.midX,
        left = rect.maxX <= this.rect.midX,
        top = rect.minY >= this.rect.midY,
        bottom = rect.maxY <= this.rect.midY;

    var result = [0, 1, 2, 3];
    if (!left) {
        result.splice(1, 2);
    }
    if (!rigth) {
        result.splice(3, 1);
        result.splice(0, 1);
    }
    if (!top) {
        result.splice(0, 2);
    }
    if (!bottom) {
        result.splice(2, 2);
    }

    return result;
};

collisionTree.prototype.getIndex = function getIndex(rect, checkIsInner) {
    if (checkIsInner && !this.rect.contain(rect)) {
        if (!this.rect.intersect(rect)) {
            /**
             * 不相交
             */
            return -4;
        }
        /**
         * 相交
         */
        return -3;
    }

    var rigth = rect.minX >= this.rect.midX,
        left = rect.maxX <= this.rect.midX,
        top = rect.minY >= this.rect.midY,
        bottom = rect.maxY <= this.rect.midY;

    if (this.nodes.length) {
        if (top) {
            if (rigth) {
                return 0;
            } else if (left) {
                return 1;
            }
        } else if (bottom) {
            if (left) {
                return 2;
            } else if (rigth) {
                return 3;
            }
        }
        /**
         * 不单单属于某一个象限
         */
        return -2;
    }
    /**
     * 自身没有孩子节点，rect属于自身
     */
    return -1;
};

/*****************以下为外部调用***************/

/*
* 插入功能：
*   - 如果当前节点[ 存在 ]子节点，则检查物体到底属于哪个子节点，如果能匹配到子节点，则将该物体插入到该子节点中
*   - 如果当前节点[ 不存在 ]子节点，将该物体存储在当前节点。随后，检查当前节点的存储数量，如果超过了最大存储数量，则对当前节点进行划分，划分完成后，将当前节点存储的物体重新分配到四个子节点中。
*/
collisionTree.prototype.insert = function insert(rect) {
    var index = this.getIndex(rect, true);
    /**
     * index为-4、-3、-2、-1、0、1、2、3时
     *     当index为-3或-4时，并且parent为真，则调用parent的insert方法
     *     当index为-4时，并且parent为假，则将rect添加到invalid_objects里面
     *     当index>=0时，则调用index对象象限的insert方法
     *     当index为-2或-1时，并且parent为假，则将rect添加到objs里面
     */
    if (index <= -3 && this.parent) {
        this.parent.insert(rect);
        return;
    } else if (index === -4) {
        this.invalid_objects.push(rect);
        return;
    } else if (index >= 0) {
        this.nodes[index].insert(rect);
        return;
    }

    var objs = this.objects;
    var nodes = this.nodes;

    // 存储rect
    objs.push(rect);

    // 判断当前rect数量是否超过阈值
    if (!nodes.length && objs.length > this.MAX_OBJECTS && this.level < this.MAX_LEVELS) {
        this.split();
        this.objects = [];
        for (var i = objs.length - 1; i >= 0; i--) {
            index = this.getIndex(objs[i]);
            if (index >= 0) {
                nodes[index].insert(objs[i]);
            } else {
                this.objects.push(objs[i]);
            }
        }
    }
};

/**
 * 刷新
 */
collisionTree.prototype.refresh = function () {
    var objs = this.objects,
        iobjs = this.invalid_objects,
        nodes = this.nodes;

    var i;
    if (this.isRoot() && iobjs.length) {
        this.invalid_objects = [];
        for (i = iobjs.length - 1; i >= 0; i--) {
            if (iobjs[i].isValid) {
                this.insert(iobjs[i]);
            }
        }
    }

    this.objects = [];
    for (i = objs.length - 1; i >= 0; i--) {
        if (objs[i].isValid) {
            this.insert(objs[i]);
        }
    }

    // 递归刷新子树
    for (i = 0; i < nodes.length; i++) {
        nodes[i].refresh();
    }
};

/*
  检索功能：
    给出一个物体对象，该函数负责将该物体可能发生碰撞的所有物体选取出来。该函数先查找物体所属的象限，该象限下的物体都是有可能发生碰撞的，然后再递归地查找子象限...
*/
collisionTree.prototype.getCollisions = function getCollisions(rect) {
    var result = [],
        i, index, indexs;

    index = this.getIndex(rect);
    // rect与自身不想交
    if (index === -4) {
        return result;
        // rect与自身相交
        // rect不单单属于某一个象限
    } else if (index === -3 || index === -2) {
        indexs = this.getIndexs(rect);
        for (i = 0; i < indexs.length; i++) {
            result = result.concat(this.nodes[indexs[i]].getCollisions(rect));
        }
        // 自己没有子节点，rect属于自己
    } else if (index === -1) {

        // rect属于某一象限
    } else {
        result = result.concat(this.nodes[index].getCollisions(rect));
    }

    return result.concat(this.objects);
};