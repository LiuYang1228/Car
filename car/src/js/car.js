// 创建汽车对象
function Car(params) {
    var self = this; // 保存当前上下文的引用
    var car; // 汽车模型
    var mtlLoader = new THREE.MTLLoader(); // 创建 MTLLoader 对象

    // 汽车状态变量
    this.speed = 0;
    this.rSpeed = 0;
    this.run = false;
    this.acceleration = 0.1;
    this.deceleration = 0.04;
    this.maxSpeed = 2;

    this.light = params.light; // 汽车光源
    this.lock = -1; // 锁定状态
    this.isBrake = false; // 是否刹车

    // 旋转相关变量
    this.realRotation = 0; // 真实的旋转
    this.dirRotation = 0; // 方向上的旋转
    this.addRotation = 0; // 累计的旋转角度

    // 左前轮和左后轮位置信息
    this.leftFront = {};
    this.leftBack = {};

    // 加载汽车模型
    mtlLoader.setPath('src/assets/');
    mtlLoader.load('car4.mtl', function(materials) {
        // 加载成功回调
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('src/assets/');
        objLoader.load('car4.obj', function(object) {
            // 加载成功回调
            car = object;
            car.children.forEach(function(item) {
                item.castShadow = true;
            });
            car.position.z = -20;
            car.position.y = -5;

            params.scene.add(car); // 将汽车添加到场景中
            self.car = car; // 保存汽车对象的引用

            params.cb(); // 回调函数

        }, function() {
            console.log('progress'); // 加载进度
        }, function() {
            console.log('error'); // 加载错误
        });
    });

    // 创建左前轮和左后轮对象
    self.frontRightWheel = new Wheel({
        mtl: 'front_wheel.mtl',
        obj: 'front_wheel.obj',
        parent: car,
        offsetX: 2.79475,
        offsetZ: -3.28386
    });

    self.frontLeftWheel = new Wheel({
        mtl: 'front_wheel.mtl',
        obj: 'front_wheel.obj',
        parent: car,
        offsetX: -2.79475,
        offsetZ: -3.28386
    });
}

