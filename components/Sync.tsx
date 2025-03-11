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
  const [resolveConflict, setResolveConflict] = useState<((value: boolean) => void) | null>(null)

  const handleConflictResolution = async (overwrite: boolean) => {
    try {
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
    } finally {
      setConflictModalVisible(false)
      setCurrentConflict(null)
      if (resolveConflict) {
        resolveConflict(overwrite)
        setResolveConflict(null)
      }
    }
  }

  const showSyncSummary = () => {
    console.log('Showing sync summary:', syncSummary)
    Modal.success({
      title: 'Sync Summary',
      width: 500,
      content: (
        <div>
          <p>Successfully uploaded {syncSummary.totalMessages} messages.</p>
          {syncSummary.uploaded.length > 0 && (
            <>
              <p>Synced dates ({syncSummary.uploaded.length}):</p>
              <ul>
                {syncSummary.uploaded.map(date => (
                  <li key={date}>{date}</li>
                ))}
              </ul>
            </>
          )}
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
          {syncSummary.uploaded.length === 0 && syncSummary.skipped.length === 0 && (
            <p>No files were processed.</p>
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
      
      const folderId = await checkAndCreateFolder()
      console.log('Folder ID:', folderId)
      
      const storage = StorageFactory.getInstance().getProvider()
      const days = await storage.getDaysWithMessages()
      console.log('Available days:', days)
      
      if (!days || days.length === 0) {
        message.info("No chat records found to sync.")
        return
      }
      
      const allRecords: Records = {}
      
      const uniqueDays = [...new Set(days)]
      for (const day of uniqueDays) {
        const date = dayjs(day)
        const records = await storage.getRecords(date)
        if (records && records.length > 0) {
          allRecords[day] = records
        }
      }
      
      console.log('Chat history:', Object.keys(allRecords).length, 'days with records')
      
      if (Object.keys(allRecords).length === 0) {
        message.info("No chat records found to sync.")
        return
      }
      
      let tempSummary = {
        uploaded: [] as string[],
        skipped: [] as string[],
        totalMessages: 0
      }
      
      for (const [date, data] of Object.entries(allRecords)) {
        try {
          console.log('Processing date:', date, 'with data length:', data.length)
          const existingFile = await checkExistingFile(folderId, date)
          console.log('Existing file for date:', date, existingFile ? 'exists' : 'does not exist')
          
          if (existingFile) {
            if (alwaysOverwrite) {
              console.log('Always overwrite is set, overwriting file for date:', date)
              const result = await uploadFile(folderId, date, data, existingFile.id)
              console.log('Upload result:', result)
              tempSummary.uploaded.push(date)
              tempSummary.totalMessages += data.length
            } else if (alwaysSkip) {
              console.log('Always skip is set, skipping file for date:', date)
              tempSummary.skipped.push(date)
            } else {
              console.log('Showing conflict dialog for date:', date)
              const userResponse = new Promise<boolean>((resolve) => {
                setResolveConflict(() => resolve)
                setCurrentConflict({
                  folderId,
                  date,
                  data,
                  existingFileId: existingFile.id
                })
                setConflictModalVisible(true)
              })
              
              const shouldOverwrite = await userResponse
              console.log('User response for date:', date, 'shouldOverwrite:', shouldOverwrite)
              
              if (shouldOverwrite) {
                console.log('User chose to overwrite file for date:', date)
                const result = await uploadFile(folderId, date, data, existingFile.id)
                console.log('Upload result:', result)
                tempSummary.uploaded.push(date)
                tempSummary.totalMessages += data.length
              } else {
                console.log('User chose to skip file for date:', date)
                tempSummary.skipped.push(date)
              }
            }
          } else {
            console.log('No existing file, creating new file for date:', date)
            const result = await uploadFile(folderId, date, data)
            console.log('Upload result:', result)
            tempSummary.uploaded.push(date)
            tempSummary.totalMessages += data.length
          }
        } catch (error) {
          console.error('Error processing date:', date, error)
          message.error(`Failed to process date ${date}: ${error.message}`)
        }
      }
      
      console.log('Final tempSummary:', JSON.stringify(tempSummary))
      
      if (tempSummary.uploaded.length === 0 && tempSummary.skipped.length === 0) {
        message.info("No files were processed during sync.")
        return
      }
      
      showSyncSummaryWithData(tempSummary)
      message.success("Successfully synced with Google Drive!")
    } catch (error) {
      console.error("Sync failed:", error)
      message.error(`Failed to sync: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const showSyncSummaryWithData = (summary: SyncSummary) => {
    console.log('Showing sync summary with data:', summary)
    Modal.success({
      title: 'Sync Summary',
      width: 500,
      content: (
        <div>
          <p>Successfully uploaded {summary.totalMessages} messages.</p>
          {summary.uploaded.length > 0 && (
            <>
              <p>Synced dates ({summary.uploaded.length}):</p>
              <ul>
                {summary.uploaded.map(date => (
                  <li key={date}>{date}</li>
                ))}
              </ul>
            </>
          )}
          {summary.skipped.length > 0 && (
            <>
              <p>Skipped dates ({summary.skipped.length}):</p>
              <ul>
                {summary.skipped.map(date => (
                  <li key={date}>{date}</li>
                ))}
              </ul>
            </>
          )}
          {summary.uploaded.length === 0 && summary.skipped.length === 0 && (
            <p>No files were processed.</p>
          )}
        </div>
      )
    })
  }

  const handleRestore = async () => {
    try {
      setRestoring(true)
      
      const folderId = await checkAndCreateFolder()
      
      const backupFiles = await listBackupFiles(folderId)
      
      const storage = StorageFactory.getInstance().getProvider()
      let restoredCount = 0
      let mergedDates = new Set<string>()
      let failedDates = new Set<string>()
      
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

      const validData = processedData.filter(data => data !== null)
      validData.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())

      for (const data of validData) {
        try {
          // 使用chrome.runtime.sendMessage来恢复记录，确保每个日期的记录都能正确恢复
          chrome.runtime.sendMessage({
            action: 'restoreRecords',
            data: data.records,
            date: dayjs(data.date).valueOf()
          });
          
          // 等待一段时间，确保记录已经被恢复
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const verificationRecords = await storage.getRecords(dayjs(data.date))
          if (!verificationRecords || verificationRecords.length === 0) {
            throw new Error(`Verification failed: No records found after restore for date ${data.date}`)
          }
          
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
      
      chrome.runtime.sendMessage({
        action: 'get-days-with-messages'
      })

      if (mergedDates.size === 1) {
        const restoredDate = [...mergedDates][0]
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'set-current-date',
            date: dayjs(restoredDate).valueOf()
          })
        }, 1000)
      } else if (mergedDates.size > 1) {
        message.info('Multiple dates restored. You can view them in the date picker.')
      }

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

async function checkAndCreateFolder() {
  try {
    // 获取认证令牌
    const tokenData = await new Promise<{token: string}>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve({ token });
        }
      });
    });
    
    console.log('Got auth token for folder check');
    
    // 首先查找是否存在文件夹
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.token}`
        }
      }
    )
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      throw new Error(`Failed to search for folder: ${errorText}`)
    }
    
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.token}`
        },
        body: JSON.stringify({
          name: FOLDER_NAME,
          mimeType: "application/vnd.google-apps.folder"
        })
      }
    )
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      throw new Error(`Failed to create folder: ${errorText}`)
    }
    
    const createResult = await createResponse.json()
    return createResult.id
  } catch (error) {
    console.error('Error in checkAndCreateFolder:', error)
    throw error
  }
}

async function checkExistingFile(folderId, date) {
  try {
    // 获取认证令牌
    const tokenData = await new Promise<{token: string}>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve({ token });
        }
      });
    });
    
    console.log('Got auth token for file check');
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${date}.json' and '${folderId}' in parents and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.token}`
        }
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to check for existing file: ${errorText}`)
    }
    
    const result = await response.json()
    
    if (result.files && result.files.length > 0) {
      return result.files[0]
    }
    
    return null
  } catch (error) {
    console.error('Error in checkExistingFile:', error)
    throw error
  }
}

async function uploadFile(folderId, date, data, existingFileId = null) {
  try {
    console.log('Starting upload for date:', date, 'existingFileId:', existingFileId)
    
    // 获取认证令牌
    const tokenData = await new Promise<{token: string}>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve({ token });
        }
      });
    });
    
    console.log('Got auth token');
    
    // 准备文件元数据
    const metadata = {
      name: `${date}.json`,
      mimeType: 'application/json',
      parents: existingFileId ? undefined : [folderId]
    }
    
    // 准备文件内容
    const fileContent = JSON.stringify(data, null, 2)
    const blob = new Blob([fileContent], { type: 'application/json' })
    
    // 创建FormData
    const formData = new FormData()
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    formData.append('file', blob)
    
    // 上传文件
    let response
    if (existingFileId) {
      // 更新现有文件
      console.log('Updating existing file:', existingFileId)
      response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${tokenData.token}`
          },
          body: formData
        }
      )
    } else {
      // 创建新文件
      console.log('Creating new file in folder:', folderId)
      response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenData.token}`
          },
          body: formData
        }
      )
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Upload failed:', response.status, errorText)
      throw new Error(`Upload failed: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    console.log('Upload successful for date:', date, 'File ID:', result.id)
    return result
  } catch (error) {
    console.error('Error in uploadFile:', error)
    throw error
  }
}

