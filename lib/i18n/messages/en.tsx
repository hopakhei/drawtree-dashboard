/* eslint-disable react/jsx-key */
// English message catalog. This file DEFINES the Messages shape — zh.tsx
// must mirror it exactly (enforced via `satisfies Messages` there).
//
// Conventions:
//   - plain strings for simple labels
//   - functions for interpolation / plurals
//   - JSX-returning entries for rich instructional copy (bold, <code>…)
//     Rich entries only use intrinsic elements (<strong>, <code>, <em>) so
//     the catalog stays free of component imports; pages inject their own
//     components (MonoLine, Copy, …) as JSX params where needed.

const en = {
  common: {
    brand: "Drawtree",
    backToHome: "← Drawtree",
    backToDrawTree: "← Draw Tree",
    backToAccount: "← My account",
    back: "← back",
    myAccount: "My account",
    signOut: "Sign out",
    loading: "Loading…",
    copy: "Copy",
    copied: "✓ Copied",
    copyUrl: "Copy URL",
    cancel: "Cancel",
    edit: "Edit",
    saving: "Saving…",
    dateLocale: "en-CA",
  },

  langSwitcher: {
    label: "Language",
    en: "EN",
    zh: "中文",
  },

  home: {
    tagline:
      "Every investment thesis as a tree. Every claim has a kill condition. Every verdict is signed, timestamped, and disputable. The wire protocol for AI-native equity research.",
    signUpFree: "Sign up free",
    setupGuide: "Setup guide →",
    myAccount: "My account",
    protocol: "Protocol v0.3",
    health: "Health",
    whatYouGet: "What you get",
    bullets: [
      "An MCP server that co-designs falsifiable hypothesis trees with your favourite AI client (Perplexity, Claude Desktop, any Remote-MCP host).",
      "164 strategy frameworks indexed with canonical full-text — the AI grounds its leaf design in real source material, not generic questions.",
      "Live peer-price data fetch, three-scenario peer valuation, weekly cron monitoring with verdict alerts.",
      "50 free credits on signup — enough to publish your first tree end-to-end. No credit-card prompt. Trees you commit stay private to you.",
    ],
    privacyNote:
      "All committed trees are private by default. There is no public directory of users or trees.",
    footer: (
      <>
        drawtree.capital · structured equity research methodology · published
        trees are content-addressed and append-only ·{" "}
      </>
    ),
    seeProtocol: "see protocol",
  },

  signup: {
    title: "Sign up",
    intro: (
      <>
        Get your API key in under a minute. First-time email signups start with{" "}
        <strong>50 free credits</strong> — enough to publish your first tree
        end-to-end (Phase 2 bundle costs exactly 50 credits).
      </>
    ),
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    displayNameLabel: "Display name (optional)",
    displayNamePlaceholder: "leave blank to use your email prefix",
    createAccount: "Create my account",
    creating: "Creating…",
    legal:
      "By signing up you agree that drawtree is structured research methodology software — not regulated investment advice. Your API key is yours alone; do not share it. We do not require email verification; the same email can only collect the free-credit bonus once.",
    emailExists:
      "An account with this email already exists. Sign in by email instead.",
    signupFailed: "Signup failed",
    networkError: "Network error",
    welcome: "Welcome.",
    accountReady: (
      <>
        Your account is ready. <strong>Copy your API key now</strong> — it will
        not be shown again.
      </>
    ),
    apiKey: "API key",
    copyApiKey: "Copy API key",
    handle: "Handle",
    startingBalance: "Starting balance",
    credits: (n: number) => `${n} credits`,
    mcpServerUrl: "MCP server URL",
    connectPerplexity: "Connect to Perplexity",
    perplexitySteps: [
      <>Settings → Connectors → + Custom → Remote</>,
      <>MCP URL: see above</>,
      <>Auth: API Key</>,
      <>
        Header name: <code>Authorization</code>
      </>,
      <>
        Value: <code>Bearer</code> + your key
      </>,
    ],
    bearerFallback: (
      <>
        If the connector UI doesn&apos;t accept a <code>Bearer </code> prefix,
        use header name <code>api-key</code> and put the bare key as the value.
      </>
    ),
    continueToSetup: "Continue to setup guide →",
    openMyAccount: "Open my account",
    tip: (
      <>
        <strong>Tip:</strong> stash the API key in a password manager. If you
        lose it you can regenerate it from your account page — that invalidates
        the old key.
      </>
    ),
  },

  signin: {
    invalidEmail: "Please enter a valid email.",
    notRegisteredStart: "That email isn't registered. Sign up first below.",
    notRegisteredConsent:
      "That email isn't registered. Sign up at drawtree.capital/signup first.",
    codeIs6Digits: "The code is 6 digits.",
    codeMismatch: "That code doesn't match. Check the latest email.",
    codeUsed: "That code was already used. Request a new one.",
    codeExpired: "That code has expired. Request a new one.",
    codeFormat: "The code must be 6 digits.",
    signInFailed: (status: number | string) => `Sign-in failed (${status}).`,
    networkSend: "Network error sending code.",
    networkVerify: "Network error verifying code.",
    emailMeCode: "Email me a code",
    sending: "Sending…",
    verifying: "Verifying…",
    signIn: "Sign in",
    changeEmail: "← Change email",
    resendCode: "Resend code",
    codeSentTo: (email: React.ReactNode) => (
      <>
        Code sent to <strong className="text-ink">{email}</strong>. Check your
        inbox.
      </>
    ),
    codePlaceholder: "123 456",
  },

  account: {
    signInTitle: "Sign in",
    signInIntro:
      "Enter your email and we'll email you a 6-digit code (and a backup magic link). No password needed.",
    signingIn: "Signing you in…",
    codeSentLong: (email: React.ReactNode) => (
      <>
        Code sent to <strong className="text-ink">{email}</strong>. Check your
        inbox (and spam). Type the 6 digits below, or click the backup link in
        the email.
      </>
    ),
    linkExpired: "Your sign-in link has expired. Request a new one.",
    linkUsed: "This sign-in link has already been used. Request a new one.",
    linkInvalid: "This sign-in link is invalid. Request a new one.",
    linkFailed: "Sign-in failed. Request a new link.",
    sendFailed: "Couldn't send link. Try again in a moment.",
    networkError: (detail: string) => `Network error (${detail}).`,
    ifRegistered:
      "If that email is registered, a code is on its way. Check your inbox (and spam).",
    devModeNotice:
      "Email sender isn't configured yet — use the link or code below.",
    devModeCode: "Dev-mode code:",
    newHere: "New here?",
    createAccount: "Create an account",
    haveKey: "Have your API key?",
    useItInstead: "Use it instead",
    keyStaysInBrowser:
      "Your key stays in this browser — it is not stored on the server.",
    title: "My account",
    lookupFailed: (detail: string) => `Lookup failed (${detail})`,
    topupPending:
      "Payment received. Adding credits to your account — this usually takes a few seconds.",
    topupCancelled:
      "Payment cancelled. No charges were made and your account is unchanged.",
    topupDelayed:
      "Your payment is confirmed but credits haven't landed yet. Refresh in a minute. If it still hasn't updated, email support@drawtree.capital.",
    topupCredited: (credited: number, balance: number) =>
      `${credited} credits added. Your new balance is ${balance}.`,
    holdsReleased: (n: number) =>
      `${n} stuck hold${n > 1 ? "s" : ""} released. Your available credits have been restored.`,
    noStuckHolds: "No stuck holds found.",
    releaseFailed: "Release failed",
    topupFailed: "Top-up failed",
    regenerateConfirm:
      "Issue a new API key? Your current key will stop working immediately.",
    regenerateFailed: "Regenerate failed",
    newKeyTitle: "Your API key — copy it now",
    newKeyNote:
      "This is the only time it will be shown. You'll need it to connect your MCP client. If you lose it, sign in by email again to get a fresh one.",
    balance: "Balance",
    availableCredits: "available credits",
    totalBalance: (balance: number, held: number) =>
      `Total balance ${balance}${held > 0 ? ` · ${held} held` : ""}`,
    topupButton: (usd: string, credits: number) => `+ $${usd} (${credits} credits)`,
    conversion: "$1 USD = 10 credits.",
    connectTitle: "Connect Draw Tree to your AI",
    connectNote:
      "Install the MCP server in ChatGPT, Claude.ai, Perplexity, Claude Code, Codex, or Claude Desktop. The setup guide walks through it step by step.",
    openSetupGuide: "Open setup guide →",
    workspace: "My workspace",
    workspaceCounts: (drafts: number, trees: number) =>
      `${drafts} draft${drafts === 1 ? "" : "s"} · ${trees} tree${trees === 1 ? "" : "s"}`,
    noWorkYet:
      "No work yet. Start a new tree by talking to your AI client with the Draw Tree MCP connector set up.",
    draftsInProgress: "Drafts in progress",
    nextLabel: "next:",
    view: "View →",
    resumeNote:
      "Resume any draft by asking your AI client to continue the relevant ticker. The next tool to call is shown above.",
    committedTrees: "Committed trees",
    verdictLabel: (v: string) => `Verdict: ${v}`,
    noVerdictYet: "No verdict yet",
    accountDetails: "Account details",
    email: "Email",
    handle: "Handle",
    displayName: "Display name",
    releaseTitle: "Release stuck credits",
    releaseNote:
      "If credits show as “held” but nothing is running (e.g. a tool crashed mid-call), this refunds every pending hold older than 5 minutes back to your available balance.",
    releaseButton: "Release stuck credits",
    rotateTitle: "Rotate API key",
    rotateNote:
      "If you suspect your key is compromised. Your current key stops working immediately.",
    rotateButton: "Regenerate key",
  },

  consent: {
    loadingRequest: "Loading authorization request…",
    checkingSignIn: "Checking sign-in…",
    missingParams:
      "This authorization request is missing required parameters. Try starting the connection from your AI client again.",
    authorizeConnection: "Authorize connection",
    signInToApprove: (client: string) => `Sign in to approve ${client}`,
    signInNote:
      "We'll email you a 6-digit code. Type it here so you don't lose this approval page.",
    emailLabel: "Email",
    emailMe6Digit: "Email me a 6-digit code",
    codeSent: (email: React.ReactNode) => (
      <>
        Code sent to <strong className="text-ink">{email}</strong>. Check your
        inbox (and spam) for a 6-digit code.
      </>
    ),
    codeLabel: "6-digit code",
    signInContinue: "Sign in & continue",
    defaultClientName: "An MCP client",
    wantsAccess: (client: string) =>
      `${client} wants to access your Draw Tree account`,
    signedInAs: (email: React.ReactNode) => (
      <>
        Signed in as <strong className="text-ink">{email}</strong>. Not you?{" "}
      </>
    ),
    requestedPermissions: "Requested permissions",
    noScopes: (
      <>
        The client did not request any specific permissions. We&apos;ll grant{" "}
        <code>drawtree:read</code> by default.
      </>
    ),
    scopes: {
      read: {
        label: "Read your trees",
        tagline:
          "Browse committed trees, view verdicts, conviction, and scenario prices.",
      },
      write: {
        label: "Create and edit drafts",
        tagline:
          "Open new research drafts, save framework + leaves, commit trees, and trigger Phase 2 research (costs credits).",
      },
      monitor: {
        label: "Change monitoring frequency",
        tagline:
          "Set weekly / daily / off cadence on a committed tree. Recurring credit cost.",
      },
    },
    revokeNote: (
      <>
        You can revoke this connection any time on{" "}
      </>
    ),
    keyUnaffected: (
      <>
        . Your existing MCP API key (<code>dt_</code>) is unaffected.
      </>
    ),
    pickOne: "Pick at least one permission, or click Deny to cancel.",
    approvalFailed: (status: number) => `Approval failed (${status}).`,
    approvalNetwork: "Network error during approval.",
    approve: "Approve",
    approving: "Approving…",
    deny: "Deny",
  },

  start: {
    title: "Connect Draw Tree to your AI",
    intro: (
      <>
        Three steps. Pick your AI client. Paste two things. Run your first
        ticker. New accounts get <strong>50 free credits</strong> — enough to
        publish your first tree end-to-end.
      </>
    ),
    step1Title: "Sign in or create an account",
    signedInBadge: "✓ Signed in",
    signedInAs: (email: React.ReactNode) => (
      <>
        Signed in as <strong className="text-ink">{email}</strong>.{" "}
      </>
    ),
    keyShownBelow: "Your MCP API key is shown in step 2 below. ",
    generateBelow: "Generate or paste your API key in step 2 below. ",
    manageAccount: "Manage account →",
    haveAccountPrompt: (
      <>Have an account? Enter your email, we&apos;ll send a 6-digit code. New here? </>
    ),
    signUpFree: "Sign up free →",

    step2Title: "Your API key",
    readyToPaste: "✓ Ready to paste below",
    step2Intro: (
      <>
        Every Draw Tree install — OAuth or API key, web or CLI — is tied to a{" "}
        <code>dt_</code> key on your account. Paste an existing one or generate
        a new one. We never store it in your browser; copy it straight into
        your password manager.
      </>
    ),
    freshKeyTitle: "✨ New API key — save it now",
    savedIt: "I've saved it ✓",
    hide: "🔒 Hide",
    reveal: "👁 Reveal",
    freshKeyNote: (
      <>
        This is the <strong>only time</strong> the key is visible. Copy it into
        your password manager (1Password, Bitwarden, Apple Keychain…) right
        now. After you refresh the page or click <em>I&apos;ve saved it</em>,
        you&apos;ll have to regenerate to see another one (which invalidates
        this one).
      </>
    ),
    activeKeyTitle: "Active API key (this tab only)",
    useDifferentKey: "Use a different key",
    pastedKeyNote:
      "The key fills the install snippets below. Not saved — paste again next time, or use a password-manager autofill.",
    haveYourKey: "Have your key?",
    pasteFromManager:
      "Paste it from your password manager (or the “Welcome to Draw Tree” email). Stays in this tab only.",
    useThisKey: "Use this key",
    lostKeyTitle: "Lost your key, or first time setting up?",
    generateNote: (
      <>
        Generate a fresh one. This <strong>invalidates the previous key</strong>{" "}
        — any AI client currently using the old key will stop working until you
        update it.
      </>
    ),
    generateButton: "Generate new API key",
    generating: "Generating…",
    signInToGenerate: "Want to generate a new key? Sign in at step 1 above.",
    keysStartWith: "Keys start with dt_",
    networkError: "Network error.",
    failed: (status: number) => `Failed (${status}).`,
    regenerateConfirm:
      "This will issue a NEW API key and invalidate the old one. Any existing CLI installs (Claude Code, Codex, Claude Desktop) will need to be re-registered with the new key. Continue?",

    step3Title: "Install Draw Tree on your AI",
    step3Intro: (
      <>
        Pick where you want to use Draw Tree. Web clients use{" "}
        <strong>OAuth</strong> (one-click sign-in). CLI clients use your API
        key directly.
      </>
    ),
    taglines: {
      chatgpt: "Web · OAuth",
      claude_ai: "Web · OAuth",
      perplexity: "Web · OAuth or API key",
      claude_code: "Terminal · 1 command",
      codex: "Terminal · config file",
      claude_desktop: "JSON config",
    },
    bannerPerplexity: (
      <>
        <strong className="text-ink">Perplexity</strong> supports{" "}
        <strong>both OAuth and API key</strong> auth. The API key path is
        simpler — grab your key from step 2 above and paste it into the
        connector dialog. OAuth is better for shared / org accounts.
      </>
    ),
    bannerOAuth: (client: string) => (
      <>
        <strong className="text-ink">{client}</strong> uses{" "}
        <strong>OAuth</strong>. You don&apos;t need to copy your API key —
        sign-in happens in a popup window.
      </>
    ),
    bannerApiKeyWithKey: (client: string, keyPrefix: React.ReactNode, fresh: boolean) => (
      <>
        <strong className="text-ink">{client}</strong> uses your{" "}
        <strong>API key</strong> (from step 2 above —{" "}
        <span className="font-mono">{keyPrefix}</span>
        {fresh && <span className="ml-2 text-emerald-700">✨ just generated</span>}
        ).
      </>
    ),
    bannerApiKeyNoKey: (client: string) => (
      <>
        <strong className="text-ink">{client}</strong> uses your{" "}
        <strong>API key</strong> — scroll up to step 2 to paste or generate
        one, then follow the snippet below.
      </>
    ),
    chatgptSteps: (mcpUrl: React.ReactNode) => [
      <>
        In ChatGPT: <strong>Settings → Connectors → Advanced</strong>, turn on{" "}
        <strong>Developer Mode</strong> (Plus / Pro / Team / Edu only).
      </>,
      <>
        <strong>Settings → Connectors → + Create connector</strong>
      </>,
      <>
        Name: <code>Drawtree</code>
      </>,
      <>MCP server URL: {mcpUrl}</>,
      <>
        Authentication: <strong>OAuth</strong> (auto-detected). Leave Client ID
        and Client Secret blank.
      </>,
      <>
        Tick <em>I trust this application</em> → Create.
      </>,
      <>
        A popup opens to drawtree.capital — enter your email and the 6-digit
        code from the email → Approve. ChatGPT activates the connector.
      </>,
    ],
    claudeAiSteps: (mcpUrl: React.ReactNode) => [
      <>
        In Claude.ai: <strong>Customize → Connectors → + Add custom connector</strong>
      </>,
      <>
        Name: <code>Drawtree</code>
      </>,
      <>Remote MCP server URL: {mcpUrl}</>,
      <>
        Leave <strong>OAuth Client ID</strong> and{" "}
        <strong>OAuth Client Secret</strong> blank.
      </>,
      <>
        Click <strong>Add</strong>.
      </>,
      <>
        A popup opens to drawtree.capital — enter your email and the 6-digit
        code from the email → Approve.
      </>,
    ],
    perplexityHeadsUp: (
      <>
        Heads up: Perplexity supports <strong>both API key and OAuth</strong>{" "}
        auth for custom connectors. Pick whichever fits below.
      </>
    ),
    perplexityCommonSteps: (mcpUrl: React.ReactNode) => [
      <>
        Perplexity: <strong>Settings → Connectors → + Custom connector</strong>
      </>,
      <>
        Name: <code>Drawtree</code>
      </>,
      <>MCP server URL: {mcpUrl}</>,
      <>
        Transport: <code>Streamable HTTP</code>
      </>,
      <>Pick one of the two auth methods below.</>,
    ],
    perplexityOptionA: "→ Option A — API key (simplest, recommended)",
    perplexityOptA1: (
      <>
        Authentication: <code>API Key</code>
      </>
    ),
    perplexityOptA2WithKey: (keyPrefix: React.ReactNode) => (
      <>
        API key: paste your <code className="text-[11px]">{keyPrefix}</code>{" "}
        (from step 2 above)
      </>
    ),
    perplexityOptA2NoKey: (
      <>
        API key: paste your <code>dt_</code> key (scroll up to step 2 to paste
        or generate one, then copy it here)
      </>
    ),
    perplexityOptA3: (
      <>
        Tick the risk acknowledgement → <strong>Add</strong>. Done.
      </>
    ),
    perplexityOptANote:
      "Your key never leaves Perplexity — they pass it as a Bearer header on every MCP call. No browser popup, no OAuth dance.",
    perplexityOptionB: "→ Option B — OAuth (per-user consent, no shared key)",
    perplexityOptB1: (
      <>
        Authentication: <strong>OAuth</strong>
      </>
    ),
    perplexityOptB2NoClient:
      "(generate one with the button below — only takes a click)",
    perplexityOptB2Label: "Client ID:",
    perplexityOptB3: (
      <>
        Client Secret: <code>none-required</code> (placeholder — we use PKCE,
        no real secret)
      </>
    ),
    perplexityOptB4: (
      <>
        Tick the risk acknowledgement → <strong>Add</strong>. Approve in the
        popup that opens to drawtree.capital.
      </>
    ),
    perplexityOptBNote:
      "Better for shared / org accounts because each session signs in with email — nothing long-lived to leak.",
    claudeCodeRun: "Run this in your terminal:",
    claudeCodeRestart: (
      <>Restart Claude Code, then ask &ldquo;List my drawtree tools.&rdquo;</>
    ),
    codexIntro: (
      <>
        Export your key, then add an MCP entry to{" "}
        <code>~/.codex/config.toml</code>:
      </>
    ),
    codexSnippetComment1: "# 1. Save the key as an env var",
    codexSnippetComment2: "# 2. Append to ~/.codex/config.toml",
    codexAfter: (
      <>
        Run <code>codex</code> in a fresh terminal — the drawtree tools appear
        automatically.
      </>
    ),
    claudeDesktopIntro: (
      <>
        Open <strong>Settings → Developer → Edit Config</strong>, then paste:
      </>
    ),
    claudeDesktopAfter:
      "Save and restart Claude Desktop. The drawtree icon appears in the message bar.",
    mintIntro: (
      <>
        Perplexity asks you to paste a Client ID. Generate one now —
        we&apos;ll register it under your account so you can revoke it later
        from <code>/account</code>.
      </>
    ),
    mintButton: "Generate Client ID",
    minting: "Generating…",
    yourClientId: "Your Client ID (paste into Perplexity):",
    mcpUrlLabel: "MCP server URL:",

    step4Title: "Install the Draw Tree skill",
    step4Intro: (
      <>
        The skill teaches your AI <em>how</em> to drive the Draw Tree workflow
        correctly (entry gate, Phase 1 stages, Phase 2 deep research, etc.).
        Each client has its own install path — pick yours below.
      </>
    ),
    skillChatgptIntro: (
      <>
        ChatGPT&apos;s consumer tier doesn&apos;t have a skill/plugin primitive
        yet. Use one of these instead:
      </>
    ),
    skillChatgptOpt1: (
      <>
        <strong className="text-ink">Custom GPT (recommended).</strong> ChatGPT
        → Explore GPTs → Create → Configure → paste the raw instructions (see
        expandable section below) into the <em>Instructions</em> field. Save.
        Open your custom GPT — the drawtree connector and the workflow rules
        are both attached.
      </>
    ),
    skillChatgptOpt2: (
      <>
        <strong className="text-ink">Project instructions.</strong> ChatGPT
        Projects → New project → set the Project instructions to the raw text
        below. Every chat in that project inherits it.
      </>
    ),
    skillClaudeAiIntro: "Upload the skill ZIP to Claude.ai (Anthropic Skills format).",
    skillClaudeAiSteps: [
      <>
        Download the skill bundle below — it&apos;s a ZIP containing{" "}
        <code>drawtree/SKILL.md</code>.
      </>,
      <>
        Claude.ai → <strong>Settings → Capabilities → Skills → Upload Skill</strong>.
      </>,
      <>Pick the ZIP, then toggle the skill on.</>,
      <>
        Open a chat. The skill auto-activates when you mention a ticker or say
        &ldquo;drawtree&rdquo;.
      </>,
    ],
    skillPerplexityIntro:
      "Save the starter prompt as a Perplexity skill so it activates automatically whenever you mention a ticker.",
    skillPerplexityStep1: "Download the skill .md or .zip below.",
    skillPerplexityStep2: (link: React.ReactNode) => (
      <>
        Open {link} → <strong>+ Create skill</strong> → <strong>Upload a skill</strong>.
      </>
    ),
    skillPerplexityStep3: "Attach the file. The skill activates immediately.",
    skillClaudeCodeIntro: (
      <>
        Claude Code&apos;s sandbox blocks outbound network calls by default, so{" "}
        <code>curl</code>-from-inside-Claude doesn&apos;t work for{" "}
        <code>drawtree.capital</code>. The smoothest path is to{" "}
        <strong>download in your browser, then ask Claude to install it</strong>{" "}
        — your browser fetch isn&apos;t sandboxed, Claude just writes the local
        file.
      </>
    ),
    recommendedTwoClicks: "✨ Recommended — two clicks",
    skillClaudeCodeStep1: (
      <>
        Click <strong>Download SKILL.md</strong> below.
      </>
    ),
    skillClaudeCodeStep2:
      "In Claude Code, paste the one-line prompt below and hit enter. Claude installs it for you.",
    skillClaudeCodePastePrompt:
      "Install the Draw Tree skill: create the folder ~/.claude/skills/drawtree and move ~/Downloads/SKILL.md into it.",
    skillClaudeCodeVerify: (
      <>
        After Claude says it&apos;s done, run <code>/skills</code> in Claude
        Code to verify, or just say &ldquo;use the drawtree skill…&rdquo;.
      </>
    ),
    preferTerminal: "Prefer to run it in your own terminal? →",
    skillClaudeCodeManual: (
      <>
        Run this in your <strong>regular terminal</strong> (not inside Claude
        Code) — your shell has full network access:
      </>
    ),
    copyCommand: "Copy command",
    skillCodexIntro: (
      <>
        Codex CLI auto-loads <code>AGENTS.md</code> from your Codex home or any
        project root. Same caveat as Claude Code — the sandboxed AI can&apos;t
        reach <code>drawtree.capital</code>, so download in your browser and
        ask Codex to install it.
      </>
    ),
    skillCodexStep1: (
      <>
        Click <strong>Download AGENTS.md</strong> below.
      </>
    ),
    skillCodexStep2:
      "In Codex, paste the one-line prompt below and hit enter. Codex installs it for you.",
    skillCodexPastePrompt:
      "Install the Draw Tree agent instructions: create the folder ~/.codex and move ~/Downloads/AGENTS.md into it.",
    skillCodexVerify:
      "Start a fresh Codex session afterwards — the new AGENTS.md is picked up at session start.",
    preferTerminalShort: "Prefer your own terminal? →",
    skillCodexManual:
      "Run this in your regular shell (not inside Codex) where network access is unrestricted:",
    skillCodexPerProject: (
      <>
        Per-project alternative: place the same file at{" "}
        <code>&lt;project-root&gt;/AGENTS.md</code> — Codex merges global +
        project automatically.
      </>
    ),
    skillClaudeDesktopIntro:
      "Same Anthropic Skills format as Claude.ai — upload the ZIP in Settings.",
    skillClaudeDesktopSteps: [
      <>Download the skill bundle below.</>,
      <>
        Claude Desktop →{" "}
        <strong>Settings → Capabilities → Skills → Upload Skill</strong>.
      </>,
      <>Pick the ZIP, then toggle the skill on.</>,
    ],
    downloadSkillMd: "Download SKILL.md",
    downloadSkillZip: "Download drawtree-skill.zip",
    downloadAgentsMd: "Download AGENTS.md",
    rawInstructionsSummary:
      "Show raw instructions (for any client that has no skill primitive)",
    copyRawInstructions: "Copy raw instructions",
    afterInstalling: (
      <>
        <strong className="text-ink">After installing:</strong> open a new chat
        in your AI client and just say{" "}
        <em>&ldquo;I want to analyze NVDA&rdquo;</em> (or any ticker). The
        skill auto-activates and walks you through Phase 1 → Phase 2.
      </>
    ),

    pricingTitle: "Credits at a glance",
    pricingIntro:
      "$1 USD = 10 credits. Phase 1 design is always free. Phase 2 deep research is a single 50-credit bundle. Weekly monitoring is 5 credits per run.",
    firstTree: "First tree (typical)",
    firstTreeItems: [
      <>Phase 1 (framework design) — free</>,
      <>Phase 2 (research + commit) — 50 cr flat</>,
      <>First week of monitoring — 5 cr</>,
      <>
        <strong className="text-ink">Total: 55 cr</strong> — covered by the 50
        free signup credits plus a single $5 top-up (50 cr).
      </>,
    ],
    topupTiers: "Top-up tiers",
    topupAtAccount: "Top up at /account →",
    footerSpec: "Protocol spec",
    footerSupport: "Email support",
  },

  draft: {
    notSignedIn: "Not signed in. Open /account first.",
    loadFailed: (detail: string) => `Failed to load draft (${detail})`,
    loadingDraft: "Loading draft…",
    draftBadge: "Draft",
    stage: "Stage:",
    nextTool: "Next tool to call in your AI client:",
    viewerLabel: "Draft viewer",
  },

  tree: {
    notSignedIn: "Not signed in. Open /account first.",
    loadFailed: (detail: string) => `Failed to load tree (${detail})`,
    loadingTree: "Loading tree…",
    committedOn: (date: string) => `Committed ${date}`,
    monitoringFrequency: "Monitoring frequency",
    cadenceDaily: "Daily · 09:00 HKT",
    cadenceWeekly: "Weekly · Saturday 09:00 HKT",
    cadenceOff: "Off",
    costDaily: "~5 credits/run × ~22 runs/month",
    costWeekly: "~5 credits/run × ~4 runs/month",
    costNone: "No automated runs",
    saveFailed: "Failed to save",
    evidenceNote:
      "You can refresh or add evidence on any leaf below. Edits attach to the source draft, so the next time you re-commit this tree the new evidence will be baked in.",
    viewerLabel: "Tree viewer",
  },

  framework: {
    h0Label: "H-0 · root hypothesis",
    h0NotDefined: "H-0 not yet defined.",
    fromLabel: "From:",
    windowLabel: "Window:",
    branches: "Branches",
    branchCount: (n: number) => `${n} branch${n === 1 ? "" : "es"}`,
    leafCount: (n: number) => `${n} leaf${n === 1 ? "" : "s"}`,
    meceRationale: "MECE rationale: ",
    scenariosTitle: "3-Scenario valuation",
    narrativeTitle: "Narrative archaeology",
    frameworkLabel: "Framework:",
    weight: (pct: number) => `weight ${pct}%`,
    noLeavesYet: "No leaves saved yet for this branch.",
    hypothesis: "Hypothesis",
    dataPoints: "Data",
    conclusion: "Conclusion",
    falsificationCondition: "Falsification condition",
    notes: "Notes",
    evidence: (n: number) => `Evidence (${n})`,
    falsifyIf: "Falsify if:",
    noHypothesisText: "(no hypothesis text)",
    noEvidenceYet: "No evidence rows yet.",
    addRefresh: "+ Add / refresh",
    close: "Close",
    source: "source ↗",
    remove: "remove",
    removeConfirm: "Remove this evidence row?",
    autoFetch: "✨ Auto-fetch evidence (2 credits)",
    fetchingEvidence: "Fetching evidence…",
    autoFetchNote:
      "Searches across public earnings transcripts, news, and sell-side coverage based on this leaf's hypothesis and metric. Results are sanitized and attached automatically.",
    hideManual: "− Hide manual entry",
    showManual: "+ Add a specific citation by hand",
    titleOptional: "Title (optional)",
    snippetOptional: "Snippet / quote (optional)",
    addCitation: "Add citation",
    adding: "Adding…",
    addFailed: (detail: string) => `Add failed: ${detail}`,
    deleteFailed: (detail: string) => `Delete failed: ${detail}`,
    fetchFailed: (detail: string) => `Fetch failed: ${detail}`,
    notSignedInLeaf: "Not signed in. Open /account and sign in first.",
    sessionExpired:
      "Session expired. Open /account and sign in again with a new magic link.",
    sessionExpiredShort: "Session expired. Please sign in again from the account page.",
    notEnoughCredits: "Not enough credits. Top up from the account page.",
    preflightFailed: (status: number) =>
      `Pre-flight check failed (HTTP ${status}). The server may be in a bad state — try again in 30s.`,
    cantReachApi: (detail: string) =>
      `Can't reach the API server at all (${detail}). The Render instance may be asleep — wait 15s and try again.`,
    noCoverage:
      "No public coverage found yet. Try adding a citation manually below.",
    searchTimeout:
      "Search took too long (>120s). Try again — the search may have actually succeeded server-side; refresh to check.",
    connectionDropped:
      "The server dropped the connection twice. The Render free instance may have crashed — wait 30s and try again. If this keeps happening, the search is timing out server-side; try manual citation entry below.",
    verdicts: {
      validated: "Validated",
      trending_positive: "Trending positive",
      inconclusive: "Inconclusive",
      trending_negative: "Trending negative",
      approaching_falsification: "Approaching falsification",
      falsified: "Falsified",
    },
    conviction: "Conviction",
    expectedWeighted: "Expected (conviction-weighted)",
    rootConviction: (pct: number) => `${pct}% root conviction`,
    currentPrice: (price: number) => `Current price: $${price}`,
    scenariosNotComputed: (method?: string) =>
      `Scenarios scaffolded but not yet computed.${method ? ` Method: ${method}.` : ""}`,
  },

  ticker: {
    h0Verdict: "H-0 verdict",
    conviction: "Conviction",
    expectedReturn: "Expected return",
    publishedBy: "published by",
    version: "version",
    frozenConsensus: "Frozen market consensus",
    branches: "Branches",
    valuation: "Valuation",
    vsSpot: "vs spot",
    killConditions: (n: number) => `Kill conditions (${n})`,
    signedFooter: "Signed Ed25519 · server pubkey at",
  },

  errorBoundary: {
    hitAnError: (label: string) => `${label} hit an error`,
    tryAgain: "Try again",
  },

  portfolio: {
    navLabel: "Position sizing",
    title: "Position sizing & rebalancing",
    subtitle:
      "Turn your stock ideas into optimal target weights — Kelly-sized, diversified by the Fundamental Law of Active Management, capped, and turned into a one-click broker rebalance.",
    loginNudge:
      "The calculator is free for everyone. Log in to import calibrated conviction from your Draw Tree theses and to generate broker rebalance orders.",
    loggedInAs: (handle: string) => `Signed in as ${handle}`,

    ideasTitle: "Your ideas",
    ideasHint:
      "Add each thesis with its bull / bear targets and conviction p. Names whose two-case edge is negative are flagged and dropped before sizing.",
    addIdea: "+ Add idea",
    remove: "Remove",
    ticker: "Ticker",
    sector: "Sector",
    current: "Current",
    bull: "Bull",
    bear: "Bear",
    conviction: "Conviction p",
    lotSize: "Board lot",
    hypothesis: "Hypothesis (optional)",
    importFromTree: "Import p ↓",
    importing: "Importing…",
    importedFrom: (h: string) => `Imported from ${h}`,
    importFailed: "No committed tree found for that ticker.",
    importNeedsTicker: "Enter a ticker first.",
    importLoginRequired: "Log in to import calibrated conviction.",

    advanced: "Advanced parameters",
    kellyFraction: "Kelly fraction (c)",
    positionCap: "Position cap",
    haircutLambda: "Haircut λ",
    noTradeThreshold: "No-trade threshold",
    paramsHint:
      "Quarter-Kelly (0.25) is the default margin of safety — never full Kelly. Cap is the hard per-name ceiling. λ tunes how aggressively correlated names are shaved.",

    resultsTitle: "Target portfolio",
    emptyResults:
      "Add at least one idea with a bull target above — and a bear target below — the current price.",
    targetWeight: "Target",
    rawKelly: "Raw Kelly",
    cash: "Cash",
    cashDiversification: "Cash (diversification limit)",
    portfolioConviction: "Portfolio conviction",
    portfolioConvictionHint:
      "Sum of raw Kelly fractions before normalization. Low = weak ideas; a cash fallback = too few ideas.",
    flagDoNotBuy: "do not buy",
    flagCapped: "capped",
    flagHaircut: "haircut",
    excludedTitle: "Excluded",
    warningsTitle: "Notes",

    rebalanceTitle: "Rebalance preview",
    rebalanceLocked: "Log in to generate broker rebalance orders.",
    broker: "Broker",
    nlv: "Net liquidation value",
    currentShares: "Current shares held",
    sharesPlaceholder: "shares",
    noPositions: "Leave blank for a fresh account — every target weight becomes a BUY.",
    orders: "Orders",
    side: "Side",
    qty: "Qty",
    drift: "Drift",
    noOrders: "No orders — every position is already within the no-trade threshold.",
    skipped: "Skipped",
    skipBelowThreshold: "below no-trade threshold",
    skipNoPrice: "no price",
    skipLotZero: "rounds to zero lots",
    executeDisabled: "Execute — connect broker",
    executeNote:
      "Preview only. Live execution runs through the IBKR / Futu MCP with a paper-first default and an explicit preview-then-confirm step — not enabled in this build.",
    persistenceNote: "Saving portfolios to your account is coming soon.",
    sourceManual: "manual",
    sourceMcp: "Draw Tree",
  },
};

export type Messages = typeof en;
export default en;
