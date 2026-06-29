import { includeTestData } from '@bandie/data';

type DirectoryTestDataToggleProps = {
  hideTestData: boolean;
  testItemCount: number;
  itemLabel: 'bands' | 'players';
  onChange: (hideTestData: boolean) => void;
};

export function DirectoryTestDataToggle({
  hideTestData,
  testItemCount,
  itemLabel,
  onChange,
}: DirectoryTestDataToggleProps) {
  if (!includeTestData() || testItemCount === 0) {
    return null;
  }

  const noun = testItemCount === 1 ? itemLabel.slice(0, -1) : itemLabel;

  return (
    <button
      type="button"
      className={`directory-btn directory-btn-secondary directory-test-data-toggle${
        hideTestData ? ' is-active' : ''
      }`}
      aria-pressed={hideTestData}
      onClick={() => onChange(!hideTestData)}
    >
      {hideTestData ? 'Show test data' : 'Hide test data'}
      <span className="directory-test-data-toggle-count">
        ({testItemCount} test {noun})
      </span>
    </button>
  );
}
