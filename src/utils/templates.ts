import type { CodeTemplate } from '../types/editor'

// 内置模板配置：下拉框直接读取该数组，新增示例只需要追加一项。
export const templates: CodeTemplate[] = [
  {
    id: 'blank',
    name: '空白模板',
    description: '没有预置代码，适合从零开始编写。',
    html: '',
    css: '',
    js: '',
  },
  {
    id: 'login-card',
    name: '登录卡片',
    description: '响应式登录表单，展示布局和表单交互。',
    html: `<section class="page">
  <form class="login-card">
    <div class="brand">CodeLab</div>
    <h1>欢迎回来</h1>
    <p>登录后继续你的前端练习。</p>

    <label>
      邮箱
      <input type="email" placeholder="student@example.com" />
    </label>

    <label>
      密码
      <input type="password" placeholder="请输入密码" />
    </label>

    <button type="submit">登录</button>
    <small>演示表单不会提交到服务器。</small>
  </form>
</section>`,
    css: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #172033;
  background:
    radial-gradient(circle at 20% 10%, rgba(20, 184, 166, 0.18), transparent 32%),
    linear-gradient(135deg, #eef2ff 0%, #f8fafc 46%, #ecfeff 100%);
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: min(100%, 390px);
  display: grid;
  gap: 16px;
  padding: 30px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(16px);
}

.brand {
  width: fit-content;
  border-radius: 999px;
  padding: 6px 10px;
  color: #0f766e;
  background: #ccfbf1;
  font-weight: 700;
}

h1,
p {
  margin: 0;
}

p,
small {
  color: #64748b;
}

label {
  display: grid;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
}

input {
  height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 12px;
  font: inherit;
}

button {
  height: 44px;
  border: 0;
  border-radius: 10px;
  color: white;
  background: #2563eb;
  font-weight: 700;
  cursor: pointer;
}`,
    js: `const form = document.querySelector('.login-card')

form?.addEventListener('submit', (event) => {
  event.preventDefault()
  console.log('登录表单已提交')
  console.warn('这是课程演示，不会连接后端服务')
})`,
  },
  {
    id: 'animated-button',
    name: '动画按钮',
    description: '带粒子反馈的按钮，展示 CSS 动画和 JS DOM 操作。',
    html: `<main class="stage">
  <button class="magic-button">
    <span>生成灵感</span>
  </button>
  <p class="message">点击按钮查看动画反馈</p>
</main>`,
    css: `body {
  margin: 0;
  font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}

.stage {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 18px;
  text-align: center;
  overflow: hidden;
}

.magic-button {
  position: relative;
  min-width: 172px;
  border: 1px solid rgba(125, 211, 252, 0.45);
  border-radius: 999px;
  padding: 16px 28px;
  color: #082f49;
  background: linear-gradient(135deg, #67e8f9, #bef264);
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 20px 45px rgba(34, 211, 238, 0.28);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.magic-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 26px 55px rgba(34, 211, 238, 0.38);
}

.spark {
  position: fixed;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  background: #fde68a;
  animation: fly 680ms ease-out forwards;
}

@keyframes fly {
  to {
    opacity: 0;
    transform: translate(var(--x), var(--y)) scale(0.2);
  }
}

.message {
  color: #94a3b8;
}`,
    js: `const button = document.querySelector('.magic-button')
const message = document.querySelector('.message')
let count = 0

button?.addEventListener('click', (event) => {
  count += 1
  message.textContent = \`已触发 \${count} 次动画\`
  console.log('动画按钮点击次数:', count)

  const { clientX, clientY } = event
  for (let index = 0; index < 16; index += 1) {
    const spark = document.createElement('i')
    spark.className = 'spark'
    spark.style.left = \`\${clientX}px\`
    spark.style.top = \`\${clientY}px\`
    spark.style.setProperty('--x', \`\${Math.cos(index) * 90}px\`)
    spark.style.setProperty('--y', \`\${Math.sin(index) * 90}px\`)
    document.body.append(spark)
    spark.addEventListener('animationend', () => spark.remove())
  }
})`,
  },
]

export const defaultTemplate = templates[0]

export function getTemplateById(templateId: string): CodeTemplate {
  return templates.find((template) => template.id === templateId) ?? defaultTemplate
}
