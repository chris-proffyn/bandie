import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/bands"
          element={
            <PlaceholderPage
              title="Band directory"
              description="The searchable band directory is coming soon. Event organisers will be able to filter by genre, location, price and availability."
            />
          }
        />
        <Route
          path="/signup"
          element={
            <PlaceholderPage
              title="Create your band"
              description="Account creation and band setup are coming soon. You'll be able to create a public profile and private workspace in a few steps."
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
