import { chromium } from '@playwright/test'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(import.meta.dirname, '..', '..')
const guidesRoot = path.resolve(import.meta.dirname, '..')
const screenshotDir = path.join(guidesRoot, 'docs', 'public', 'screenshots')
const frontendUrl = process.env.GUIDES_FRONTEND_URL || 'http://localhost:5173'
const apiUrl = process.env.GUIDES_API_URL || 'http://127.0.0.1:5200'

function readEnvFile(filePath) {
  const values = {}
  if (!existsSync(filePath)) return values
  const content = readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [key, ...rest] = line.split('=')
    let value = rest.join('=').trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    values[key.trim()] = value
  }
  return values
}

async function isReachable(url) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 1500)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return response.ok
  } catch {
    return false
  }
}

async function waitForReachable(url, timeoutMs = 45000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await isReachable(url)) return true
    await new Promise((resolve) => setTimeout(resolve, 750))
  }
  return false
}

async function ensureFrontend() {
  if (await isReachable(frontendUrl)) return null
  const frontendDir = path.join(repoRoot, 'frontend')
  const frontendEnv = { ...process.env, VITE_API_BASE_URL: apiUrl, VITE_UDF_BASE_URL: apiUrl }
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: frontendDir,
    stdio: 'inherit',
    env: frontendEnv,
  })
  if (build.status !== 0) throw new Error('Frontend build failed before screenshot capture')
  const child = spawn('npm', ['run', 'preview', '--', '--host', '0.0.0.0', '--port', '5173'], {
    cwd: frontendDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: frontendEnv,
    detached: true,
  })
  child.stdout.on('data', () => {})
  child.stderr.on('data', () => {})
  if (!(await waitForReachable(frontendUrl))) {
    child.kill('SIGTERM')
    throw new Error(`Frontend did not become reachable at ${frontendUrl}`)
  }
  return child
}

async function clickIfVisible(page, locator, timeout = 5000) {
  try {
    const first = locator.first()
    await first.waitFor({ state: 'visible', timeout })
    await first.click()
    return true
  } catch {
    return false
  }
}

async function waitForSettled(page) {
  await page.waitForTimeout(1200)
  await page.evaluate(() => document.fonts?.ready)
  await page.waitForTimeout(400)
}

async function redactSensitive(page) {
  await page.addStyleTag({ content: `
    input[type="password"],
    input[name*="token" i],
    input[name*="secret" i],
    input[name*="webhook" i],
    textarea[name*="token" i],
    textarea[name*="secret" i],
    textarea[name*="webhook" i] {
      color: transparent !important;
      text-shadow: 0 0 0 #7f948d !important;
    }
  ` })
  await page.evaluate(() => {
    const sensitive = /(token|secret|webhook|chat id|授权|密钥|凭证)/i
    for (const node of document.querySelectorAll('input, textarea')) {
      const label = `${node.name || ''} ${node.id || ''} ${node.placeholder || ''} ${node.getAttribute('aria-label') || ''}`
      if (sensitive.test(label) && node.value) node.value = '••••••••••••'
    }
  })
}

async function shot(page, name, captionAction) {
  if (captionAction) await captionAction()
  await redactSensitive(page)
  await waitForSettled(page)
  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage: true })
  console.log(`captured ${name}.png`)
}

async function openDiscover(page, label) {
  await clickIfVisible(page, page.locator('.center-tab').filter({ hasText: '发现' }), 3000)
  await clickIfVisible(page, page.getByRole('tab', { name: label }), 8000)
  await waitForSettled(page)
}

async function expandTree(page) {
  for (let i = 0; i < 8; i += 1) {
    const expanders = page.getByRole('button', { name: '展开' })
    const count = await expanders.count()
    if (!count) return
    await expanders.first().click()
    await page.waitForTimeout(250)
  }
}

async function selectFirstStock(page) {
  await expandTree(page)
  const stock = page.locator('[data-portfolio-symbol]').first()
  if (await stock.count()) {
    await stock.click()
    await waitForSettled(page)
    return true
  }
  return false
}

