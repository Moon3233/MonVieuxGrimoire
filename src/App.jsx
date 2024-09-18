import React, { useEffect, useState } from 'react';
import {
  BrowserRouter, Route, Routes, useLocation,
} from 'react-router-dom';
import SignIn from './pages/SignIn/SignIn';
import Home from './pages/Home/Home';
import Book from './pages/Book/Book';
import { APP_ROUTES } from './utils/constants';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import AddBook from './pages/AddBook/AddBook';
import UpdateBook from './pages/updateBook/UpdateBook';
import { useUser } from './lib/customHooks';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';

function AppContent() {
  const [user, setUser] = useState(null);
  const { connectedUser } = useUser();
  const location = useLocation(); // Appel à useLocation après que BrowserRouter soit utilisé

  useEffect(() => {
    setUser(connectedUser);
  }, [connectedUser]);

  // Conditionner l'affichage des composants Header et Footer
  const isSignInPage = location.pathname === APP_ROUTES.SIGN_IN;

  return (
    <div>
      <ScrollToTop />
      {/* Afficher Header et Footer seulement si ce n'est pas la page SignIn */}
      {!isSignInPage && <Header user={user} setUser={setUser} />}
      <Routes>
        <Route index element={<Home />} />
        <Route path={APP_ROUTES.SIGN_IN} element={<SignIn setUser={setUser} />} />
        <Route path={APP_ROUTES.BOOK} element={<Book />} />
        <Route path={APP_ROUTES.UPDATE_BOOK} element={<UpdateBook />} />
        <Route path={APP_ROUTES.ADD_BOOK} element={<AddBook />} />
      </Routes>
      {/* Afficher Footer seulement si ce n'est pas la page SignIn */}
      {!isSignInPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
