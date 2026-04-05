import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produto/:slug" element={<ProductDetail />} />
        <Route path="/checkout/:slug" element={<Checkout />} />
        <Route path="/confirmacao" element={<Confirmation />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