async function openFirstTreeNodeByClass(page, className) {
  const row = page.locator(`.tree-row.${className}`).first()
  if (await row.count()) {
    await row.click()
    await waitForSettled(page)
    return true
  }
  return false
}

async function main() {
  mkdirSync(screenshotDir, { recursive: true })
  const env = readEnvFile(path.join(repoRoot, 'api', '.env'))
  const token = process.env.AGENT_LOGIN_TOKEN || env.AGENT_LOGIN_TOKEN
  if (!token) throw new Error('AGENT_LOGIN_TOKEN is required in api/.env or environment')
  if (env.ENABLE_AGENT_LOGIN && env.ENABLE_AGENT_LOGIN !== '1') {
    console.warn('ENABLE_AGENT_LOGIN is not 1; login may fail')
  }

  const frontendProcess = await ensureFrontend()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') console.warn(`browser error: ${message.text().slice(0, 180)}`)
  })

  try {
    await page.goto(`${frontendUrl}/dev-login?token=${encodeURIComponent(token)}`, { waitUntil: 'domcontentloaded' })
    await page.waitForURL((url) => !url.href.includes(token), { timeout: 20000 })
    try {
      await page.waitForSelector('.terminal-shell', { timeout: 25000 })
    } catch {
      throw new Error('Agent login did not reach the authenticated app shell')
    }
    await page.evaluate(() => history.replaceState(null, '', '/'))
    await waitForSettled(page)

    await shot(page, 'login')
    await shot(page, 'dashboard')
    await shot(page, 'portfolio-sidebar')

    await selectFirstStock(page)
    await clickIfVisible(page, page.getByRole('tab', { name: '图表' }), 5000)
    await shot(page, 'chart')
    await shot(page, 'stock-detail')

    await openDiscover(page, '组合广场')
    await shot(page, 'portfolio-square')
    const firstPublicCard = page.locator('.portfolio-square-card').first()
    if (await firstPublicCard.count()) {
      await firstPublicCard.click()
      await shot(page, 'portfolio-square-detail')
      await clickIfVisible(page, page.getByText('返回组合广场'), 2000)
    }

    const discoverShots = [
      ['热力图', 'heatmap'],
      ['Serenity', 'serenity'],
      ['Alpha洞察', 'alpha-insight'],
      ['工业电价', 'electricity-prices'],
      ['GPU 租赁价格', 'gpu-rental-prices'],
      ['内存价格', 'memory-prices'],
      ['AI瓶颈', 'ai-bottleneck'],
      ['信号', 'alerts'],
    ]
    for (const [label, name] of discoverShots) {
      await openDiscover(page, label)
      await shot(page, name)
    }

    await openFirstTreeNodeByClass(page, 'type-dataview')
    await shot(page, 'dataview')
    await openFirstTreeNodeByClass(page, 'type-markdown') || await openFirstTreeNodeByClass(page, 'type-mdx')
    await shot(page, 'markdown-mdx')

    const folder = page.locator('.tree-row.type-folder').first()
    if (await folder.count()) {
      await folder.click()
      await folder.click()
      await folder.click({ button: 'right' })
      await clickIfVisible(page, page.getByRole('menuitem', { name: /图谱|组合图谱|打开图谱/ }), 1500)
    }
    await shot(page, 'portfolio-graph')

    await selectFirstStock(page)
    await clickIfVisible(page, page.getByRole('tab', { name: '期权' }), 5000)
    await shot(page, 'options')

    await openDiscover(page, '信号')
    await clickIfVisible(page, page.getByRole('button', { name: /配置|通知|管理/ }), 4000)
    await shot(page, 'settings')
  } finally {
    await browser.close()
    if (frontendProcess?.pid) {
      try {
        process.kill(-frontendProcess.pid, 'SIGTERM')
      } catch {
        frontendProcess.kill('SIGTERM')
      }
    }
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
