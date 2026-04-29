import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button, Tooltip, Popconfirm } from 'antd';
import { ReloadOutlined, CopyOutlined, CheckOutlined, ClearOutlined, EditOutlined, CloseOutlined, SyncOutlined } from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
import { cleanupLegacyFlatKeys } from '~/utils/appConfig';

// ─── Styled components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  padding: 0 24px 32px;
  max-width: 900px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
`;

const PageHeader = styled.div`
  padding: 0 0 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const HeaderLeft = styled.div``;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1C1C1E;
  letter-spacing: -0.5px;
  margin: 0 0 4px;
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #FF9500;
    box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.25);
  }
`;

const PageSubtitle = styled.p`
  font-size: 13px;
  color: #8E8E93;
  margin: 0;
  line-height: 1.4;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 0 0 8px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 0.5px solid rgba(60, 60, 67, 0.14);
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.1);
  background: rgba(0, 0, 0, 0.016);
`;

const CardTitle = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #3A3A3C;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
`;

const CardActions = styled.div`
  display: flex;
  gap: 6px;
`;

const JsonViewport = styled.div`
  padding: 16px;
  overflow: auto;
  max-height: 600px;
  background: #FAFAFA;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.12);
    border-radius: 3px;
  }
`;

// ─── Collapsible JSON renderer ────────────────────────────────────────────────

const ColPre = styled.div`
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.7;
`;

const ColLine = styled.div<{ $depth: number }>`
  padding-left: ${({ $depth }) => $depth * 16}px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ColToggle = styled.span`
  display: inline-block;
  width: 14px;
  font-size: 9px;
  cursor: pointer;
  user-select: none;
  color: #8E8E93;
  text-align: center;
  &:hover { color: #3A3A3C; }
`;

const ColGhost = styled.span`display: inline-block; width: 14px;`;
const ColKey   = styled.span`color: #5856D6;`;
const ColStr   = styled.span`color: #34C759;`;
const ColNum   = styled.span`color: #FF9500;`;
const ColBool  = styled.span`color: #007AFF;`;
const ColNull  = styled.span`color: #8E8E93;`;
const ColPunct = styled.span`color: #48484A;`;
const ColGray  = styled.span`color: #8E8E93; font-style: italic;`;

interface JsonValueProps {
  value: unknown;
  depth: number;
  path: string;
  isLast: boolean;
  label?: string;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
}

const JsonValue: React.FC<JsonValueProps> = ({ value, depth, path, isLast, label, collapsed, onToggle }) => {
  const comma = isLast ? null : <ColPunct>,</ColPunct>;
  const keyNode = label !== undefined
    ? <><ColKey>"{label}"</ColKey><ColPunct>: </ColPunct></>
    : null;
  const isOpen = !collapsed.has(path);

  // Object
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <ColLine $depth={depth}><ColGhost />{keyNode}<ColPunct>{'{}'}</ColPunct>{comma}</ColLine>;
    }
    return (
      <>
        <ColLine $depth={depth}>
          <ColToggle onClick={() => onToggle(path)}>{isOpen ? '▼' : '▶'}</ColToggle>
          {keyNode}
          <ColPunct style={{ cursor: 'pointer' }} onClick={() => onToggle(path)}>{'{'}</ColPunct>
          {!isOpen && <><ColGray> {entries.length} {entries.length === 1 ? 'key' : 'keys'} </ColGray><ColPunct>{'}'}</ColPunct>{comma}</>}
        </ColLine>
        {isOpen && entries.map(([k, v], i) => (
          <JsonValue key={k} value={v} depth={depth + 1} path={`${path}.${k}`}
            isLast={i === entries.length - 1} label={k} collapsed={collapsed} onToggle={onToggle} />
        ))}
        {isOpen && <ColLine $depth={depth}><ColGhost /><ColPunct>{'}'}</ColPunct>{comma}</ColLine>}
      </>
    );
  }

  // Array
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <ColLine $depth={depth}><ColGhost />{keyNode}<ColPunct>[]</ColPunct>{comma}</ColLine>;
    }
    return (
      <>
        <ColLine $depth={depth}>
          <ColToggle onClick={() => onToggle(path)}>{isOpen ? '▼' : '▶'}</ColToggle>
          {keyNode}
          <ColPunct style={{ cursor: 'pointer' }} onClick={() => onToggle(path)}>[</ColPunct>
          {!isOpen && <><ColGray> {value.length} {value.length === 1 ? 'item' : 'items'} </ColGray><ColPunct>]</ColPunct>{comma}</>}
        </ColLine>
        {isOpen && value.map((item, i) => (
          <JsonValue key={i} value={item} depth={depth + 1} path={`${path}[${i}]`}
            isLast={i === value.length - 1} collapsed={collapsed} onToggle={onToggle} />
        ))}
        {isOpen && <ColLine $depth={depth}><ColGhost /><ColPunct>]</ColPunct>{comma}</ColLine>}
      </>
    );
  }

  // Primitives
  let valueNode: React.ReactNode;
  if (value === null)            valueNode = <ColNull>null</ColNull>;
  else if (typeof value === 'string')  valueNode = <ColStr>{JSON.stringify(value)}</ColStr>;
  else if (typeof value === 'number')  valueNode = <ColNum>{value}</ColNum>;
  else if (typeof value === 'boolean') valueNode = <ColBool>{String(value)}</ColBool>;
  else                                 valueNode = <span>{String(value)}</span>;

  return (
    <ColLine $depth={depth}>
      <ColGhost />{keyNode}{valueNode}{comma}
    </ColLine>
  );
};

