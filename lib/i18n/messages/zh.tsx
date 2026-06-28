/* eslint-disable react/jsx-key */
// 繁體中文（香港用法）訊息目錄。結構必須與 en.tsx 完全一致
// （以 `satisfies Messages` 強制檢查）。
//
// 詞彙規範（與後端報告一致）：
//   Hypothesis = 假設 · Falsification condition = 證偽條件
//   Diagnostic axes = 診斷軸 · Bull / Base / Bear 保留英文
//   工具名稱（start_draft、design_leaves…）、H-0、MCP 等技術詞保留英文。

import type { Messages } from "./en";

const zh = {
  common: {
    brand: "Drawtree",
    backToHome: "← Drawtree",
    backToDrawTree: "← Draw Tree",
    backToAccount: "← 我的帳戶",
    back: "← 返回",
    myAccount: "我的帳戶",
    signOut: "登出",
    loading: "載入中…",
    copy: "複製",
    copied: "✓ 已複製",
    copyUrl: "複製 URL",
    cancel: "取消",
    edit: "編輯",
    saving: "儲存中…",
    dateLocale: "zh-HK",
  },

  langSwitcher: {
    label: "語言",
    en: "EN",
    zh: "中文",
  },

  home: {
    tagline:
      "每個投資論點都是一棵樹。每項主張都有證偽條件。每個判定都經簽署、加上時間戳，並可被質疑。為 AI 原生股票研究而設的傳輸協議。",
    signUpFree: "免費註冊",
    setupGuide: "設定指南 →",
    myAccount: "我的帳戶",
    protocol: "協議 v0.3",
    health: "系統狀態",
    whatYouGet: "你會得到甚麼",
    bullets: [
      "一個 MCP 伺服器，與你常用的 AI 客戶端（Perplexity、Claude Desktop、任何 Remote-MCP 主機）共同設計可證偽的假設樹。",
      "164 套策略框架連同原典全文索引 — AI 以真實文獻為根據設計葉節點，而非泛泛提問。",
      "即時同業股價數據、三情境同業估值、每週自動監測連判定提示。",
      "註冊即送 50 個免費 credits — 足以完整發佈你的第一棵樹。毋須信用卡。已提交的樹只屬於你，預設私密。",
    ],
    privacyNote: "所有已提交的樹預設私密。不設任何公開的用戶或樹目錄。",
    footer: (
      <>
        drawtree.capital · 結構化股票研究方法論 · 已發佈的樹以內容尋址、只增不改 ·{" "}
      </>
    ),
    seeProtocol: "查看協議",
  },

  signup: {
    title: "註冊",
    intro: (
      <>
        一分鐘內取得你的 API key。首次以電郵註冊即送{" "}
        <strong>50 個免費 credits</strong> — 足以完整發佈你的第一棵樹（Phase 2
        套餐正好需要 50 credits）。
      </>
    ),
    emailLabel: "電郵",
    emailPlaceholder: "you@example.com",
    displayNameLabel: "顯示名稱（可選）",
    displayNamePlaceholder: "留空則使用電郵前綴",
    createAccount: "建立我的帳戶",
    creating: "建立中…",
    legal:
      "註冊即表示你同意 drawtree 屬結構化研究方法論軟件，並非受監管的投資建議。你的 API key 只屬於你，請勿與他人分享。我們不要求電郵驗證；同一電郵只可領取一次免費 credits。",
    emailExists: "此電郵已有帳戶。請改以電郵登入。",
    signupFailed: "註冊失敗",
    networkError: "網絡錯誤",
    welcome: "歡迎。",
    accountReady: (
      <>
        你的帳戶已準備好。<strong>請立即複製你的 API key</strong> —
        之後不會再顯示。
      </>
    ),
    apiKey: "API key",
    copyApiKey: "複製 API key",
    handle: "帳戶代號",
    startingBalance: "初始結餘",
    credits: (n: number) => `${n} credits`,
    mcpServerUrl: "MCP 伺服器 URL",
    connectPerplexity: "連接 Perplexity",
    perplexitySteps: [
      <>Settings → Connectors → + Custom → Remote</>,
      <>MCP URL：見上方</>,
      <>驗證方式：API Key</>,
      <>
        Header 名稱：<code>Authorization</code>
      </>,
      <>
        值：<code>Bearer</code> + 你的 key
      </>,
    ],
    bearerFallback: (
      <>
        如連接器介面不接受 <code>Bearer </code> 前綴，請改用 header 名稱{" "}
        <code>api-key</code>，並直接填入 key 本身。
      </>
    ),
    continueToSetup: "前往設定指南 →",
    openMyAccount: "開啟我的帳戶",
    tip: (
      <>
        <strong>提示：</strong>請把 API key 存入密碼管理器。如不慎遺失，可在帳戶頁重新生成
        — 舊 key 會即時失效。
      </>
    ),
  },

  signin: {
    invalidEmail: "請輸入有效的電郵地址。",
    notRegisteredStart: "此電郵尚未註冊。請先在下方註冊。",
    notRegisteredConsent: "此電郵尚未註冊。請先到 drawtree.capital/signup 註冊。",
    codeIs6Digits: "驗證碼為 6 位數字。",
    codeMismatch: "驗證碼不符。請查看最新一封電郵。",
    codeUsed: "此驗證碼已被使用。請重新索取。",
    codeExpired: "此驗證碼已過期。請重新索取。",
    codeFormat: "驗證碼必須為 6 位數字。",
    signInFailed: (status: number | string) => `登入失敗（${status}）。`,
    networkSend: "傳送驗證碼時發生網絡錯誤。",
    networkVerify: "驗證時發生網絡錯誤。",
    emailMeCode: "電郵驗證碼給我",
    sending: "傳送中…",
    verifying: "驗證中…",
    signIn: "登入",
    changeEmail: "← 更改電郵",
    resendCode: "重發驗證碼",
    codeSentTo: (email: React.ReactNode) => (
      <>
        驗證碼已傳送至 <strong className="text-ink">{email}</strong>。請查收。
      </>
    ),
    codePlaceholder: "123 456",
  },

  account: {
    signInTitle: "登入",
    signInIntro:
      "輸入你的電郵，我們會寄出 6 位數字驗證碼（連同後備登入連結）。毋須密碼。",
    signingIn: "正在為你登入…",
    codeSentLong: (email: React.ReactNode) => (
      <>
        驗證碼已傳送至 <strong className="text-ink">{email}</strong>
        。請查收（包括垃圾郵件夾）。在下方輸入 6 位數字，或點按電郵內的後備連結。
      </>
    ),
    linkExpired: "登入連結已過期。請重新索取。",
    linkUsed: "此登入連結已被使用。請重新索取。",
    linkInvalid: "此登入連結無效。請重新索取。",
    linkFailed: "登入失敗。請重新索取連結。",
    sendFailed: "無法傳送連結。請稍後再試。",
    networkError: (detail: string) => `網絡錯誤（${detail}）。`,
    ifRegistered: "如該電郵已註冊，驗證碼已在路上。請查收（包括垃圾郵件夾）。",
    devModeNotice: "電郵發送服務尚未設定 — 請使用下方的連結或驗證碼。",
    devModeCode: "開發模式驗證碼：",
    newHere: "新用戶？",
    createAccount: "建立帳戶",
    haveKey: "已有 API key？",
    useItInstead: "改用 key 登入",
    keyStaysInBrowser: "你的 key 只保留在此瀏覽器 — 不會儲存到伺服器。",
    title: "我的帳戶",
    lookupFailed: (detail: string) => `查詢失敗（${detail}）`,
    topupPending: "已收到付款。正在為帳戶加入 credits — 通常只需幾秒。",
    topupCancelled: "付款已取消。沒有任何收費，帳戶不變。",
    topupDelayed:
      "你的付款已確認，但 credits 尚未到帳。請一分鐘後重新整理。如仍未更新，請電郵 support@drawtree.capital。",
    topupCredited: (credited: number, balance: number) =>
      `已加入 ${credited} credits。最新結餘為 ${balance}。`,
    holdsReleased: (n: number) =>
      `已釋放 ${n} 筆卡住的暫扣。可用 credits 已恢復。`,
    noStuckHolds: "沒有發現卡住的暫扣。",
    releaseFailed: "釋放失敗",
    topupFailed: "增值失敗",
    regenerateConfirm: "確定要重新生成 API key？目前的 key 會即時失效。",
    regenerateFailed: "重新生成失敗",
    newKeyTitle: "你的 API key — 請立即複製",
    newKeyNote:
      "此 key 只會顯示這一次。連接 MCP 客戶端時需要用到。如不慎遺失，請再次以電郵登入取得新的 key。",
    balance: "結餘",
    availableCredits: "可用 credits",
    totalBalance: (balance: number, held: number) =>
      `總結餘 ${balance}${held > 0 ? ` · 暫扣 ${held}` : ""}`,
    topupButton: (usd: string, credits: number) => `+ $${usd}（${credits} credits）`,
    conversion: "$1 美元 = 10 credits。",
    connectTitle: "把 Draw Tree 連接到你的 AI",
    connectNote:
      "在 ChatGPT、Claude.ai、Perplexity、Claude Code、Codex 或 Claude Desktop 安裝 MCP 伺服器。設定指南會逐步教你完成。",
    openSetupGuide: "開啟設定指南 →",
    workspace: "我的工作區",
    workspaceCounts: (drafts: number, trees: number) =>
      `${drafts} 份草稿 · ${trees} 棵樹`,
    noWorkYet:
      "尚未有任何研究。先設定好 Draw Tree MCP 連接器，再跟你的 AI 客戶端對話開始建立新樹。",
    draftsInProgress: "進行中的草稿",
    nextLabel: "下一步：",
    view: "查看 →",
    resumeNote:
      "要繼續任何草稿，只需請你的 AI 客戶端接續相關股票代號。下一個要呼叫的工具已顯示在上方。",
    committedTrees: "已提交的樹",
    verdictLabel: (v: string) => `判定：${v}`,
    noVerdictYet: "尚無判定",
    accountDetails: "帳戶資料",
    email: "電郵",
    handle: "帳戶代號",
    displayName: "顯示名稱",
    releaseTitle: "釋放卡住的 credits",
    releaseNote:
      "如 credits 顯示為「暫扣」但沒有任何工作執行中（例如工具中途當掉），此操作會把所有超過 5 分鐘的待定暫扣退回可用結餘。",
    releaseButton: "釋放卡住的 credits",
    rotateTitle: "更換 API key",
    rotateNote: "如懷疑 key 已外洩可使用。目前的 key 會即時失效。",
    rotateButton: "重新生成 key",
  },

  consent: {
    loadingRequest: "正在載入授權請求…",
    checkingSignIn: "正在檢查登入狀態…",
    missingParams: "此授權請求缺少必要參數。請從你的 AI 客戶端重新發起連接。",
    authorizeConnection: "授權連接",
    signInToApprove: (client: string) => `登入以批准 ${client}`,
    signInNote: "我們會電郵 6 位數字驗證碼給你。在此輸入即可，毋須離開此批准頁面。",
    emailLabel: "電郵",
    emailMe6Digit: "電郵 6 位數字驗證碼給我",
    codeSent: (email: React.ReactNode) => (
      <>
        驗證碼已傳送至 <strong className="text-ink">{email}</strong>
        。請在收件箱（及垃圾郵件夾）查找 6 位數字驗證碼。
      </>
    ),
    codeLabel: "6 位數字驗證碼",
    signInContinue: "登入並繼續",
    defaultClientName: "一個 MCP 客戶端",
    wantsAccess: (client: string) => `${client} 想存取你的 Draw Tree 帳戶`,
    signedInAs: (email: React.ReactNode) => (
      <>
        已以 <strong className="text-ink">{email}</strong> 登入。不是你？{" "}
      </>
    ),
    requestedPermissions: "請求的權限",
    noScopes: (
      <>
        客戶端沒有指明任何權限。我們會預設授予 <code>drawtree:read</code>。
      </>
    ),
    scopes: {
      read: {
        label: "讀取你的樹",
        tagline: "瀏覽已提交的樹，查看判定、信心水平及情境價格。",
      },
      write: {
        label: "建立及編輯草稿",
        tagline:
          "開立新研究草稿、儲存框架及葉節點、提交樹，以及啟動 Phase 2 研究（需消耗 credits）。",
      },
      monitor: {
        label: "更改監測頻率",
        tagline: "為已提交的樹設定每週／每日／關閉。會產生經常性 credits 費用。",
      },
    },
    revokeNote: <>你可隨時於 </>,
    keyUnaffected: (
      <>
        {" "}撤銷此連接。你現有的 MCP API key（<code>dt_</code>）不受影響。
      </>
    ),
    pickOne: "請至少選擇一項權限，或點按「拒絕」取消。",
    approvalFailed: (status: number) => `批准失敗（${status}）。`,
    approvalNetwork: "批准過程中發生網絡錯誤。",
    approve: "批准",
    approving: "批准中…",
    deny: "拒絕",
  },

  start: {
    title: "把 Draw Tree 連接到你的 AI",
    intro: (
      <>
        三個步驟：選擇你的 AI 客戶端，貼上兩項設定，分析你的第一隻股票。新帳戶即送{" "}
        <strong>50 個免費 credits</strong> — 足以完整發佈你的第一棵樹。
      </>
    ),
    step1Title: "登入或建立帳戶",
    signedInBadge: "✓ 已登入",
    signedInAs: (email: React.ReactNode) => (
      <>
        已以 <strong className="text-ink">{email}</strong> 登入。{" "}
      </>
    ),
    keyShownBelow: "你的 MCP API key 已顯示在下方步驟 2。 ",
    generateBelow: "請在下方步驟 2 生成或貼上你的 API key。 ",
    manageAccount: "管理帳戶 →",
    haveAccountPrompt: <>已有帳戶？輸入電郵，我們會寄出 6 位數字驗證碼。新用戶？ </>,
    signUpFree: "免費註冊 →",

    step2Title: "你的 API key",
    readyToPaste: "✓ 可貼到下方",
    step2Intro: (
      <>
        每個 Draw Tree 安裝 — 無論 OAuth 或 API key、網頁版或 CLI —
        都繫於你帳戶的一條 <code>dt_</code> key。可貼上現有的，或生成新的。
        我們絕不會把它存入你的瀏覽器；請直接複製到你的密碼管理器。
      </>
    ),
    freshKeyTitle: "✨ 新 API key — 請立即保存",
    savedIt: "我已保存 ✓",
    hide: "🔒 隱藏",
    reveal: "👁 顯示",
    freshKeyNote: (
      <>
        這是此 key <strong>唯一一次</strong>顯示。請立即複製到你的密碼管理器
        （1Password、Bitwarden、Apple 鑰匙圈…）。重新整理頁面或點按
        <em>「我已保存」</em>之後，便只能重新生成（舊 key 會隨之失效）。
      </>
    ),
    activeKeyTitle: "使用中的 API key（只限此分頁）",
    useDifferentKey: "改用另一條 key",
    pastedKeyNote:
      "此 key 會自動填入下方的安裝片段。不會被儲存 — 下次請重新貼上，或使用密碼管理器自動填入。",
    haveYourKey: "已有 key？",
    pasteFromManager:
      "從密碼管理器（或「Welcome to Draw Tree」電郵）貼上。只保留在此分頁。",
    useThisKey: "使用此 key",
    lostKeyTitle: "遺失了 key，或首次設定？",
    generateNote: (
      <>
        生成一條新 key。此操作會令<strong>舊 key 即時失效</strong> —
        所有仍在使用舊 key 的 AI 客戶端會停止運作，直至你更新為止。
      </>
    ),
    generateButton: "生成新 API key",
    generating: "生成中…",
    signInToGenerate: "想生成新 key？請先在上方步驟 1 登入。",
    keysStartWith: "Key 以 dt_ 開頭",
    networkError: "網絡錯誤。",
    failed: (status: number) => `失敗（${status}）。`,
    regenerateConfirm:
      "此操作會發出一條全新的 API key，舊 key 會即時失效。所有現有的 CLI 安裝（Claude Code、Codex、Claude Desktop）都需要重新設定新 key。是否繼續？",

    step3Title: "在你的 AI 安裝 Draw Tree",
    step3Intro: (
      <>
        選擇你想使用 Draw Tree 的地方。網頁客戶端使用 <strong>OAuth</strong>
        （一鍵登入）；CLI 客戶端則直接使用你的 API key。
      </>
    ),
    taglines: {
      chatgpt: "網頁 · OAuth",
      claude_ai: "網頁 · OAuth",
      perplexity: "網頁 · OAuth 或 API key",
      claude_code: "終端機 · 一行指令",
      codex: "終端機 · 設定檔",
      claude_desktop: "JSON 設定",
    },
    bannerPerplexity: (
      <>
        <strong className="text-ink">Perplexity</strong> 同時支援{" "}
        <strong>OAuth 及 API key</strong> 驗證。API key 較簡單 —
        從上方步驟 2 取得 key，貼入連接器對話框即可。共用／團隊帳戶則較適合 OAuth。
      </>
    ),
    bannerOAuth: (client: string) => (
      <>
        <strong className="text-ink">{client}</strong> 使用{" "}
        <strong>OAuth</strong>。毋須複製 API key — 會以彈出視窗完成登入。
      </>
    ),
    bannerApiKeyWithKey: (client: string, keyPrefix: React.ReactNode, fresh: boolean) => (
      <>
        <strong className="text-ink">{client}</strong> 使用你的{" "}
        <strong>API key</strong>（來自上方步驟 2 —{" "}
        <span className="font-mono">{keyPrefix}</span>
        {fresh && <span className="ml-2 text-emerald-700">✨ 剛剛生成</span>}
        ）。
      </>
    ),
    bannerApiKeyNoKey: (client: string) => (
      <>
        <strong className="text-ink">{client}</strong> 使用你的{" "}
        <strong>API key</strong> — 請回到上方步驟 2 貼上或生成，再按下方片段操作。
      </>
    ),
    chatgptSteps: (mcpUrl: React.ReactNode) => [
      <>
        在 ChatGPT：<strong>Settings → Connectors → Advanced</strong>，開啟{" "}
        <strong>Developer Mode</strong>（只限 Plus / Pro / Team / Edu）。
      </>,
      <>
        <strong>Settings → Connectors → + Create connector</strong>
      </>,
      <>
        名稱：<code>Drawtree</code>
      </>,
      <>MCP 伺服器 URL：{mcpUrl}</>,
      <>
        驗證方式：<strong>OAuth</strong>（自動偵測）。Client ID 和 Client Secret
        留空。
      </>,
      <>
        勾選 <em>I trust this application</em> → Create。
      </>,
      <>
        彈出視窗會開啟 drawtree.capital — 輸入電郵及電郵內的 6 位數字驗證碼 →
        批准。ChatGPT 隨即啟用連接器。
      </>,
    ],
    claudeAiSteps: (mcpUrl: React.ReactNode) => [
      <>
        在 Claude.ai：<strong>Customize → Connectors → + Add custom connector</strong>
      </>,
      <>
        名稱：<code>Drawtree</code>
      </>,
      <>Remote MCP 伺服器 URL：{mcpUrl}</>,
      <>
        <strong>OAuth Client ID</strong> 和 <strong>OAuth Client Secret</strong>{" "}
        留空。
      </>,
      <>
        點按 <strong>Add</strong>。
      </>,
      <>
        彈出視窗會開啟 drawtree.capital — 輸入電郵及電郵內的 6 位數字驗證碼 →
        批准。
      </>,
    ],
    perplexityHeadsUp: (
      <>
        留意：Perplexity 的自訂連接器同時支援 <strong>API key 及 OAuth</strong>{" "}
        驗證。在下方選擇合適的一種。
      </>
    ),
    perplexityCommonSteps: (mcpUrl: React.ReactNode) => [
      <>
        Perplexity：<strong>Settings → Connectors → + Custom connector</strong>
      </>,
      <>
        名稱：<code>Drawtree</code>
      </>,
      <>MCP 伺服器 URL：{mcpUrl}</>,
      <>
        傳輸方式：<code>Streamable HTTP</code>
      </>,
      <>從下方兩種驗證方式選一。</>,
    ],
    perplexityOptionA: "→ 方法 A — API key（最簡單，建議）",
    perplexityOptA1: (
      <>
        驗證方式：<code>API Key</code>
      </>
    ),
    perplexityOptA2WithKey: (keyPrefix: React.ReactNode) => (
      <>
        API key：貼上你的 <code className="text-[11px]">{keyPrefix}</code>
        （來自上方步驟 2）
      </>
    ),
    perplexityOptA2NoKey: (
      <>
        API key：貼上你的 <code>dt_</code> key（回到上方步驟 2 貼上或生成後，
        複製到此）
      </>
    ),
    perplexityOptA3: (
      <>
        勾選風險確認 → <strong>Add</strong>。完成。
      </>
    ),
    perplexityOptANote:
      "你的 key 不會離開 Perplexity — 每次 MCP 呼叫均以 Bearer header 傳送。沒有彈出視窗，毋須 OAuth 流程。",
    perplexityOptionB: "→ 方法 B — OAuth（按用戶授權，毋須共用 key）",
    perplexityOptB1: (
      <>
        驗證方式：<strong>OAuth</strong>
      </>
    ),
    perplexityOptB2NoClient: "（用下方按鈕生成 — 只需一下）",
    perplexityOptB2Label: "Client ID：",
    perplexityOptB3: (
      <>
        Client Secret：<code>none-required</code>（佔位值 — 我們使用
        PKCE，沒有真正的 secret）
      </>
    ),
    perplexityOptB4: (
      <>
        勾選風險確認 → <strong>Add</strong>。在開啟 drawtree.capital
        的彈出視窗內批准。
      </>
    ),
    perplexityOptBNote:
      "較適合共用／團隊帳戶，因為每個工作階段都以電郵登入 — 沒有長期憑證可外洩。",
    claudeCodeRun: "在終端機執行：",
    claudeCodeRestart: (
      <>重啟 Claude Code，然後輸入「List my drawtree tools」。</>
    ),
    codexIntro: (
      <>
        先匯出你的 key，再在 <code>~/.codex/config.toml</code> 加入 MCP 設定：
      </>
    ),
    codexSnippetComment1: "# 1. 把 key 存為環境變數",
    codexSnippetComment2: "# 2. 加到 ~/.codex/config.toml",
    codexAfter: (
      <>
        在新終端機執行 <code>codex</code> — drawtree 工具會自動出現。
      </>
    ),
    claudeDesktopIntro: (
      <>
        開啟 <strong>Settings → Developer → Edit Config</strong>，然後貼上：
      </>
    ),
    claudeDesktopAfter:
      "儲存並重啟 Claude Desktop。drawtree 圖示會出現在訊息列。",
    mintIntro: (
      <>
        Perplexity 會要求你貼上 Client ID。立即生成一個 —
        它會登記在你的帳戶之下，日後可在 <code>/account</code> 撤銷。
      </>
    ),
    mintButton: "生成 Client ID",
    minting: "生成中…",
    yourClientId: "你的 Client ID（貼入 Perplexity）：",
    mcpUrlLabel: "MCP 伺服器 URL：",

    step4Title: "安裝 Draw Tree skill",
    step4Intro: (
      <>
        Skill 會教你的 AI <em>如何</em>正確執行 Draw Tree 工作流程
        （入口確認、Phase 1 各階段、Phase 2 深度研究等）。
        每個客戶端各有安裝方法 — 在下方選擇你的。
      </>
    ),
    skillChatgptIntro: (
      <>ChatGPT 消費者版尚未有 skill／plugin 機制。請改用以下其中一種：</>
    ),
    skillChatgptOpt1: (
      <>
        <strong className="text-ink">Custom GPT（建議）。</strong>ChatGPT →
        Explore GPTs → Create → Configure → 把原始指示（見下方可展開部分）貼入{" "}
        <em>Instructions</em> 欄。儲存。開啟你的 custom GPT — drawtree
        連接器和工作流程規則便會同時生效。
      </>
    ),
    skillChatgptOpt2: (
      <>
        <strong className="text-ink">Project instructions。</strong>ChatGPT
        Projects → New project → 把下方原始文字設為 Project
        instructions。該 project 內每個對話都會繼承。
      </>
    ),
    skillClaudeAiIntro: "把 skill ZIP 上傳到 Claude.ai（Anthropic Skills 格式）。",
    skillClaudeAiSteps: [
      <>
        在下方下載 skill 套件 — 是一個包含 <code>drawtree/SKILL.md</code> 的 ZIP。
      </>,
      <>
        Claude.ai → <strong>Settings → Capabilities → Skills → Upload Skill</strong>。
      </>,
      <>選擇該 ZIP，然後開啟 skill。</>,
      <>開啟對話。只要提及股票代號或說「drawtree」，skill 便會自動啟用。</>,
    ],
    skillPerplexityIntro:
      "把起始提示存為 Perplexity skill，之後只要提及股票代號便會自動啟用。",
    skillPerplexityStep1: "在下方下載 skill 的 .md 或 .zip。",
    skillPerplexityStep2: (link: React.ReactNode) => (
      <>
        開啟 {link} → <strong>+ Create skill</strong> → <strong>Upload a skill</strong>。
      </>
    ),
    skillPerplexityStep3: "附加檔案。skill 即時生效。",
    skillClaudeCodeIntro: (
      <>
        Claude Code 的沙盒預設封鎖對外網絡連線，所以在 Claude 內用{" "}
        <code>curl</code> 連到 <code>drawtree.capital</code> 不會成功。最順暢的做法是
        <strong>先在瀏覽器下載，再請 Claude 安裝</strong> —
        瀏覽器下載不受沙盒限制，Claude 只需寫入本機檔案。
      </>
    ),
    recommendedTwoClicks: "✨ 建議 — 兩下完成",
    skillClaudeCodeStep1: (
      <>
        點按下方 <strong>下載 SKILL.md</strong>。
      </>
    ),
    skillClaudeCodeStep2:
      "在 Claude Code 貼上下方一行提示並按 Enter。Claude 會替你安裝。",
    skillClaudeCodePastePrompt:
      "Install the Draw Tree skill: create the folder ~/.claude/skills/drawtree and move ~/Downloads/SKILL.md into it.",
    skillClaudeCodeVerify: (
      <>
        Claude 表示完成後，在 Claude Code 執行 <code>/skills</code>{" "}
        驗證，或直接說「use the drawtree skill…」。
      </>
    ),
    preferTerminal: "想在自己的終端機執行？ →",
    skillClaudeCodeManual: (
      <>
        在你的<strong>一般終端機</strong>（不是 Claude Code 內）執行 —
        你的 shell 有完整網絡權限：
      </>
    ),
    copyCommand: "複製指令",
    skillCodexIntro: (
      <>
        Codex CLI 會自動載入 Codex 主目錄或任何專案根目錄的{" "}
        <code>AGENTS.md</code>。與 Claude Code 相同 — 沙盒內的 AI 無法連到{" "}
        <code>drawtree.capital</code>，請先在瀏覽器下載，再請 Codex 安裝。
      </>
    ),
    skillCodexStep1: (
      <>
        點按下方 <strong>下載 AGENTS.md</strong>。
      </>
    ),
    skillCodexStep2:
      "在 Codex 貼上下方一行提示並按 Enter。Codex 會替你安裝。",
    skillCodexPastePrompt:
      "Install the Draw Tree agent instructions: create the folder ~/.codex and move ~/Downloads/AGENTS.md into it.",
    skillCodexVerify:
      "之後開新的 Codex 工作階段 — 新的 AGENTS.md 會在開始時載入。",
    preferTerminalShort: "想用自己的終端機？ →",
    skillCodexManual:
      "在你的一般 shell（不是 Codex 內）執行，網絡不受限制：",
    skillCodexPerProject: (
      <>
        按專案安裝的另一做法：把同一檔案放在{" "}
        <code>&lt;project-root&gt;/AGENTS.md</code> — Codex
        會自動合併全域及專案設定。
      </>
    ),
    skillClaudeDesktopIntro:
      "與 Claude.ai 同樣使用 Anthropic Skills 格式 — 在 Settings 上傳 ZIP。",
    skillClaudeDesktopSteps: [
      <>在下方下載 skill 套件。</>,
      <>
        Claude Desktop →{" "}
        <strong>Settings → Capabilities → Skills → Upload Skill</strong>。
      </>,
      <>選擇該 ZIP，然後開啟 skill。</>,
    ],
    downloadSkillMd: "下載 SKILL.md",
    downloadSkillZip: "下載 drawtree-skill.zip",
    downloadAgentsMd: "下載 AGENTS.md",
    rawInstructionsSummary: "顯示原始指示（適用於沒有 skill 機制的客戶端）",
    copyRawInstructions: "複製原始指示",
    afterInstalling: (
      <>
        <strong className="text-ink">安裝完成後：</strong>在 AI
        客戶端開新對話，直接說<em>「我想分析 NVDA」</em>（或任何股票代號）。skill
        會自動啟用，帶你完成 Phase 1 → Phase 2。
      </>
    ),

    pricingTitle: "Credits 一覽",
    pricingIntro:
      "$1 美元 = 10 credits。Phase 1 框架設計永遠免費。Phase 2 深度研究為一次性 50 credits 套餐。每週監測每次 5 credits。",
    firstTree: "第一棵樹（典型）",
    firstTreeItems: [
      <>Phase 1（框架設計）— 免費</>,
      <>Phase 2（研究 + 提交）— 一律 50 cr</>,
      <>首週監測 — 5 cr</>,
      <>
        <strong className="text-ink">合共：55 cr</strong> — 註冊送的 50 個免費
        credits，加一次 $5 增值（50 cr）便足夠。
      </>,
    ],
    topupTiers: "增值組合",
    topupAtAccount: "到 /account 增值 →",
    footerSpec: "協議規格",
    footerSupport: "電郵支援",
  },

  draft: {
    notSignedIn: "尚未登入。請先開啟 /account。",
    loadFailed: (detail: string) => `載入草稿失敗（${detail}）`,
    loadingDraft: "正在載入草稿…",
    draftBadge: "草稿",
    stage: "階段：",
    nextTool: "在 AI 客戶端下一個要呼叫的工具：",
    viewerLabel: "草稿檢視器",
  },

  tree: {
    notSignedIn: "尚未登入。請先開啟 /account。",
    loadFailed: (detail: string) => `載入樹失敗（${detail}）`,
    loadingTree: "正在載入樹…",
    committedOn: (date: string) => `提交於 ${date}`,
    monitoringFrequency: "監測頻率",
    cadenceDaily: "每日 · 09:00 HKT",
    cadenceWeekly: "每週 · 星期六 09:00 HKT",
    cadenceOff: "關閉",
    costDaily: "每次約 5 credits × 每月約 22 次",
    costWeekly: "每次約 5 credits × 每月約 4 次",
    costNone: "沒有自動執行",
    saveFailed: "儲存失敗",
    evidenceNote:
      "你可在下方任何葉節點更新或加入證據。修改會附加到來源草稿，下次重新提交此樹時，新證據會一併寫入。",
    viewerLabel: "樹檢視器",
  },

  framework: {
    h0Label: "H-0 · 根假設",
    h0NotDefined: "H-0 尚未定義。",
    fromLabel: "由：",
    windowLabel: "時間窗：",
    branches: "分支",
    branchCount: (n: number) => `${n} 條分支`,
    leafCount: (n: number) => `${n} 個葉節點`,
    meceRationale: "MECE 理據：",
    scenariosTitle: "三情境估值",
    narrativeTitle: "敘事考古",
    frameworkLabel: "框架：",
    weight: (pct: number) => `權重 ${pct}%`,
    noLeavesYet: "此分支尚未儲存任何葉節點。",
    hypothesis: "假設",
    dataPoints: "數據",
    conclusion: "結論",
    falsificationCondition: "證偽條件",
    notes: "註釋",
    evidence: (n: number) => `證據（${n}）`,
    falsifyIf: "證偽條件：",
    noHypothesisText: "（沒有假設文字）",
    noEvidenceYet: "尚未有證據項目。",
    addRefresh: "+ 新增／更新",
    close: "收起",
    source: "來源 ↗",
    remove: "刪除",
    removeConfirm: "確定刪除此證據項目？",
    autoFetch: "✨ 自動搜集證據（2 credits）",
    fetchingEvidence: "正在搜集證據…",
    autoFetchNote:
      "根據此葉節點的假設及指標，搜尋公開的業績電話會議紀錄、新聞及券商研究。結果會經整理後自動附加。",
    hideManual: "− 收起手動輸入",
    showManual: "+ 手動加入指定引文",
    titleOptional: "標題（可選）",
    snippetOptional: "摘錄／引文（可選）",
    addCitation: "加入引文",
    adding: "加入中…",
    addFailed: (detail: string) => `加入失敗：${detail}`,
    deleteFailed: (detail: string) => `刪除失敗：${detail}`,
    fetchFailed: (detail: string) => `搜集失敗：${detail}`,
    notSignedInLeaf: "尚未登入。請先開啟 /account 登入。",
    sessionExpired: "工作階段已過期。請開啟 /account 以新的登入連結重新登入。",
    sessionExpiredShort: "工作階段已過期。請從帳戶頁重新登入。",
    notEnoughCredits: "Credits 不足。請到帳戶頁增值。",
    preflightFailed: (status: number) =>
      `預檢失敗（HTTP ${status}）。伺服器可能狀態異常 — 請 30 秒後再試。`,
    cantReachApi: (detail: string) =>
      `完全無法連接 API 伺服器（${detail}）。Render 實例可能正在休眠 — 請等 15 秒再試。`,
    noCoverage: "暫時找不到公開報導。請試試在下方手動加入引文。",
    searchTimeout:
      "搜尋逾時（>120 秒）。請再試 — 伺服器端可能其實已成功；重新整理頁面確認。",
    connectionDropped:
      "伺服器連續兩次中斷連線。Render 免費實例可能已當掉 — 請等 30 秒再試。如持續發生，即伺服器端搜尋逾時；請改用下方手動輸入引文。",
    verdicts: {
      validated: "已驗證",
      trending_positive: "趨勢向好",
      inconclusive: "未有定論",
      trending_negative: "趨勢轉差",
      approaching_falsification: "接近證偽",
      falsified: "已證偽",
    },
    conviction: "信心水平",
    expectedWeighted: "期望值（按信心加權）",
    rootConviction: (pct: number) => `根信心水平 ${pct}%`,
    currentPrice: (price: number) => `現價：$${price}`,
    scenariosNotComputed: (method?: string) =>
      `情境已建立框架，尚未計算。${method ? `方法：${method}。` : ""}`,
  },

  ticker: {
    h0Verdict: "H-0 判定",
    conviction: "信心水平",
    expectedReturn: "預期回報",
    publishedBy: "發佈者",
    version: "版本",
    frozenConsensus: "凍結的市場共識",
    branches: "分支",
    valuation: "估值",
    vsSpot: "對比現價",
    killConditions: (n: number) => `證偽條件（${n}）`,
    signedFooter: "以 Ed25519 簽署 · 伺服器公鑰見",
  },

  errorBoundary: {
    hitAnError: (label: string) => `${label}發生錯誤`,
    tryAgain: "重試",
  },

  portfolio: {
    navLabel: "倉位配置",
    title: "倉位配置與再平衡",
    subtitle:
      "將你的股票想法轉化為最佳目標權重——以凱利公式定注、按主動管理基本定律分散、設上限，並一鍵生成券商再平衡指令。",
    loginNudge:
      "計算機對所有人免費。登入後可從你的 Draw Tree 論點匯入校準後的信心水平，並生成券商再平衡指令。",
    loggedInAs: (handle: string) => `已登入：${handle}`,

    ideasTitle: "你的想法",
    ideasHint:
      "搜尋代號——現價會自動載入。填入你的牛市／熊市目標價與信心水平 p。兩情境邊際為負的標的會被標記並在配置前剔除。",
    addIdea: "＋ 新增想法",
    remove: "移除",
    ticker: "代號",
    sector: "行業",
    current: "現價",
    bull: "牛市",
    bear: "熊市",
    conviction: "信心水平 p",
    lotSize: "每手股數",
    hypothesis: "假設（選填）",
    importFromTree: "匯入 p ↓",
    importing: "匯入中…",
    importedFrom: (h: string) => `已自 ${h} 匯入`,
    importFailed: "找不到該代號已提交的樹。",
    importNeedsTicker: "請先輸入代號。",
    importLoginRequired: "登入後可匯入校準後的信心水平。",

    searchPlaceholder: "搜尋代號或公司…",
    searching: "搜尋中…",
    noResults: "無相符結果",
    quoteFetching: "讀取價格中…",
    quoteFailed: "價格無法取得",
    priceLive: "實時",
    infoEmpty: "選擇代號以載入實時價格及資料。",

    advanced: "進階參數",
    kellyFraction: "凱利分數（c）",
    positionCap: "單一倉位上限",
    haircutLambda: "折讓 λ",
    noTradeThreshold: "免交易門檻",
    paramsHint:
      "四分之一凱利（0.25）為預設安全邊際——絕不使用全凱利。上限為單一標的硬性天花板。λ 調節對相關標的折讓的力度。",

    resultsTitle: "目標組合",
    emptyResults: "至少新增一個想法：牛市目標價高於現價、熊市目標價低於現價。",
    targetWeight: "目標",
    rawKelly: "原始凱利",
    cash: "現金",
    cashDiversification: "現金（分散限制）",
    portfolioConviction: "組合信心",
    portfolioConvictionHint:
      "正規化前的原始凱利分數總和。偏低＝想法薄弱；出現現金回退＝想法太少。",
    flagDoNotBuy: "不要買入",
    flagCapped: "已封頂",
    flagHaircut: "已折讓",
    excludedTitle: "已剔除",
    warningsTitle: "備註",

    corrTitle: "相關性",
    corrLoading: "正以歷史價格估算…",
    corrLiveBadge: "實時 · 6 個月日線",
    corrFallbackBadge: "行業回退",
    corrPairs: (live: number, total: number) => `${live}/${total} 組來自歷史`,
    corrObs: (n: number) => `${n} 個觀測`,
    corrShrinkage: (d: string) => `Ledoit-Wolf δ=${d}`,
    corrMissing: (names: string) => `${names} 無可信歷史——改用行業先驗。`,
    corrNote:
      "相關性驅動第 2 層的分散折讓。無可信歷史的標的回退至行業先驗。",

    rebalanceTitle: "再平衡預覽",
    rebalanceLocked: "登入後可生成券商再平衡指令。",
    broker: "券商",
    nlv: "淨清算價值",
    currentShares: "目前持股",
    sharesPlaceholder: "股數",
    noPositions: "全新帳戶可留空——每個目標權重都會變成買入。",
    orders: "指令",
    side: "方向",
    qty: "數量",
    drift: "偏離",
    noOrders: "無指令——每個倉位均已在免交易門檻之內。",
    skipped: "已略過",
    skipBelowThreshold: "低於免交易門檻",
    skipNoPrice: "無價格",
    skipLotZero: "不足一手",
    executeDisabled: "執行——連接券商",
    executeNote:
      "僅供預覽。實際執行透過 IBKR／Futu MCP，預設為模擬盤優先，並須經明確的「先預覽後確認」步驟——本版本尚未啟用。",
    persistenceNote: "將組合儲存至你的帳戶——即將推出。",
    sourceManual: "手動",
    sourceMcp: "Draw Tree",
  },
} satisfies Messages;

export default zh;
