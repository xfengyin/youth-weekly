import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const categories = [
  {
    id: 'editorial',
    name: '刊首语',
    icon: '📝',
    description: '每周话题或编辑寄语，分享我们的观察和思考',
    accent: '#0075de',
  },
  {
    id: 'tech',
    name: '科技新势力',
    icon: '🚀',
    description: 'AI工具、编程技巧、效率软件推荐，让你走在技术前沿',
    accent: '#2a9d99',
  },
  {
    id: 'anime',
    name: '二次元次元壁',
    icon: '🎨',
    description: 'ACG资讯、动漫评论、原创插画，守护你的次元梦',
    accent: '#ff64c8',
  },
  {
    id: 'gaming',
    name: '游戏研究所',
    icon: '🎮',
    description: '游戏评测、攻略心得、行业动态，玩出专业态度',
    accent: '#1aae39',
  },
  {
    id: 'stories',
    name: '青春故事会',
    icon: '📖',
    description: '成长故事、职场经验、学习心得，陪你走过迷茫期',
    accent: '#dd5b00',
  },
  {
    id: 'tools',
    name: '好工具',
    icon: '🛠️',
    description: '生产力工具、生活助手推荐，提升效率的利器',
    accent: '#615d59',
  },
  {
    id: 'watching',
    name: '在看什么',
    icon: '👀',
    description: '影视、书籍、播客推荐及评论，丰富你的精神世界',
    accent: '#391c57',
  },
  {
    id: 'gallery',
    name: '一周图鉴',
    icon: '📷',
    description: '视觉内容精选，用图片记录精彩瞬间',
    accent: '#0075de',
  },
  {
    id: 'jobs',
    name: '谁在招人',
    icon: '💼',
    description: '招聘信息、实习机会、职场动态',
    accent: '#dd5b00',
  },
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#202020] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14">
          <Link
            href="/"
            className="inline-flex items-center text-[#615d59] dark:text-[#a39e98] hover:text-[#0075de] dark:hover:text-[#62aef0] font-semibold text-[15px] mb-5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <h1 className="text-3xl md:text-[40px] font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] leading-tight">
            内容分类
          </h1>
          <p className="mt-3 text-[#615d59] dark:text-[#a39e98]">
            浏览不同板块的内容，找到你感兴趣的主题
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              id={category.name}
              className="card p-7 group"
            >
              <div className="flex items-start space-x-5">
                <div className="text-4xl flex-shrink-0">{category.icon}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold font-serif-heading text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2 group-hover:text-[#0075de] dark:group-hover:text-[#62aef0] transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-sm text-[#615d59] dark:text-[#a39e98] leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div
                  className="h-[2px] w-full rounded-full opacity-30"
                  style={{ backgroundColor: category.accent }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Callout — Contribution Guide */}
        <div className="mt-16 callout">
          <span className="callout-icon">✏️</span>
          <div className="callout-content">
            <p className="font-semibold text-[rgba(0,0,0,0.95)] dark:text-[rgba(255,255,255,0.95)] mb-2">
              投稿指南
            </p>
            <p className="mb-4">
              欢迎向《青年周刊》投稿！我们接受各种类型的原创内容，包括技术文章、书评、影评、游戏评测等。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="https://github.com/your-username/youth-weekly/blob/main/CONTRIBUTING.md"
                target="_blank"
                className="btn-primary text-[15px]"
              >
                查看投稿指南
              </Link>
              <Link
                href="https://github.com/your-username/youth-weekly/issues"
                target="_blank"
                className="btn-secondary text-[15px]"
              >
                提交内容
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
