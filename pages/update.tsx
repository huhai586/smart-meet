import React from 'react';
import { Typography, Card, List, Button } from 'antd';
import './update.scss';

const { Title, Paragraph } = Typography;

const UpdatePage = () => {
    const updates = [
        {
            version: '2.0.0',
            features: [
                'Added Google Drive integration for backup and restore',
                'New UI design with improved user experience',
                'Enhanced meeting summary with AI capabilities',
                'Added support for multiple languages'
            ]
        }
    ];

    return (
        <div className="update-page">
            <Card>
                <Typography>
                    <Title level={2}>Welcome to Google Meet Caption Pro {updates[0].version}!</Title>
                    <Paragraph>
                        We&apos;ve made some exciting improvements to enhance your meeting experience:
                    </Paragraph>

                    <List
                        dataSource={updates[0].features}
                        renderItem={(item) => (
                            <List.Item>
                                <Typography.Text>• {item}</Typography.Text>
                            </List.Item>
                        )}
                    />

                    <div className="action-buttons">
                        <Button type="primary" onClick={() => window.close()}>
                            Got it!
                        </Button>
                    </div>
                </Typography>
            </Card>
        </div>
    );
};

export default UpdatePage;
