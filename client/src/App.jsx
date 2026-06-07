import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';
import AppInitializer from './components/AppInitializer';
function App() {
  return (
    <BrowserRouter>
      <AppInitializer />
      <Routes />
    </BrowserRouter>
  );
}
export default App;
