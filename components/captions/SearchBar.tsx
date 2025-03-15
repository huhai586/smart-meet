import React, { useRef, useCallback } from 'react';
import { Button, Input, Tooltip } from 'antd';
import { SearchOutlined, UpOutlined, DownOutlined, CloseOutlined } from '@ant-design/icons';

interface SearchBarProps {
  searchText: string;
  searchVisible: boolean;
  searchResults: any[];
  currentMatch: number;
  onSearchTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  onToggleSearch: () => void;
  onClearSearch: () => void;
  searchInputRef: React.RefObject<any>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchText,
  searchVisible,
  searchResults,
  currentMatch,
  onSearchTextChange,
  onSearch,
  onPrevMatch,
  onNextMatch,
  onToggleSearch,
  onClearSearch,
  searchInputRef
}) => {
  return (
    <div className={`search-bar ${searchVisible ? 'visible' : ''}`}>
      <div className="search-input-container">
        <SearchOutlined className="search-icon" />
        <Input
          ref={searchInputRef}
          placeholder="Search in messages..."
          value={searchText}
          onChange={onSearchTextChange}
          onPressEnter={onSearch}
          className="search-input"
          autoFocus={searchVisible}
          suffix={
            searchText ? (
              <CloseOutlined
                onClick={onClearSearch}
                className="clear-icon"
              />
            ) : null
          }
        />
        <span className="match-counter">
          {searchResults.length > 0 ? `${currentMatch}/${searchResults.length}` : ''}
        </span>
        <Button
          icon={<UpOutlined />}
          onClick={onPrevMatch}
          className="nav-button"
          disabled={searchResults.length === 0}
        />
        <Button
          icon={<DownOutlined />}
          onClick={onNextMatch}
          className="nav-button"
          disabled={searchResults.length === 0}
        />
        <Button
          icon={<CloseOutlined />}
          onClick={onToggleSearch}
          className="close-button"
        />
      </div>
    </div>
  );
};

export default React.memo(SearchBar); 