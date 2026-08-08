import { Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import AdminOrderPage from './pages/admin/AdminOrderPage.jsx'
import ProductCreatePage from './pages/ProductCreatePage.jsx'
import ProductListPage from './pages/ProductListPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import OrderCompletePage from './pages/OrderCompletePage.jsx'
import OrderListPage from './pages/OrderListPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order/complete" element={<OrderCompletePage />} />
      <Route path="/orders" element={<OrderListPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/orders" element={<AdminOrderPage />} />
      <Route path="/admin/products" element={<ProductListPage />} />
      <Route path="/admin/products/new" element={<ProductCreatePage />} />
    </Routes>
  )
}

export default App
