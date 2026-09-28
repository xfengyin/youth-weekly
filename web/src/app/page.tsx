import { getAllIssues, getCategories } from './lib/content'
import HeroSection from './components/home/HeroSection'
import LatestIssueSection from './components/home/LatestIssueSection'
import RecentIssuesSection from './components/home/RecentIssuesSection'
import CategoriesSection from './components/home/CategoriesSection'
import SubscribeCtaSection from './components/home/SubscribeCtaSection'

export default function Home() {
  const issues = getAllIssues()
  const categories = getCategories()
  const latestIssue = issues[0]
  const recentIssues = issues.slice(0, 5)

  return (
    <div className="min-h-screen">
      <HeroSection
        issueCount={issues.length}
        categoryCount={categories.length}
        latestIssue={latestIssue}
      />
      {latestIssue && <LatestIssueSection issue={latestIssue} />}
      <RecentIssuesSection issues={recentIssues} totalCount={issues.length} />
      <CategoriesSection categories={categories} />
      <SubscribeCtaSection />
    </div>
  )
}
