// 创建一个场景
var scene = new THREE.Scene();

// 创建一个透视相机
var camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 0.1, 1000);

// 设置相机的位置
camera.position.z = 0;
camera.position.x = 0;
camera.speed = {
    z: 0,
    x: 0
};

// 创建一个 WebGL 渲染器
var webGLRenderer = new THREE.WebGLRenderer();

// 设置像素比例
webGLRenderer.setPixelRatio(window.devicePixelRatio);

// 设置渲染器大小
webGLRenderer.setSize(window.innerWidth, window.innerHeight);

// 设置背景颜色
webGLRenderer.setClearColor(0x0077ec, 1);

// 启用阴影
webGLRenderer.shadowMap.enabled = true;

// 设置阴影类型
webGLRenderer.shadowMap.type = THREE.PCFShadowMap;

// 创建一个点光源
var pointLight = new THREE.PointLight(0xccbbaa, 1, 0, 0);
pointLight.position.set(-10, 20, -20);
pointLight.castShadow = true;

// 将点光源添加到场景中
scene.add(pointLight);

// 创建一个环境光源
var light = new THREE.AmbientLight(0xccbbaa, 0.1);

// 将环境光源添加到场景中
scene.add(light);

// 将渲染器的 DOM 元素添加到页面中
document.body.appendChild(webGLRenderer.domElement);

// 创建一个地面对象
function Ground() {
    // 创建材质
    var meshBasicMaterial = new THREE.MeshLambertMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide
    });

    // 创建 OBJLoader 对象
    var objLoader = new THREE.OBJLoader();

    // 设置 OBJ 文件的路径
    objLoader.setPath('src/assets/');

    // 加载 OBJ 文件
    objLoader.load('ground.obj', function(object) {
        // 设置接收阴影
        object.children.forEach(function(item) {
            item.receiveShadow = true;
        });

        // 设置位置
        object.position.y = -5;

        // 将对象添加到场景中
        scene.add(object);
    }, function() {
        console.log('progress'); // 加载进度
    }, function() {
        console.log('error'); // 加载错误
    });
}

// 监听键盘按下事件
document.body.addEventListener('keydown', function(e) {
    // 根据按键设置汽车状态
    switch(e.keyCode) {
        case 87: // w
            car.run = true;
            break;
        case 65: // a
            car.rSpeed = 0.02;
            break;
        case 68: // d
            car.rSpeed = -0.02;
            break;
        case 32: // space
            car.brake();
            break;
    }
});

// 监听键盘抬起事件
document.body.addEventListener('keyup', function(e) {
    // 根据按键设置汽车状态
    switch(e.keyCode) {
        case 87: // w
            car.run = false;
            break;
        case 65: // a
            car.rSpeed = 0;
            break;
        case 68: // d
            car.rSpeed = 0;
            break;
        case 32: // space
            car.cancelBrake();
            break;
    }
});

// 创建汽车对象
var car = new Car({
    scene: scene,
    cb: start,
    light: pointLight
});

var ground;

// 开始函数
function start() {
    ground = new Ground({
        scene: scene
    });

    // 渲染场景
    render();
}

// 渲染函数
function render() {
    car.tick();

    // 请求下一帧动画
    requestAnimationFrame(render);

    // 渲染场景
    webGLRenderer.render(scene, camera);
}
