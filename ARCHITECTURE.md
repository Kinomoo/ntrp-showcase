# NTRP 網站架構

## 系統總覽
NTRP Site 是以 Next.js 15 與 NextAuth.js 打造的現代網頁應用，整合 Discord OAuth2，提供安全、可擴充的社群管理平台。
### 核心原則
- 安全優先：多層式身分驗證與授權
- 效能：伺服端渲染並最佳化前端注水（hydration）
- 可擴充：模組化架構，支援未來成長
- 開發者體驗：TypeScript、現代化工具、明確的關注點分離

## 技術堆疊
### 前端
- 框架：Next.js 15（App Router + Pages Router 混合）
- 語言：TypeScript 5.8+
- 樣式：Tailwind CSS 4.1+（自訂設計系統）
- 狀態管理：React Context + NextAuth sessions
- UI 元件：自製元件庫，搭配 Framer Motion 動畫

### 後端
- 執行環境：Node.js（Next.js API Routes）
- 認證：NextAuth.js v4（Discord OAuth2 provider）
- 資料庫：PostgreSQL（連線池）
- ORM：以參數化 SQL 查詢為主
- API：RESTful 端點，採 JWT 為基礎的驗證

### 基礎設施
- 部署：PM2 行程管理
- 環境：Production-ready，強制 HTTPS
- 安全：透過中介層設定安全性標頭與 CSRF 保護

## 認證架構
### OAuth2 流程
使用者 → Discord 授權 → NextAuth 回呼 → JWT Token → Session 管理

### 關鍵元件
- NextAuth 設定：主體邏輯在 pages/api/auth/[...nextauth].ts
- Discord 整合：自訂 scope（identify email guilds.members.read）
- 基於角色的存取控制：驗證 Discord 公會成員角色
- Session 管理：JWT token，並擴充使用者權限
### 安全特性
- HTTPS 強制：生產環境自動轉址
- 安全性標頭：XSS 防護、點擊劫持防護
- CSRF 保護：透過 session token 檢查（可設定）
- 輸入驗證：參數化 SQL，避免注入

## 資料架構
### 資料庫設計
- 主要鍵：以 Discord ID 作為唯一識別
- 使用者管理：完整的權限系統（admin、donor、whitelisted）
- 稽核軌跡：管理操作記錄（合規用途）
- 連線池：最佳化資料庫效能
### 資料流
Discord API → 角色驗證 → 權限定義映射 → 資料庫 Upsert → Session 更新

## 應用架構
ntrp-site/
├── app/                    # App Router (Next.js 13+)
│   ├── admin/              # 管理後台路由
│   ├── member/             # 會員限定路由
│   ├── api/                # API 端點
│   └── (main)/             # 主站頁面
├── pages/                  # Pages Router（相容）
│   └── api/auth/           # NextAuth 設定
├── src/
│   ├── components/         # 可重用 UI 元件
│   ├── lib/                # 工具/共用函式
│   └── styles/             # 全域樣式
└── middleware.ts           # 全域中介層
### 元件架構
- 原子化設計：小而專注的元件，職責清晰
- 組合：彈性的元件組合模式
- 狀態管理：以 Context 分享跨頁狀態
- 效能：以 React.memo 降低不必要重繪

## 安全架構
### 多層防護
1.傳輸層：HTTPS 強制與安全性標頭
2.認證層：NextAuth.js + Discord OAuth2
3.授權層：基於角色的存取控制（RBAC）
4.應用層：輸入驗證與清理
5.資料庫層：參數化查詢與連線安全
### 權限系統
interface UserPermissions {
  is_admin: boolean;       // 系統管理權限
  is_donor: boolean;       // 進階/贊助功能
  is_whitelisted: boolean; // 一般成員/白名單
}

## API 架構
### RESTful 設計
- 一致性：標準 HTTP 方法與狀態碼
- 錯誤處理：結構化錯誤回應與適當狀態碼
- 流量控管：內建防濫用機制
- 快取：策略性快取以提升效能
### API 端點
- 公開：伺服器狀態、公開資訊
- 需登入：使用者資料、會員內容
- 管理專用：系統管理、使用者管理

## 前端架構
### 元件階層
App → Layout → Header/Footer → Page Components → Feature Components → UI Components
### 狀態管理策略
- Server State：NextAuth session 與 API 資料
- Client State：UI 互動與表單資料
- 共用狀態：使用者 Context 與應用設定

## 效能架構
### 最佳化策略
- 伺服端渲染：對 SEO 友善的內容傳遞
- 程式碼切割：動態匯入，依路由分包
- 圖片最佳化：Next.js Image，延遲載入
- 束包分析：持續監控 bundle 大小
### 快取策略
- 靜態生成：預先產出頁面
- API 回應快取：常用資料策略性快取
- CDN 整合：全球內容加速

## 開發架構
### 開發流程
1.本機開發：熱重載與 TypeScript 編譯
2.程式品質：ESLint + Next.js 最佳實務
3.測試：元件測試（現代化測試框架）
4.部署：PM2 自動化部署/管理
### 環境管理
- 設定：依環境區分設定
- 機密：安全的憑證管理
- 功能旗標：依環境切換功能