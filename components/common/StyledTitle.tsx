import React from 'react';
import { Typography, theme } from 'antd';

const { Title, Text } = Typography;
const { useToken } = theme;

interface StyledTitleProps {
  children: React.ReactNode;
  subtitle?: string;
}

/**
 * 统一的标题组件，用于所有选项卡页面
 * 采用与AI Settings相同的左对齐样式
 */
const StyledTitle: React.FC<StyledTitleProps> = ({ children, subtitle }) => {
  const { token } = useToken();
  
  return (
    <div style={{ padding: "20px 30px", borderBottom: "1px solid #f0f0f0", marginBottom: "30px" }}>
      <Title level={3} style={{ margin: 0, fontWeight: "bold", color: "#333" }}>
        {children}
      </Title>
      {subtitle && (
        <Text type="secondary" style={{ fontSize: "16px" }}>
          {subtitle}
        </Text>
      )}
    </div>
  );
};

export default StyledTitle; 