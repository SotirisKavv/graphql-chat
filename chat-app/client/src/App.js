import { Container } from 'react-bootstrap';
import './App.scss';

import ApolloProvider from './ApolloProvider';
import { AuthProvider } from './context/auth';
import { MessageProvider } from './context/message';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';

import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/home/Home';
import ProtectedRoute from './util/DynamicRoute';

function App() {
  return (
    <ApolloProvider>
      <AuthProvider>
        <MessageProvider>
          <Router>
            <Container className='pt-5'>
              <Routes>
                <Route
                  exact
                  path='/'
                  element={
                    <ProtectedRoute authenticated>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  exact
                  path='/register'
                  element={
                    <ProtectedRoute guest>
                      <Register />
                    </ProtectedRoute>
                  }
                />
                <Route
                  exact
                  path='/login'
                  element={
                    <ProtectedRoute guest>
                      <Login />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Container>
          </Router>
        </MessageProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;
