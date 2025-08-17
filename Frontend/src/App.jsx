import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import React from 'react';
import { setMeta } from './lib/seo.js';
import LuxeHeader from './Components/LuxeHeader';
import LuxeFooter from './Components/LuxeFooter';
import Announcement from './Components/Announcement';

// Public screens
import HomeScreen from './Screens/HomeScreen';
import AboutScreen from './Screens/AboutScreen';
import ContactScreen from './Screens/ContactScreen';
import ShopScreen from './Screens/ShopScreen';
import WomenScreen from './Screens/WomenScreen';
import MenScreen from './Screens/MenScreen';
import CollectionIndexScreen from './Screens/CollectionIndexScreen';
import CollectionDetailScreen from './Screens/CollectionDetailScreen';
import ProductScreen from './Screens/ProductScreen';
import CartScreen from './Screens/CartScreen';
import WishlistScreen from './Screens/WishlistScreen.jsx';

// Auth/account and checkout
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import ProfileScreen from './Screens/ProfileScreen';
import ShippingScreen from './Screens/ShippingScreen';
import PaymentScreen from './Screens/PaymentScreen';
import CheckoutScreen from './Screens/CheckoutScreen.jsx';
import PlaceOrderScreen from './Screens/PlaceOrderScreen';
import SuccessScreen from './Screens/SuccessScreen.jsx';
import OrderScreen from './Screens/OrderScreen';

// Admin screens
import UserListScreen from './Screens/UserListScreen';
import UserEditScreen from './Screens/UserEditScreen';
import ProductListScreen from './Screens/ProductListScreen';
import ProductEditScreen from './Screens/ProductEditScreen';
import OrderListScreen from './Screens/OrderListScreen';
import AdminGuard from './Admin/AdminGuard.jsx';
import AdminLayout from './Admin/AdminLayout.jsx';
import DashboardAdmin from './Admin/DashboardAdmin.jsx';
import ProductsAdmin from './Admin/ProductsAdmin.jsx';
import VariantsAdmin from './Admin/VariantsAdmin.jsx';
import MediaAdmin from './Admin/MediaAdmin.jsx';
import CollectionsAdmin from './Admin/CollectionsAdmin.jsx';
import PagesAdmin from './Admin/PagesAdmin.jsx';
import OrderAdminDetail from './Admin/OrderAdminDetail.jsx';
import UserAdminDetail from './Admin/UserAdminDetail.jsx';
import ProductAdminDetail from './Admin/ProductAdminDetail.jsx';

function App() {
  React.useEffect(() => {
    // Fallback meta on route load; individual screens will override
    setMeta({ title: 'Vyshnavi Pelimelli', description: 'Designer atelier and curated collections.' });
  }, []);
  return (
    <Router
      unstable_future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <a href="#main" className="visually-hidden-focusable" style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>Skip to main content</a>
      <Announcement items={["Worldwide shipping", "Complimentary shipping over $200", "Limited Edition drop this Friday"]} />
      <LuxeHeader />

      <main id="main" className="">
        <Container>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            {/* Catalog */}
            <Route path="/shop" element={<ShopScreen />} />
            <Route path="/shop/women" element={<WomenScreen />} />
            <Route path="/shop/men" element={<MenScreen />} />
            <Route path="/collection" element={<CollectionIndexScreen />} />
            <Route path="/collection/:slug" element={<CollectionDetailScreen />} />
            <Route path="/product/:id" element={<ProductScreen />} />
            <Route path="/wishlist" element={<WishlistScreen />} />
            <Route path="/cart/:id?" element={<CartScreen />} />
            <Route path="/about" element={<AboutScreen />} />
            <Route path="/contact" element={<ContactScreen />} />
            {/* Auth/Account/Checkout */}
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/login/shipping" element={<ShippingScreen />} />
            <Route path="/payment" element={<PaymentScreen />} />
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/placeorder" element={<PlaceOrderScreen />} />
            <Route path="/checkout/success" element={<SuccessScreen />} />
            <Route path="/order/:id" element={<OrderScreen />} />

            <Route path="/admin/userlist" element={<UserListScreen />} />
            <Route path="/admin/user/:id" element={<UserEditScreen />} />
            <Route path="/admin/productlist" element={<ProductListScreen />} />
            <Route path="/admin/orderlist" element={<OrderListScreen />} />
            <Route path="/admin/product/:id/edit" element={<ProductEditScreen />} />
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index element={<DashboardAdmin />} />
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="product/:id" element={<ProductAdminDetail />} />
              <Route path="variants" element={<VariantsAdmin />} />
              <Route path="media" element={<MediaAdmin />} />
              <Route path="collections" element={<CollectionsAdmin />} />
              <Route path="orders/:id" element={<OrderAdminDetail />} />
              <Route path="user/:id" element={<UserAdminDetail />} />
              <Route path="pages" element={<PagesAdmin />} />
            </Route>
          </Routes>
        </Container>
      </main>

      <LuxeFooter />
    </Router>
  );
}

export default App;
