import React from 'react';
import { Button, Typography, Tooltip } from 'antd';
import { UserOutlined, TeamOutlined, SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface FilterButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  tooltipTitle: string;
}

const FilterButton = React.memo(({ 
  label, 
  isSelected, 
  onClick, 
  tooltipTitle 
}: FilterButtonProps) => (
  <Tooltip title={tooltipTitle}>
    <Button
      type={isSelected ? 'primary' : 'default'}
      className={isSelected ? 'selected-filter' : ''}
      size="small"
      onClick={onClick}
    >
      {label}
    </Button>
  </Tooltip>
));

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
                label={speaker.length > 15 ? `${speaker.substring(0, 12)}...` : speaker}
                isSelected={filterSpeaker.includes(speaker)}
                onClick={() => toggleSpeaker(speaker)}
                tooltipTitle={speaker}
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
                  label={meetingName.length > 20 ? `${meetingName.substring(0, 17)}...` : meetingName}
                  isSelected={selectedMeeting === meetingName}
                  onClick={() => toggleMeeting(meetingName)}
                  tooltipTitle={meetingName}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="search-container">
        <Tooltip title="Search in messages">
          <Button
            icon={<SearchOutlined />}
            className="search-icon-button"
            onClick={toggleSearch}
            type={isSearchActive ? "primary" : "default"}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default React.memo(FilterSection); 