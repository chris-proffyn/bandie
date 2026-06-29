import { TEST_DATA_BADGE_LABEL, isTestDataEntity } from '@bandie/data';

type TestDataBadgeProps = {
  testUser?: boolean | null;
  className?: string;
};

export function TestDataBadge({ testUser, className }: TestDataBadgeProps) {
  if (!isTestDataEntity(testUser)) {
    return null;
  }

  return (
    <span className={['test-data-badge', className].filter(Boolean).join(' ')}>
      {TEST_DATA_BADGE_LABEL}
    </span>
  );
}
