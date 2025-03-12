import React from 'react';
import { List, Button, Popconfirm, Typography, Empty, Spin, theme } from 'antd';
import { CloudDownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DriveFile } from './types';
import { ActionButton, ListItemCard } from './StyledComponents';

const { Text } = Typography;
const { useToken } = theme;

interface FileListProps {
  files: DriveFile[];
  loading: boolean;
  loadingFileId: string | null;
  deletingFileId: string | null;
  onRestore: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  loading,
  loadingFileId,
  deletingFileId,
  onRestore,
  onDelete
}) => {
  const { token } = useToken();

  return (
    <Spin spinning={loading}>
      {files.length > 0 ? (
        <List
          dataSource={files}
          renderItem={(file) => (
            <ListItemCard
              actions={[
                <ActionButton
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  onClick={() => onRestore(file.id, file.name)}
                  loading={loadingFileId === file.id}
                  size="small"
                  style={{
                    background: token.colorSuccess,
                    borderColor: token.colorSuccess
                  }}
                >
                  Restore
                </ActionButton>,
                <Popconfirm
                  title="Delete file"
                  description={`Are you sure you want to delete "${file.name}"?`}
                  onConfirm={() => onDelete(file.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingFileId === file.id}
                    size="small"
                  >
                    Delete
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={<Text strong>{file.name}</Text>}
                description={
                  <Text type="secondary" style={{ fontSize: "13px" }}>
                    Modified: {new Date(file.modifiedTime).toLocaleString()}
                  </Text>
                }
              />
            </ListItemCard>
          )}
        />
      ) : (
        <Empty
          description={
            <Text type="secondary" style={{ fontSize: "15px" }}>
              No backup files found
            </Text>
          }
        />
      )}
    </Spin>
  );
};

export default FileList; 