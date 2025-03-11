import { Button, message } from "antd"
import { useState } from "react"

const FOLDER_NAME = "smartMeetbackup"

const Sync = () => {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    try {
      setSyncing(true)
      
      // 1. 检查文件夹是否存在
      const folderId = await checkAndCreateFolder()
      
      // 2. 获取本地聊天记录
      const chatHistory = await chrome.storage.local.get(null)
      
      // 3. 按日期组织数据
      const organizedData = organizeDataByDate(chatHistory)
      
      // 4. 上传到 Google Drive
      await uploadToGoogleDrive(folderId, organizedData)
      
      message.success("Successfully synced with Google Drive!")
    } catch (error) {
      console.error("Sync failed:", error)
      message.error("Failed to sync with Google Drive")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <Button 
        type="primary" 
        onClick={handleSync} 
        loading={syncing}
      >
        Sync with Google Drive
      </Button>
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

// 按日期组织数据
function organizeDataByDate(chatHistory) {
  const organized = {}
  
  Object.entries(chatHistory).forEach(([key, value]) => {
    const date = new Date(key).toISOString().split('T')[0]
    if (!organized[date]) {
      organized[date] = {}
    }
    organized[date][key] = value
  })
  
  return organized
}

// 上传数据到 Google Drive
async function uploadToGoogleDrive(folderId, organizedData) {
  const token = await chrome.identity.getAuthToken({ interactive: true })
  
  for (const [date, data] of Object.entries(organizedData)) {
    const fileName = `chat_history_${date}.json`
    const fileContent = JSON.stringify(data, null, 2)
    
    const metadata = {
      name: fileName,
      parents: [folderId]
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
    
    await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.token}`
        },
        body: form
      }
    )
  }
} 