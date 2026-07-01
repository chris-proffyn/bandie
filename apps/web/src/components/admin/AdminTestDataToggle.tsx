type AdminTestDataToggleProps = {
  hideTestData: boolean;
  testUserCount: number;
  testBandCount: number;
  onChange: (hideTestData: boolean) => void;
};

export function AdminTestDataToggle({
  hideTestData,
  testUserCount,
  testBandCount,
  onChange,
}: AdminTestDataToggleProps) {
  const testItemCount = testUserCount + testBandCount;

  if (testItemCount === 0) {
    return null;
  }

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
        ({testUserCount} test {testUserCount === 1 ? 'user' : 'users'}, {testBandCount} test{' '}
        {testBandCount === 1 ? 'band' : 'bands'})
      </span>
    </button>
  );
}
