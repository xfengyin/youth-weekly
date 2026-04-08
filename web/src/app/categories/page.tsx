import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const categories = [
  {
    id: 'editorial',
    name: '刊首语',
    icon: '📝',
    description: '每周话题或编辑寄语，分享我们的观察和思考',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'tech',
    name: '科技新势力',
    icon: '🚀',
    description: 'AI工具、编程技巧、效率软件推荐，让你走在技术前沿',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'anime',
    name: '二次元次元壁',
    icon: '🎨',
    description: 'ACG资讯、动漫评论、原创插画，守护你的次元梦',
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'gaming',
    name: '游戏研究所',
    icon: '🎮',
    description: '游戏评测、攻略心得、行业动态，玩出专业态度',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'stories',
    name: '青春故事会',
    icon: '📖',
    description: '成长故事、职场经验、学习心得，陪你走过迷茫期',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'tools',
    name: '好工具',
    icon: '🛠️',
    description: '生产力工具、生活助手推荐，提升效率的利器',
    color: 'from-gray-500 to-slate-500',
  },
  {
    id: 'watching',
    name: '在看什么',
    icon: '👀',
    description: '影视、书籍、播客推荐及评论，丰富你的精神世界',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'gallery',
    name: '一周图鉴',
    icon: '📷',
    description: '视觉内容精选，用图片记录精彩瞬间',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    id: 'jobs',
    name: '谁在招人',
    icon: '💼',
    description: '招聘信息、实习机会、职场动态',
    color: 'from-red-500 to-pink-500',
  },
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            内容分类
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            浏览不同板块的内容，找到你感兴趣的主题
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              id={category.name}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{category.icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className={`h-1 w-full bg-gradient-to-r ${category.color} rounded-full`} />
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 card p-8 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            投稿指南
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            欢迎向《青年周刊》投稿！我们接受各种类型的原创内容，包括技术文章、书评、影评、游戏评测等。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="https://github.com/your-username/youth-weekly/blob/main/CONTRIBUTING.md"
              target="_blank"
              className="btn-primary"
            >
              查看投稿指南
            </Link>
            <Link
              href="https://github.com/your-username/youth-weekly/issues"
              target="_blank"
              className="btn-secondary"
            >
              提交内容
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