// 汽车的 tick 函数，用于更新汽车状态
Car.prototype.tick = function() {
    if(this.lock > 0) {
        this.lock--;
        if(this.lock % 2) {
            this.car.visible = false;
        } else {
            this.car.visible = true;
        }
        return ;
    }

    // 更新速度
    if(this.run) {
        this.speed += this.acceleration;
        if(this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
    } else {
        this.speed -= this.deceleration;
        if(this.speed < 0) {
            this.speed = 0;
        }
    }
    var speed = -this.speed;
    if(speed === 0) {
        return ;
    }

    // 更新旋转角度
    var time = Date.now();
    this.dirRotation += this.rSpeed;
    this.realRotation += this.rSpeed;

    var rotation = this.dirRotation;

    // 根据刹车状态更新旋转角度
    if(this.isBrake) {
        this.realRotation += this.rSpeed * (this.speed / 2);
    } else {
        if(this.realRotation !== this.dirRotation) {
            this.dirRotation += (this.realRotation - this.dirRotation) / 20000 * (this.speed) * (time - this.cancelBrakeTime);
        }
    }

    // 根据速度和旋转角度计算位移
    var speedX = Math.sin(rotation) * speed;
    var speedZ = Math.cos(rotation) * speed;

    // 更新光源位置
    var tempX = this.car.position.x + speedX;
    var tempZ = this.car.position.z + speedZ;
    this.light.position.set(-10+tempX, 20, tempZ);
    this.light.shadow.camera.updateProjectionMatrix();

    // 更新左前轮和左后轮位置信息
    var tempA = -(this.car.rotation.y + 0.523);
    this.leftFront.x = Math.sin(tempA) * 8 + tempX;
    this.leftFront.y = Math.cos(tempA) * 8 + tempZ;

    tempA = -(this.car.rotation.y + 2.616);
    this.leftBack.x = Math.sin(tempA) * 8 + tempX;
    this.leftBack.y = Math.cos(tempA) * 8 + tempZ;

    // 处理碰撞
    var collisionSide = this.physical();
    var correctedSpeed;
    if(collisionSide > -1) {
        correctedSpeed = this.collision(speedX, speedZ, collisionSide);

        speedX = correctedSpeed.vx*5;
        speedZ = correctedSpeed.vy*5;

        var angle = Math.atan2(-speedZ, speedX);

        this.realRotation = -1 * (Math.PI / 2 - angle);
        rotation = this.dirRotation = this.realRotation;

        this.speed = 0;
        this.reset();
    }

    // 更新汽车和轮子的旋转和位置
    this.car.rotation.y = this.realRotation;
    this.frontLeftWheel.wrapper.rotation.y = this.realRotation;
    this.frontRightWheel.wrapper.rotation.y = this.realRotation;
    this.frontLeftWheel.wheel.rotation.y = (this.dirRotation - this.realRotation) / 2;
    this.frontRightWheel.wheel.rotation.y = (this.dirRotation - this.realRotation) / 2;

    this.car.position.z += speedZ;
    this.car.position.x += speedX;

    this.frontLeftWheel.wrapper.position.z += speedZ;
    this.frontLeftWheel.wrapper.position.x += speedX;
    this.frontRightWheel.wrapper.position.z += speedZ;
    this.frontRightWheel.wrapper.position.x += speedX;

    // 更新相机位置和旋转
    camera.rotation.y = rotation;
    camera.position.x = this.car.position.x + Math.sin(rotation) * 20;
    camera.position.z = this.car.position.z + Math.cos(rotation) * 20;
};

// 刹车
Car.prototype.brake = function() {
    this.v = 10;
    this.isBrake = true;
};

// 取消刹车
Car.prototype.cancelBrake = function() {
    this.cancelBrakeTime = Date.now();
    this.isBrake = false;
};

// 检测物理碰撞
Car.prototype.physical = function() {
    var i = 0;

    for(; i < outside.length; i += 4) {
        if(isLineSegmentIntr(this.leftFront, this.leftBack, {
            x: outside[i],
            y: outside[i+1]
        }, {
            x: outside[i+2],
            y: outside[i+3]
        })) {
            return i;
        }
    }

    return -1;
};

// 重置状态
Car.prototype.reset = function() {
    this.lock = 60;
};

// 处理碰撞
Car.prototype.collision = function(sx, sz, side) {
    var pos = this.car.position;
    var result = getBounceVector({
        p0: {
            x: pos.x,
            y: pos.z
        },
        p1: {
            x: pos.x + sx,
            y: pos.z + sz
        },
        vx: sx,
        vy: sz
    }, {
        p0: {x: outside[side], y: outside[side+1]},
        p1: {x: outside[side+2], y: outside[side+3]},
        vx: outside[side+2] - outside[side],
        vy: outside[side+3] - outside[side+1]
    });

    return result;
};

// 车轮对象构造函数
function Wheel(params) {
    var mtlLoader = new THREE.MTLLoader();
    var self = this;

    mtlLoader.setPath('src/assets/');
    mtlLoader.load(params.mtl, function(materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('src/assets/');
        objLoader.load(params.obj, function(object) {
            object.children.forEach(function(item) {
                item.castShadow = true;
            });
            var wrapper = new THREE.Object3D();
            wrapper.position.set(0,-5,-20);
            wrapper.add(object);

            object.position.set(params.offsetX, 0, params.offsetZ);

            scene.add(wrapper);
            self.wheel = object;
            self.wrapper = wrapper;

        }, function() {
            console.log('progress');
        }, function() {
            console.log('error');
        });
    });
}

// 判断点是否在直线段上
function isLeft(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) < 0;
}

// 获取反弹向量
function getBounceVector(obj, w) {
    var len = Math.sqrt(w.vx * w.vx + w.vy * w.vy);
    w.dx = w.vx / len;
    w.dy = w.vy / len;

    w.rx = -w.dy;
    w.ry = w.dx;

    w.lx = w.dy;
    w.ly = -w.dx;

    var projw = getProjectVector(obj, w.dx, w.dy);
    var projn;
    var left = isLeft(w.p0, w.p1, obj.p0);

    if(left) {
        projn = getProjectVector(obj, w.rx, w.ry);
    } else {
        projn = getProjectVector(obj, w.lx, w.ly);
    }
    projn.vx *= -0.5;
    projn.vy *= -0.5;

    return {
        vx: projw.vx + projn.vx,
        vy: projw.vy + projn.vy,
    };
}

// 获取投影向量
function getProjectVector(u, dx, dy) {
    var dp = u.vx * dx + u.vy * dy;

    return {
        vx: (dp * dx),
        vy: (dp * dy)
    };
}

// 判断直线段是否相交
function isLineSegmentIntr(a, b, c, d) {
    var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x); 

    var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x); 

    if(area_abc * area_abd > 0) { 
        return false; 
    }

    var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x); 

    var area_cdb = area_cda + area_abc - area_abd ; 
    if(area_cda * area_cdb > 0) { 
        return false; 
    } 

    return true;
}
