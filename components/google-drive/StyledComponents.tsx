import React from 'react';
import styled from '@emotion/styled';
import { Button, Card, List, theme } from 'antd';

interface IconWrapperProps {
  color: string;
  shadowColor: string;
  children: React.ReactNode;
}

export const StyledCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
`;

export const IconWrapper = styled.div<IconWrapperProps>`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  transition: all 0.3s ease;
  background: ${props => props.color};
  box-shadow: 0 4px 12px ${props => props.shadowColor};
`;

export const ActionButton = styled(Button)`
  border-radius: 6px;
  height: 40px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const ListItemCard = styled(List.Item)`
  padding: 16px !important;
  border-radius: 6px !important;
  margin-bottom: 8px !important;
  background: #fff;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

// 使用函数组件代替styled组件，以便使用antd的theme
export const GradientTitle: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { token } = theme.useToken();
  
  return (
    <h2 style={{
      marginBottom: "40px",
      textAlign: "center",
      fontSize: "32px",
      fontWeight: 600,
      background: `linear-gradient(120deg, ${token.colorPrimary}, ${token.colorSuccess})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent"
    }}>
      {children}
    </h2>
  );
}; 