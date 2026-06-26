import { Link } from 'react-router-dom';

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
        <p>
          <Link to="/">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
