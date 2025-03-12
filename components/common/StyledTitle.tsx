import React from 'react';
import { Typography, theme } from 'antd';

const { Title } = Typography;
const { useToken } = theme;

interface StyledTitleProps {
  children: React.ReactNode;
}

/**
 * 统一的标题组件，用于所有选项卡页面
 */
const StyledTitle: React.FC<StyledTitleProps> = ({ children }) => {
  const { token } = useToken();
  
  return (
    <Title 
      level={2} 
      style={{
        marginBottom: "40px",
        textAlign: "center",
        fontSize: "32px",
        fontWeight: 600,
        background: `linear-gradient(120deg, ${token.colorPrimary}, ${token.colorInfo})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}
    >
      {children}
    </Title>
  );
};

export default StyledTitle; 