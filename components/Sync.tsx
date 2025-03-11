import { Button, message, Modal, Card, Space, Typography, Spin, Divider } from "antd"
import { useState } from "react"
import { StorageFactory } from "~background/data-persistence/storage-factory"
import dayjs from "dayjs"
import type { Transcript } from "../hooks/useTranscripts"
import { CloudUploadOutlined, CloudDownloadOutlined, CloudSyncOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const FOLDER_NAME = "smartMeetbackup"

interface ConflictData {
  folderId: string
  date: string
  data: Transcript[]
  existingFileId: string
}

interface SyncSummary {
  uploaded: string[]
  skipped: string[]
  totalMessages: number
}

interface Records {
  [key: string]: Transcript[]
}

const Sync = () => {
  const [syncing, setSyncing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [conflictModalVisible, setConflictModalVisible] = useState(false)
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null)
  const [alwaysOverwrite, setAlwaysOverwrite] = useState(false)
  const [alwaysSkip, setAlwaysSkip] = useState(false)
  const [syncSummary, setSyncSummary] = useState<SyncSummary>({
    uploaded: [],
    skipped: [],
    totalMessages: 0
  })

  const handleConflictResolution = async (overwrite) => {
    setConflictModalVisible(false)
    if (overwrite) {
      await uploadFile(currentConflict.folderId, currentConflict.date, currentConflict.data, currentConflict.existingFileId)
      setSyncSummary(prev => ({
        ...prev,
        uploaded: [...new Set([...prev.uploaded, currentConflict.date])],
        totalMessages: prev.totalMessages + currentConflict.data.length
      }))
    } else {
      setSyncSummary(prev => ({
        ...prev,
        skipped: [...new Set([...prev.skipped, currentConflict.date])]
      }))
    }
    setCurrentConflict(null)
  }

  const showSyncSummary = () => {
    Modal.success({
      title: 'Sync Summary',
      width: 500,
      content: (
        <div>
          <p>Successfully uploaded {syncSummary.totalMessages} messages.</p>
          <p>Synced dates ({syncSummary.uploaded.length}):</p>
          <ul>
            {syncSummary.uploaded.map(date => (
              <li key={date}>{date}</li>
            ))}
          </ul>
          {syncSummary.skipped.length > 0 && (
            <>
              <p>Skipped dates ({syncSummary.skipped.length}):</p>
              <ul>
                {syncSummary.skipped.map(date => (
                  <li key={date}>{date}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )
    })
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setSyncSummary({
        uploaded: [],
        skipped: [],
        totalMessages: 0
      })
      
      // 1. 检查文件夹是否存在
      const folderId = await checkAndCreateFolder()
      console.log('Folder ID:', folderId)
      
      // 2. 获取本地聊天记录
      const storage = StorageFactory.getInstance().getProvider()
      const days = await storage.getDaysWithMessages()
      const allRecords: Records = {}
      
      // 获取所有日期的聊天记录，使用Set去重
      const uniqueDays = [...new Set(days)]
      for (const day of uniqueDays) {
        const date = dayjs(day)
        const records = await storage.getRecords(date)
        if (records && records.length > 0) {
          allRecords[day] = records
        }
      }
      
      console.log('Chat history:', allRecords)
      
      // 3. 上传到 Google Drive
      for (const [date, data] of Object.entries(allRecords)) {
        const existingFile = await checkExistingFile(folderId, date)
        
        if (existingFile) {
          if (alwaysOverwrite) {
            await uploadFile(folderId, date, data, existingFile.id)
            setSyncSummary(prev => ({
              ...prev,
              uploaded: [...new Set([...prev.uploaded, date])],
              totalMessages: prev.totalMessages + data.length
            }))
          } else if (alwaysSkip) {
            setSyncSummary(prev => ({
              ...prev,
              skipped: [...new Set([...prev.skipped, date])]
            }))
          } else {
            setCurrentConflict({
              folderId,
              date,
              data,
              existingFileId: existingFile.id
            })
            setConflictModalVisible(true)
            // 等待用户响应
            await new Promise(resolve => {
              const checkInterval = setInterval(() => {
                if (!conflictModalVisible) {
                  clearInterval(checkInterval)
                  resolve(null)
                }
              }, 100)
            })
          }
        } else {
          await uploadFile(folderId, date, data)
          setSyncSummary(prev => ({
            ...prev,
            uploaded: [...new Set([...prev.uploaded, date])],
            totalMessages: prev.totalMessages + data.length
          }))
        }
      }
      
      showSyncSummary()
      message.success("Successfully synced with Google Drive!")
    } catch (error) {
      console.error("Sync failed:", error)
      message.error(`Failed to sync: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleRestore = async () => {
    try {
      setRestoring(true)
      
      // 1. 获取Google Drive文件夹ID
      const folderId = await checkAndCreateFolder()
      
      // 2. 获取所有备份文件
      const backupFiles = await listBackupFiles(folderId)
      
      // 3. 获取本地存储实例
      const storage = StorageFactory.getInstance().getProvider()
      let restoredCount = 0
      let mergedDates = new Set<string>()
      let failedDates = new Set<string>()
      
      // 4. 首先处理所有文件的读取和合并，但不立即存储
      const processedData = await Promise.all(backupFiles.map(async (file) => {
        try {
          const fileContent = await downloadFile(file.id)
          const backupData = JSON.parse(fileContent) as Transcript[]
          if (!backupData || backupData.length === 0) return null

          const date = dayjs(backupData[0]?.timestamp).format('YYYY-MM-DD')
          const localRecords = await storage.getRecords(dayjs(date))
          const mergedRecords = mergeRecords(localRecords, backupData)
          
          if (mergedRecords.length > localRecords.length) {
            return {
              date,
              records: mergedRecords,
              newCount: mergedRecords.length - localRecords.length
            }
          }
          return null
        } catch (error) {
          console.error(`Failed to process backup file:`, error)
          message.error(`Failed to process one of the backup files: ${error.message}`)
          return null
        }
      }))

      // 5. 按日期顺序处理数据存储
      const validData = processedData.filter(data => data !== null)
      validData.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())

      // 6. 顺序存储数据并验证
      for (const data of validData) {
        try {
          await storage.restoreRecords(data.records)
          
          // 验证数据是否成功存储
          const verificationRecords = await storage.getRecords(dayjs(data.date))
          if (!verificationRecords || verificationRecords.length === 0) {
            throw new Error(`Verification failed: No records found after restore for date ${data.date}`)
          }
          
          // 验证记录数量
          if (verificationRecords.length !== data.records.length) {
            throw new Error(`Verification failed: Expected ${data.records.length} records but found ${verificationRecords.length} for date ${data.date}`)
          }

          restoredCount += data.newCount
          mergedDates.add(data.date)
        } catch (error) {
          console.error(`Failed to restore data for date ${data.date}:`, error)
          failedDates.add(data.date)
          message.error(`Failed to restore data for ${data.date}: ${error.message}`)
        }
      }
      
      // 7. 通知后台更新数据
      chrome.runtime.sendMessage({
        action: 'get-days-with-messages'
      })

      // 8. 如果只有一个成功的日期，自动跳转
      if (mergedDates.size === 1) {
        const restoredDate = [...mergedDates][0]
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'set-current-date',
            date: dayjs(restoredDate).valueOf()
          })
        }, 1000)
      }

      // 9. 显示结果
      if (restoredCount > 0) {
        Modal.success({
          title: 'Restore Summary',
          content: (
            <div>
              <p>Successfully restored {restoredCount} new messages.</p>
              <p>Merged dates ({mergedDates.size}):</p>
              <ul>
                {[...mergedDates].map(date => (
                  <li key={date}>{date}</li>
                ))}
              </ul>
              {failedDates.size > 0 && (
                <>
                  <p style={{ color: '#ff4d4f', marginTop: '16px' }}>Failed to restore these dates:</p>
                  <ul>
                    {[...failedDates].map(date => (
                      <li key={date} style={{ color: '#ff4d4f' }}>{date}</li>
                    ))}
                  </ul>
                </>
              )}
              <p style={{ marginTop: '16px', color: '#52c41a' }}>
                The data has been restored and verified. Please wait a moment for the UI to refresh.
                {mergedDates.size === 1 && " You will be automatically redirected to the restored date."}
              </p>
            </div>
          )
        })
      } else {
        if (failedDates.size > 0) {
          message.error("Failed to restore any data. Please check the error messages.")
        } else {
          message.info("No new messages to restore.")
        }
      }
    } catch (error) {
      console.error("Restore failed:", error)
      message.error(`Failed to restore: ${error.message}`)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: "24px", textAlign: "center" }}>
        Google Drive Sync
      </Title>
      
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <CloudSyncOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
            </div>
            <Title level={4} style={{ textAlign: "center", margin: "16px 0" }}>
              Backup & Sync
            </Title>
            <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: "24px" }}>
              Backup your chat history to Google Drive. Existing files can be overwritten or skipped.
            </Text>
            <div style={{ textAlign: "center" }}>
              <Button 
                type="primary"
                size="large"
                icon={<CloudUploadOutlined />}
                onClick={handleSync}
                loading={syncing}
                style={{ minWidth: "200px" }}
              >
                Sync to Google Drive
              </Button>
            </div>
          </Space>
        </Card>

        <Card>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <CloudDownloadOutlined style={{ fontSize: "48px", color: "#52c41a" }} />
            </div>
            <Title level={4} style={{ textAlign: "center", margin: "16px 0" }}>
              Restore & Merge
            </Title>
            <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: "24px" }}>
              Restore chat history from Google Drive and merge with local records. Duplicates will be automatically handled.
            </Text>
            <div style={{ textAlign: "center" }}>
              <Button 
                type="primary"
                size="large"
                icon={<CloudDownloadOutlined />}
                onClick={handleRestore}
                loading={restoring}
                style={{ minWidth: "200px", backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Restore from Drive
              </Button>
            </div>
          </Space>
        </Card>
      </Space>

      <Modal
        title="File Conflict"
        open={conflictModalVisible}
        onCancel={() => handleConflictResolution(false)}
        footer={[
          <Button key="skip" onClick={() => handleConflictResolution(false)}>
            Skip
          </Button>,
          <Button key="overwrite" type="primary" onClick={() => handleConflictResolution(true)}>
            Overwrite
          </Button>
        ]}
      >
        <p>A backup file already exists for date: {currentConflict?.date}</p>
        <p>Would you like to overwrite it or skip this date?</p>
        <div style={{ marginTop: 16 }}>
          <Button 
            type="link" 
            onClick={() => {
              setAlwaysOverwrite(true)
              handleConflictResolution(true)
            }}
          >
            Always overwrite
          </Button>
          <Button 
            type="link" 
            onClick={() => {
              setAlwaysSkip(true)
              handleConflictResolution(false)
            }}
          >
            Always skip
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Sync

// 检查并创建文件夹
async function checkAndCreateFolder() {
  const token = await chrome.identity.getAuthToken({ interactive: true })
  
  // 首先查找是否存在文件夹
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    {
      headers: {
        Authorization: `Bearer ${token.token}`
      }
    }
  )
  
  const searchResult = await searchResponse.json()
  
  // 如果文件夹存在，返回其 ID
  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id
  }
  
  // 如果不存在，创建新文件夹
  const createResponse = await fetch(
    "https://www.googleapis.com/drive/v3/files",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder"
      })
    }
  )
  
  const folder = await createResponse.json()
  return folder.id
}

// 检查文件是否存在
async function checkExistingFile(folderId, date) {
  const token = await chrome.identity.getAuthToken({ interactive: true })
  const fileName = `chat_history_${date}.json`
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${folderId}' in parents and trashed=false`,
    {
      headers: {
        Authorization: `Bearer ${token.token}`
      }
    }
  )
  
  const result = await response.json()
  return result.files && result.files.length > 0 ? result.files[0] : null
}

// 上传或更新文件
async function uploadFile(folderId, date, data, existingFileId = null) {
  const token = await chrome.identity.getAuthToken({ interactive: true })
  const fileName = `chat_history_${date}.json`
  const fileContent = JSON.stringify(data, null, 2)
  
  const metadata = {
    name: fileName,
    mimeType: 'application/json'
  }
  
  if (!existingFileId) {
    metadata['parents'] = [folderId]
  }
  
  const form = new FormData()
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  )
  form.append(
    'file',
    new Blob([fileContent], { type: 'application/json' })
  )
  
  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
  
  const response = await fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token.token}`
    },
    body: form
  })

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${await response.text()}`)
  }
}

// 获取备份文件列表
async function listBackupFiles(folderId: string) {
  const token = await chrome.identity.getAuthToken({ interactive: true })
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType='application/json' and trashed=false`,
    {
      headers: {
        Authorization: `Bearer ${token.token}`
      }
    }
  )
  
  const result = await response.json()
  return result.files || []
}

// 下载文件内容
async function downloadFile(fileId: string) {
  const token = await chrome.identity.getAuthToken({ interactive: true })
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token.token}`
      }
    }
  )
  
  return await response.text()
}

// 合并记录并去重
function mergeRecords(localRecords: Transcript[], backupRecords: Transcript[]): Transcript[] {
  // 使用Set来存储唯一的session标识符
  const uniqueSessions = new Set<string>()
  const mergedRecords: Transcript[] = []
  
  // 处理本地记录
  for (const record of localRecords) {
    if (!uniqueSessions.has(record.session)) {
      uniqueSessions.add(record.session)
      mergedRecords.push(record)
    }
  }
  
  // 处理备份记录
  for (const record of backupRecords) {
    if (!uniqueSessions.has(record.session)) {
      uniqueSessions.add(record.session)
      mergedRecords.push(record)
    }
  }
  
  // 按时间戳排序
  return mergedRecords.sort((a, b) => a.timestamp - b.timestamp)
} 