async function listBackupFiles(folderId: string) {
  try {
    // 获取认证令牌
    const tokenData = await new Promise<{token: string}>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve({ token });
        }
      });
    });
    
    console.log('Got auth token for listing backup files');
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.token}`
        }
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to list backup files: ${errorText}`)
    }
    
    const result = await response.json()
    return result.files || []
  } catch (error) {
    console.error('Error in listBackupFiles:', error)
    throw error
  }
}

async function downloadFile(fileId: string) {
  try {
    // 获取认证令牌
    const tokenData = await new Promise<{token: string}>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve({ token });
        }
      });
    });
    
    console.log('Got auth token for downloading file');
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.token}`
        }
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to download file: ${errorText}`)
    }
    
    return await response.text()
  } catch (error) {
    console.error('Error in downloadFile:', error)
    throw error
  }
}

function mergeRecords(localRecords: Transcript[], backupRecords: Transcript[]): Transcript[] {
  const uniqueSessions = new Set<string>()
  const mergedRecords: Transcript[] = []
  
  for (const record of localRecords) {
    if (!uniqueSessions.has(record.session)) {
      uniqueSessions.add(record.session)
      mergedRecords.push(record)
    }
  }
  
  for (const record of backupRecords) {
    if (!uniqueSessions.has(record.session)) {
      uniqueSessions.add(record.session)
      mergedRecords.push(record)
    }
  }
  
  return mergedRecords.sort((a, b) => a.timestamp - b.timestamp)
} 