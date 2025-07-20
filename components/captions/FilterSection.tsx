import React from 'react';
import { Button, Typography } from 'antd';
import { UserOutlined, TeamOutlined, SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface FilterButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const FilterButton = React.memo(({ 
  label, 
  isSelected, 
  onClick
}: FilterButtonProps) => (
  <Button
    type={isSelected ? 'primary' : 'default'}
    className={isSelected ? 'selected-filter' : ''}
    size="small"
    onClick={onClick}
  >
    {label}
  </Button>
));

FilterButton.displayName = 'FilterButton';

interface FilterSectionProps {
  speakers: string[];
  filterSpeaker: string[];
  meetingNames: string[];
  selectedMeeting: string;
  isSearchActive: boolean;
  toggleSpeaker: (speaker: string) => void;
  toggleMeeting: (meetingName: string) => void;
  toggleSearch: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  speakers,
  filterSpeaker,
  meetingNames,
  selectedMeeting,
  isSearchActive,
  toggleSpeaker,
  toggleMeeting,
  toggleSearch
}) => {
  if (speakers.length === 0) return null;
  
  return (
    <div className="filter-section">
      <div className="filter-container">
        <div className="filter-row">
          <div className="filter-label">
            <UserOutlined />
            <Text>Talker:</Text>
          </div>
          <div className="filter-speakers">
            {speakers.map((speaker) => (
              <FilterButton
                key={speaker}
                label={speaker}
                isSelected={filterSpeaker.includes(speaker)}
                onClick={() => toggleSpeaker(speaker)}
              />
            ))}
          </div>
        </div>

        {meetingNames.length > 0 && (
          <div className="filter-row">
            <div className="filter-label">
              <TeamOutlined />
              <Text>Meeting:</Text>
            </div>
            <div className="filter-meeting">
              {meetingNames.map((meetingName) => (
                <FilterButton
                  key={meetingName}
                  label={meetingName}
                  isSelected={selectedMeeting === meetingName}
                  onClick={() => toggleMeeting(meetingName)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="search-container">
        <Button
          icon={<SearchOutlined />}
          className="search-icon-button"
          onClick={toggleSearch}
          type={isSearchActive ? "primary" : "default"}
        />
      </div>
    </div>
  );
};

export default React.memo(FilterSection); 