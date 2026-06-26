import { Button } from '@bandie/ui';
import './App.css';

function App() {
  return (
    <main className="app">
      <p className="eyebrow">Bandie</p>
      <h1>The simple hub for your band life.</h1>
      <p className="lead">
        Project bootstrap complete. The marketing homepage is the next build target.
      </p>
      <div className="actions">
        <Button variant="primary">For Bands</Button>
        <Button variant="secondary">Find a Band</Button>
      </div>
    </main>
  );
}

export default App;
