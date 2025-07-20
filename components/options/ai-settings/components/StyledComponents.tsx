import styled from '@emotion/styled';
import { Card, Button } from 'antd';

export const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: none;
  
  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  }
`;

export const ServiceListItem = styled.div<{ 
  active: boolean, 
  configured: boolean, 
  selected: boolean 
}>`
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  background: ${props => props.selected ? 'rgba(26, 115, 232, 0.1)' : 'white'};
  border: 1px solid ${props => props.selected ? '#1a73e8' : '#f0f0f0'};
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;

export const ConfigArea = styled.div`
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
`;

export const StatusBadge = styled.div<{ isSuccess: boolean }>`
  font-size: 12px; 
  padding: 2px 8px;
  border-radius: 20px;
  display: inline-block;
  background-color: ${props => props.isSuccess ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 77, 79, 0.2)'};
  color: ${props => props.isSuccess ? '#52c41a' : '#ff4d4f'};
`;

export const ActiveServiceBadge = styled.div`
  margin-left: auto;
  background-color: rgba(26, 115, 232, 0.1);
  color: #1a73e8;
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 12px;
  display: flex;
  align-items: center;
`;

export const ServiceIcon = styled.div<{ configured: boolean }>`
  font-size: 28px;
  margin-right: 12px;
  opacity: ${props => props.configured ? 1 : 0.6};
  filter: ${props => !props.configured ? 'grayscale(60%)' : 'none'};
  transition: all 0.3s ease;
`;

export const ConfigButton = styled(Button)`
  min-width: 200px;
  height: 48px;
  font-size: 16px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const DefaultServiceButton = styled(Button)`
  border-radius: 20px;
  padding: 4px 16px;
  height: auto;
  transition: all 0.25s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;