const CollapsibleJson: React.FC<{ data: unknown }> = ({ data }) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    // Auto-collapse nodes at depth >= 3
    const set = new Set<string>();
    function walk(val: unknown, path: string, depth: number) {
      if (val === null || typeof val !== 'object') return;
      if (depth >= 3) { set.add(path); return; }
      if (Array.isArray(val)) val.forEach((item, i) => walk(item, `${path}[${i}]`, depth + 1));
      else Object.entries(val as Record<string, unknown>).forEach(([k, v]) => walk(v, `${path}.${k}`, depth + 1));
    }
    walk(data, 'root', 0);
    return set;
  });

  const handleToggle = useCallback((path: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  return (
    <ColPre>
      <JsonValue value={data} depth={0} path="root" isLast={true} collapsed={collapsed} onToggle={handleToggle} />
    </ColPre>
  );
};

// ─── Redact helper ─────────────────────────────────────────────────────────────

/** Replace apiKey / auth_key values with *** for safety */
function redactConfig(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(redactConfig);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
        const lower = k.toLowerCase();
        if (lower.includes('apikey') || lower.includes('api_key') || lower.includes('auth_key')) {
          const str = typeof v === 'string' ? v : '';
          return [k, str.length > 0 ? '••••••••' + str.slice(-4) : ''];
        }
        return [k, redactConfig(v)];
      })
    );
  }
  return obj;
}

// ─── Badge (schema version) ────────────────────────────────────────────────────
const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(255, 149, 0, 0.12);
  color: #C87400;
  font-family: 'SF Mono', monospace;
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const Skeleton = styled.div`
  height: 320px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%);
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s infinite;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const StatPill = styled.span<{ $warn?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 500;
  font-family: 'SF Mono', 'Menlo', monospace;
  background: ${({ $warn }) => $warn ? 'rgba(255, 59, 48, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
  color: ${({ $warn }) => $warn ? '#C0392B' : '#3A3A3C'};
  border: 0.5px solid ${({ $warn }) => $warn ? 'rgba(255,59,48,0.2)' : 'rgba(0,0,0,0.08)'};
`;

const EditTextarea = styled.textarea`
  display: block;
  width: 100%;
  min-height: 480px;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.7;
  background: #1C1C2E;
  color: #E5E5EA;
  border: none;
  outline: none;
  padding: 16px;
  resize: vertical;
  box-sizing: border-box;
  tab-size: 2;
  caret-color: #FF9500;
`;

const EditWarning = styled.div`
  padding: 8px 16px;
  background: rgba(255, 149, 0, 0.08);
  border-bottom: 0.5px solid rgba(255, 149, 0, 0.2);
  font-size: 11.5px;
  color: #C87400;
`;

const EditError = styled.div`
  padding: 8px 16px;
  background: rgba(255, 59, 48, 0.08);
  border-top: 0.5px solid rgba(255, 59, 48, 0.2);
  font-size: 12px;
  color: #FF3B30;
  font-family: 'SF Mono', monospace;
`;

