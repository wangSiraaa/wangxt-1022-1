import { useAppStore } from './store'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import SocialWorkerPage from './pages/SocialWorkerPage'
import ElderPage from './pages/ElderPage'
import CheckinPage from './pages/CheckinPage'
import DirectorPage from './pages/DirectorPage'
import HealthCheckPage from './pages/HealthCheckPage'
import WaitlistPage from './pages/WaitlistPage'
import AbsentListPage from './pages/AbsentListPage'
import ReinstatementPage from './pages/ReinstatementPage'
import StatisticsPage from './pages/StatisticsPage'

export default function App() {
  const { currentPage } = useAppStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />
      case 'socialWorker':
        return <SocialWorkerPage />
      case 'elder':
        return <ElderPage />
      case 'checkin':
        return <CheckinPage />
      case 'director':
        return <DirectorPage />
      case 'healthCheck':
        return <HealthCheckPage />
      case 'waitlist':
        return <WaitlistPage />
      case 'absentList':
        return <AbsentListPage />
      case 'reinstatement':
        return <ReinstatementPage />
      case 'statistics':
        return <StatisticsPage />
      default:
        return <Home />
    }
  }

  return <Layout>{renderPage()}</Layout>
}
