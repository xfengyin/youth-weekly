import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/** 首页底部订阅 CTA */
export default function SubscribeCtaSection() {
  return (
    <section className="py-20 bg-[#0075de]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-[40px] font-bold font-serif-heading text-white mb-5 leading-tight">
          订阅青年周刊
        </h2>
        <p className="text-[rgba(255,255,255,0.85)] mb-10 text-lg leading-relaxed">
          每周一更新，直接发送到您的邮箱。不错过任何精彩内容。
        </p>
        <Link
          href="/subscribe/"
          className="inline-flex items-center justify-center px-8 py-3 bg-white text-[#0075de] font-semibold text-[15px] rounded-[4px] hover:bg-[#f6f5f4] transition-colors"
        >
          立即订阅
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
    </section>
  )
}