// ─── Sync section ──────────────────────────────────────────────────────────────

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const SyncRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 16px;
`;

const SyncInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SyncLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #1C1C1E;
`;

const SyncMeta = styled.span<{ $color?: string }>`
  font-size: 12px;
  color: ${({ $color }) => $color ?? '#8E8E93'};
  font-family: 'SF Mono', 'Menlo', monospace;
`;

// ─── relative-time helper ──────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5)  return '刚刚';
  if (diff < 60) return `${diff} 秒前`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  return `${days} 天前`;
}

// ─── Main component ────────────────────────────────────────────────────────────

const DeveloperPanel: React.FC = () => {
  const [rawConfig, setRawConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanDone, setCleanDone] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Relative-time ticker so "X 秒前" updates without remount
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Force-pull from chrome.storage.sync
  const [pulling, setPulling] = useState(false);
  const [pullDone, setPullDone] = useState(false);
  const pullDoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  // Keys that are expected — anything else is legacy noise
  const EXPECTED_KEYS = new Set(['appConfig', 'appConfigCleanupDone_v3']);

  const load = useCallback(() => {
    setLoading(true);
    chrome.storage.sync.get(null, (items) => {
      setRawConfig(items);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load persisted lastSyncAt on mount
  useEffect(() => {
    chrome.storage.local.get(['lastSyncAt'], (result) => {
      if (result.lastSyncAt) setLastSyncAt(result.lastSyncAt as number);
    });
  }, []);

  // Live listener: update rawConfig + lastSyncAt whenever storage changes
  useEffect(() => {
    const handler = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName === 'sync' && changes['appConfig']) {
        // Merge new value into displayed config
        setRawConfig(prev => ({
          ...(prev ?? {}),
          appConfig: changes['appConfig'].newValue,
        }));
      }
      if (areaName === 'local' && changes['lastSyncAt']) {
        const ts = changes['lastSyncAt'].newValue as number;
        setLastSyncAt(ts);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const handleForcePull = () => {
    setPulling(true);
    setPullDone(false);
    chrome.storage.sync.get(null, (items) => {
      setRawConfig(items);
      const now = Date.now();
      setLastSyncAt(now);
      chrome.storage.local.set({ lastSyncAt: now });
      setPulling(false);
      setPullDone(true);
      if (pullDoneTimer.current) clearTimeout(pullDoneTimer.current);
      pullDoneTimer.current = setTimeout(() => setPullDone(false), 3000);
    });
  };

  const handleCopy = () => {
    const text = JSON.stringify(redactConfig(rawConfig), null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleForceCleanup = async () => {
    setCleaning(true);
    await cleanupLegacyFlatKeys(true);  // force=true bypasses the flag
    setCleanDone(true);
    setTimeout(() => setCleanDone(false), 3000);
    load(); // reload the panel
    setCleaning(false);
  };

  const enterEditMode = () => {
    const appConfigValue = rawConfig?.appConfig ?? {};
    setEditText(JSON.stringify(appConfigValue, null, 2));
    setEditError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditError(null);
  };

  const saveEdit = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(editText);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Invalid JSON');
      return;
    }
    setSaving(true);
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.storage.sync.set({ appConfig: parsed }, () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      });
      setSaving(false);
      setEditing(false);
      setEditError(null);
      load();
    } catch (e) {
      setSaving(false);
      setEditError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const allKeys = rawConfig ? Object.keys(rawConfig) : [];
  const legacyKeys = allKeys.filter(k => !EXPECTED_KEYS.has(k));
  const hasLegacy = legacyKeys.length > 0;

  const schemaVersion =
    rawConfig?.appConfig &&
    typeof rawConfig.appConfig === 'object' &&
    '_schemaVersion' in (rawConfig.appConfig as object)
      ? (rawConfig.appConfig as Record<string, unknown>)._schemaVersion
      : null;

  return (
    <Wrapper>
      <PageHeader>
        <HeaderLeft>
          <PageTitle>
            Developer
          </PageTitle>
          <PageSubtitle>
            Read-only view of chrome.storage.sync — API keys are redacted.
          </PageSubtitle>
        </HeaderLeft>
        {schemaVersion !== null && (
          <Badge>schema v{String(schemaVersion)}</Badge>
        )}
      </PageHeader>

      {/* Stats + cleanup action */}
      {rawConfig && (
        <StatsRow>
          <StatPill>{allKeys.length} total keys</StatPill>
          {hasLegacy ? (
            <StatPill $warn>{legacyKeys.length} legacy keys detected: {legacyKeys.join(', ')}</StatPill>
          ) : (
            <StatPill>✓ No legacy keys</StatPill>
          )}
        </StatsRow>
      )}

      <SectionLabel style={{ marginTop: 16 }}>Chrome 配置同步</SectionLabel>
      <Card style={{ marginBottom: 16 }}>
        <SyncRow>
          <SyncInfo>
            <SyncLabel>从 Chrome Sync 拉取最新配置</SyncLabel>
            <SyncMeta>
              {lastSyncAt
                ? `最近同步时间: ${relativeTime(lastSyncAt)}`
                : '尚未同步过'}
            </SyncMeta>
            <SyncMeta style={{ marginTop: 2 }}>
              保存编辑后 Chrome 会自动将变更推送到所有设备，无需手动操作
            </SyncMeta>
          </SyncInfo>
          <Tooltip title="从 chrome.storage.sync 重新拉取最新数据" placement="top">
            <Button
              size="small"
              onClick={handleForcePull}
              disabled={pulling}
              style={{ borderRadius: 8, minWidth: 90 }}
              icon={
                pulling
                  ? <SyncOutlined spin />
                  : pullDone
                    ? <CheckOutlined style={{ color: '#34C759' }} />
                    : <SyncOutlined />
              }
            >
              {pulling ? '拉取中…' : pullDone ? '已刷新' : '拉取同步'}
            </Button>
          </Tooltip>
        </SyncRow>
      </Card>

      <SectionLabel>Storage Snapshot</SectionLabel>
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'appConfig (editing)' : 'chrome.storage.sync'}</CardTitle>
          <CardActions>
            {editing ? (
              <>
                <Tooltip title="Save to appConfig" placement="top">
                  <Button
                    size="small"
                    type="primary"
                    loading={saving}
                    icon={<CheckOutlined />}
                    onClick={saveEdit}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
                <Tooltip title="Cancel" placement="top">
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={cancelEdit}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
              </>
            ) : (
              <>
                {hasLegacy && (
                  <Popconfirm
                    title="清理遗留数据"
                    description={`将删除 ${legacyKeys.length} 个旧键，不影响 appConfig 内的数据。`}
                    onConfirm={handleForceCleanup}
                    okText="清理"
                    cancelText="取消"
                    placement="bottomRight"
                  >
                    <Tooltip title="删除遗留旧键" placement="top">
                      <Button
                        size="small"
                        danger
                        loading={cleaning}
                        icon={cleanDone ? <CheckOutlined style={{ color: '#34C759' }} /> : <ClearOutlined />}
                        style={{ borderRadius: 8 }}
                      />
                    </Tooltip>
                  </Popconfirm>
                )}
                <Tooltip title="Refresh" placement="top">
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={load}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
                <Tooltip title={copied ? 'Copied!' : 'Copy (keys redacted)'} placement="top">
                  <Button
                    size="small"
                    icon={copied ? <CheckOutlined style={{ color: '#34C759' }} /> : <CopyOutlined />}
                    onClick={handleCopy}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
                <Tooltip title="Edit appConfig" placement="top">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={enterEditMode}
                    disabled={!rawConfig || loading}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
              </>
            )}
          </CardActions>
        </CardHeader>
        {editing ? (
          <>
            <EditWarning>
              ⚠ Edit mode — API keys are shown unredacted. Changes overwrite <code>chrome.storage.sync → appConfig</code>.
            </EditWarning>
            <EditTextarea
              value={editText}
              onChange={e => { setEditText(e.target.value); setEditError(null); }}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            {editError && <EditError>{editError}</EditError>}
          </>
        ) : (
          <JsonViewport>
            {loading ? (
              <Skeleton />
            ) : (
              <CollapsibleJson data={redactConfig(rawConfig)} />
            )}
          </JsonViewport>
        )}
      </Card>
    </Wrapper>
  );
};

export default DeveloperPanel;
