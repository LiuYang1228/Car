# 项目简介
本项目是用three.js创建的3D赛车游戏模型，游戏场景里有赛道和小车模型。该项目玩家可以通过键盘“W A S D”来控制小车前进，左移和右移。目的：玩家能够控制小车，体验赛车游戏的魅力。
组内成员：
210812037黎萱 1.结构搭建  2.汇总代码
210812037王曼妮 1.场景搭建 2.文档书写
210812039杨晶 1.动画实现 2.文档整理

# 如何运行
1.npm init -y  
2.npm install lite-server --save-dev 
3.npm install 
4.npm install -y 
5.npm run dev


# 功能特点
1.汽车模型加载：使用Three.js进行渲染和贴图，实现汽车模型。
2.汽车运动模拟：用户控制键盘方向键，模拟汽车的加速、减速、转向等行为。
3.动态调整光照：根据汽车的位置动态调整光源的位置，以实现阴影效果。
4.异步加载：利用异步加载模型和材质，避免了页面卡顿。


# 目录结构
Car/
│
├── node_modules/           # node模块文件
├── src/                    # 源代码
│   ├── blog/               # 贴图
│   ├── js/                 # 配置文件
│   ├── main.js             # 入口文件
├── index.html              # 入口HTML文件
├── package-lock.json       # 项目配置信息
├── package.json            # 项目配置信息
├── README.md               # 项目说明文件


# 技术栈
1.Three.js
2.HTML/CSS
3.JavaScript 