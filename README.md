# README

1. Fork main 分支到自己的 GitHub
2. git clone 到本地端

## 初始化
### Initialize
```
npm install
```

### 設定資料庫
需要與 config/config.json 一致

```
// 到 MySQL 去建立資料庫
create database forum;
```

### 執行測試
```
npm run test
```

## 共用帳號
請一律設定下面 2 組帳號以利驗收：
* 第一組帳號有 admin 權限：
  * email: root@example.com
  * password: 12345678
* 第二、三組帳號沒有 admin 權限：
  * email: user1@example.com
  * password: 12345678

  * email: user2@example.com
  * password: 12345678

## 功能介紹
