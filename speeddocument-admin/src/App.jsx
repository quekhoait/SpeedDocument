import { BrowserRouter as Router } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import AppRoutes from './routes';


export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#667eea',
        },
      }}
    >
      <Router>
        <AppRoutes />
      </Router>
    </ConfigProvider>
  );
}