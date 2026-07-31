import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import SignIn from './pages/SignIn.jsx'
import SupplierList from './pages/SupplierList.jsx'
import SupplierDetail from './pages/SupplierDetail.jsx'
import UserManagement from './pages/UserManagement.jsx'
import Archive from './pages/Archive.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/suppliers" replace />} />
        <Route path="/suppliers" element={<SupplierList />} />
        <Route path="/suppliers/:id" element={<SupplierDetail />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute adminOnly>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/archive"
          element={
            <ProtectedRoute adminOnly>
              <Archive />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/suppliers" replace />} />
    </Routes>
  )
}
