import { getPlatformAccessModeTitle, type PlatformAccessModeStatus } from '@bandie/data';

type PlatformAccessModePillProps = {
  status: PlatformAccessModeStatus;
  className?: string;
};

export function PlatformAccessModePill({ status, className = '' }: PlatformAccessModePillProps) {
  if (!status.active || !status.label) {
    return null;
  }

  return (
    <span
      className={`app-platform-mode-pill app-platform-mode-pill-${status.mode} ${className}`.trim()}
      title={getPlatformAccessModeTitle(status)}
    >
      {status.label}
    </span>
  );
}
