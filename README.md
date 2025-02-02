# 关于
本项目为Milk编写, **Fork** 或者二次创作请备注原作者仓库地址! 感谢您的使用和理解

# 使用方式
## 网页部署
1. 在服务器上Clone本项目
```bash
git clone https://github.com/Michaelwucoc/account-copier.git
```
2. 设置index.html为默认文档
## 代理服务器部署
由于MoJang对其API进行CORS相关限制，您需要安装Node并部署代理服务器。
1. 在服务器上Clone本项目
```bash
git clone https://github.com/Michaelwucoc/account-copier.git
```
2. 修改server.js文件
```js
app.use(cors({
    origin: ['https://你自己的API域名', 'http://localhost:3000'],
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Accept']
}));
```
3. 输入npm start启动服务器

有任何问题可以Issue哦~