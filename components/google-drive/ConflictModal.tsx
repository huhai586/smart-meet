import React from 'react';
import { Modal } from 'antd';
import styled from 'styled-components';
import type { ConflictData } from './types';

export interface ConflictResolutionResult {
  overwrite: boolean;
  alwaysOverwrite: boolean;
  alwaysSkip: boolean;
}

interface ConflictModalProps {
  visible: boolean;
  conflict: ConflictData | null;
  onResolve: (result: ConflictResolutionResult) => void;
}

/* ── Styled Components ── */

const AlertContent = styled.div`
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const AlertTitle = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0;
  text-align: center;
  letter-spacing: -0.2px;
`;

const AlertBody = styled.p`
  font-size: 13px;
  color: #8E8E93;
  text-align: center;
  line-height: 1.5;
  margin: 0;
  max-width: 280px;
`;

const AlertStats = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
`;

const StatCard = styled.div<{ $variant: 'remote' | 'local' }>`
  flex: 1;
  border-radius: 10px;
  background: ${({ $variant }) =>
    $variant === 'remote' ? 'rgba(0, 122, 255, 0.07)' : 'rgba(52, 199, 89, 0.07)'};
  padding: 10px 12px;
`;

const StatLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #8E8E93;
  font-weight: 500;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1C1C1E;
`;

const ButtonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
`;

const AlertButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
  width: 100%;
  height: 44px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.12s ease, transform 0.1s ease;

  background: ${({ $variant }) => {
    if ($variant === 'primary') return '#007AFF';
    if ($variant === 'secondary') return 'rgba(60, 60, 67, 0.08)';
    return 'rgba(255, 59, 48, 0.08)';
  }};

  color: ${({ $variant }) => {
    if ($variant === 'primary') return '#fff';
    if ($variant === 'secondary') return '#007AFF';
    return '#FF3B30';
  }};

  &:hover {
    opacity: 0.88;
  }

  &:active {
    transform: scale(0.98);
    opacity: 0.75;
  }
`;

/* ── Component ── */

const ConflictModal: React.FC<ConflictModalProps> = ({ visible, conflict, onResolve }) => {
  if (!conflict) return null;

  const skip         = () => onResolve({ overwrite: false, alwaysOverwrite: false, alwaysSkip: false });
  const overwrite    = () => onResolve({ overwrite: true,  alwaysOverwrite: false, alwaysSkip: false });
  const alwaysOver   = () => onResolve({ overwrite: true,  alwaysOverwrite: true,  alwaysSkip: false });
  const alwaysSkip   = () => onResolve({ overwrite: false, alwaysOverwrite: false, alwaysSkip: true  });

  return (
    <Modal
      open={visible}
      onCancel={skip}
      width={360}
      centered
      closable={false}
      footer={null}
      styles={{
        content: {
          borderRadius: 16,
          padding: '24px 20px 20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        },
        mask: {
          backdropFilter: 'blur(12px)',
          background: 'rgba(0, 0, 0, 0.22)',
        },
      }}
    >
      <AlertContent>
        <AlertTitle>File Conflict</AlertTitle>
        <AlertBody>
          <strong>{conflict.fileName}</strong>
          {conflict.contentEqual
            ? ' already exists with identical content.'
            : ' already exists with different content.'}
        </AlertBody>

        <AlertStats>
          <StatCard $variant="remote">
            <StatLabel>Cloud</StatLabel>
            <StatValue>{conflict.remoteCount} msgs</StatValue>
            <StatValue style={{ fontSize: 11, color: '#8E8E93', fontWeight: 400 }}>
              {(conflict.remoteSize / 1024).toFixed(1)} KB
            </StatValue>
          </StatCard>
          <StatCard $variant="local">
            <StatLabel>Local</StatLabel>
            <StatValue>{conflict.localCount} msgs</StatValue>
            <StatValue style={{ fontSize: 11, color: '#8E8E93', fontWeight: 400 }}>
              {(conflict.localSize / 1024).toFixed(1)} KB
            </StatValue>
          </StatCard>
        </AlertStats>

        <ButtonStack>
          <AlertButton $variant="primary" onClick={overwrite}>Replace with Local</AlertButton>
          <AlertButton $variant="secondary" onClick={alwaysOver}>Always Replace</AlertButton>
          <AlertButton $variant="secondary" onClick={alwaysSkip}>Always Skip</AlertButton>
          <AlertButton $variant="danger" onClick={skip}>Skip This File</AlertButton>
        </ButtonStack>
      </AlertContent>
    </Modal>
  );
};

export default ConflictModal;
