export type BandOverviewTab = 'members' | 'details';

type BandOverviewTabBarProps = {
  activeTab: BandOverviewTab;
  onTabChange: (tab: BandOverviewTab) => void;
};

const TAB_OPTIONS: { value: BandOverviewTab; label: string }[] = [
  { value: 'members', label: 'Members' },
  { value: 'details', label: 'Band details' },
];

export function BandOverviewTabBar({ activeTab, onTabChange }: BandOverviewTabBarProps) {
  return (
    <div className="band-overview-tab-bar" role="tablist" aria-label="Band overview sections">
      {TAB_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={activeTab === option.value}
          className={`band-overview-tab-btn ${activeTab === option.value ? 'active' : ''}`}
          onClick={() => onTabChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
