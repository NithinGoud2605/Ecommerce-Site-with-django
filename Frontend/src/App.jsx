import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import React from 'react';
import { setMeta } from './lib/seo.js';
import Header from './Components/Header';
import Footer from './Components/Footer';

import HomeScreen from './Screens/HomeScreen';
import ShopScreen from './Screens/ShopScreen';
import WomenScreen from './Screens/WomenScreen';
import MenScreen from './Screens/MenScreen';
import ProductScreen from './Screens/ProductScreen';
import CartScreen from './Screens/CartScreen';
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import ProfileScreen from './Screens/ProfileScreen';
import ShippingScreen from './Screens/ShippingScreen';
import PaymentScreen from './Screens/PaymentScreen';
import CheckoutScreen from './Screens/CheckoutScreen.jsx';
import PlaceOrderScreen from './Screens/PlaceOrderScreen';
import SuccessScreen from './Screens/SuccessScreen.jsx';
import OrderScreen from './Screens/OrderScreen';
import UserListScreen from './Screens/UserListScreen';
import UserEditScreen from './Screens/UserEditScreen';
import ProductListScreen from './Screens/ProductListScreen';
import ProductEditScreen from './Screens/ProductEditScreen';
import OrderListScreen from './Screens/OrderListScreen';
import CollectionIndexScreen from './Screens/CollectionIndexScreen';
import CollectionDetailScreen from './Screens/CollectionDetailScreen';
import AboutScreen from './Screens/AboutScreen';
import ContactScreen from './Screens/ContactScreen';
import AdminGuard from './Admin/AdminGuard.jsx';
import AdminLayout from './Admin/AdminLayout.jsx';
import ProductsAdmin from './Admin/ProductsAdmin.jsx';
import VariantsAdmin from './Admin/VariantsAdmin.jsx';
import MediaAdmin from './Admin/MediaAdmin.jsx';
import CollectionsAdmin from './Admin/CollectionsAdmin.jsx';
import PagesAdmin from './Admin/PagesAdmin.jsx';

function App() {
  React.useEffect(() => {
    // Fallback meta on route load; individual screens will override
    setMeta({ title: 'Handmade Hub', description: 'Discover unique handmade products.' });
  }, []);
  return (
    <Router
      unstable_future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Header />

      <main className="py-3">
        <Container>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/shop" element={<ShopScreen />} />
            <Route path="/shop/women" element={<WomenScreen />} />
            <Route path="/shop/men" element={<MenScreen />} />
            <Route path="/collection" element={<CollectionIndexScreen />} />
            <Route path="/collection/:slug" element={<CollectionDetailScreen />} />
            <Route path="/about" element={<AboutScreen />} />
            <Route path="/contact" element={<ContactScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/login/shipping" element={<ShippingScreen />} />
            <Route path="/payment" element={<PaymentScreen />} />
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/placeorder" element={<PlaceOrderScreen />} />
            <Route path="/checkout/success" element={<SuccessScreen />} />
            <Route path="/order/:id" element={<OrderScreen />} />
            <Route path="/product/:id" element={<ProductScreen />} />
            <Route path="/cart/:id?" element={<CartScreen />} />

            <Route path="/admin/userlist" element={<UserListScreen />} />
            <Route path="/admin/user/:id" element={<UserEditScreen />} />
            <Route path="/admin/productlist" element={<ProductListScreen />} />
            <Route path="/admin/orderlist" element={<OrderListScreen />} />
            <Route path="/admin/product/:id/edit" element={<ProductEditScreen />} />
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="variants" element={<VariantsAdmin />} />
              <Route path="media" element={<MediaAdmin />} />
              <Route path="collections" element={<CollectionsAdmin />} />
              <Route path="pages" element={<PagesAdmin />} />
            </Route>
          </Routes>
        </Container>
      </main>

      <Footer />
    </Router>
  );
}

export default App;
