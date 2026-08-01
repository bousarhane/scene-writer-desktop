interface ComingSoonPanelProps {
  title: string;
  description: string;
}

export function ComingSoonPanel({
  title,
  description,
}: ComingSoonPanelProps) {
  return (
    <div className="coming-soon-panel">
      <div className="coming-soon-mark">SW</div>

      <h2>{title}</h2>

      <p>{description}</p>

      <span>ستُبنى هذه الوحدة في مرحلة لاحقة.</span>
    </div>
  );
}