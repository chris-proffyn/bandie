type TrustPillsProps = {
  pills: readonly string[];
};

export function TrustPills({ pills }: TrustPillsProps) {
  return (
    <div className="trust-strip" aria-label="Key benefits">
      {pills.map((pill) => (
        <span key={pill} className="trust-pill">
          {pill}
        </span>
      ))}
    </div>
  );
}
