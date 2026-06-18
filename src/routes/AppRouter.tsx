import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import MealPlansPage from '@/pages/MealPlansPage'
import CreateMealPlanPage from '@/pages/CreateMealPlanPage'
import ManageDaysPage from '@/pages/ManageDaysPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — sidebar layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/meal-plans"        element={<MealPlansPage />} />
          <Route path="/meal-plans/create"          element={<CreateMealPlanPage />} />
          <Route path="/meal-plans/:planId/manage" element={<ManageDaysPage />} />
        </Route>

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
