import { defineConfig } from 'vitepress'

const guidePages = [
  { text: '登录与权限', link: '/login' },
  { text: '主看板', link: '/dashboard' },
  { text: '组合树', link: '/portfolio-sidebar' },
  { text: '图表', link: '/chart' },
  { text: '公司详情', link: '/stock-detail' },
  { text: '组合广场', link: '/portfolio-square' },
  { text: '热力图', link: '/heatmap' },
  { text: 'Serenity', link: '/serenity' },
  { text: 'Alpha洞察', link: '/alpha-insight' },
  { text: '工业电价', link: '/electricity-prices' },
  { text: 'GPU 租赁价格', link: '/gpu-rental-prices' },
  { text: '内存价格', link: '/memory-prices' },
  { text: 'AI瓶颈', link: '/ai-bottleneck' },
  { text: '信号', link: '/alerts' },
  { text: '数据视图', link: '/dataview' },
  { text: '文档节点', link: '/markdown-mdx' },
  { text: '组合图谱', link: '/portfolio-graph' },
  { text: '期权', link: '/options' },
  { text: '配置管理', link: '/settings' },
]

export default defineConfig({
  title: 'K2AI 用户指南',
  description: '股票行情看板、组合管理、信号追踪与 AI 研报的用户使用指南',
  lang: 'zh-CN',
  base: '/ai-chain-dashboard-guides/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#07130f' }],
    ['link', { rel: 'icon', href: '/ai-chain-dashboard-guides/k2ai-symbol.svg' }],
  ],
  themeConfig: {
    logo: '/k2ai-symbol.svg',
    siteTitle: 'K2AI Guide',
    search: { provider: 'local' },
    nav: [
      { text: '快速开始', link: '/' },
      { text: '界面指南', link: '/dashboard' },
      { text: 'GitHub', link: 'https://github.com/haskaomni/ai-chain-dashboard' },
    ],
    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '指南首页', link: '/' },
          { text: '登录与权限', link: '/login' },
        ],
      },
      {
        text: '核心工作区',
        items: guidePages.slice(1, 5),
      },
      {
        text: '发现页',
        items: guidePages.slice(5, 14),
      },
      {
        text: '组合内容',
        items: guidePages.slice(14, 18),
      },
      {
        text: '设置',
        items: guidePages.slice(18),
      },
    ],
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新' },
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '菜单',
    externalLinkIcon: true,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/haskaomni/ai-chain-dashboard-guides' },
    ],
  },
})
