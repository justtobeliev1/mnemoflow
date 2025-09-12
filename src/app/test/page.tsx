'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useToast, ToastContainer } from '@/components/ui/toast-notification'
import { useState } from 'react'

export default function TestPage() {
  const { session } = useAuth()
  const { success, error } = useToast()
  const [wordLists, setWordLists] = useState<any[]>([])

  const testCreateWordList = async () => {
    if (!session?.access_token) {
      error('请先登录')
      return
    }

    try {
      const response = await fetch('/api/me/word-lists-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name: '测试单词本 ' + Date.now() })
      })

      if (response.ok) {
        const data = await response.json()
        success('单词本创建成功！')
        console.log('创建成功:', data)
      } else {
        const errorData = await response.json()
        error(errorData.error || '创建失败')
      }
    } catch (err) {
      error('网络错误')
      console.error(err)
    }
  }

  const testGetWordLists = async () => {
    if (!session?.access_token) {
      error('请先登录')
      return
    }

    try {
      const response = await fetch('/api/me/word-lists-simple', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWordLists(data.wordLists || [])
        success('获取单词本成功！')
        console.log('单词本列表:', data.wordLists)
      } else {
        const errorData = await response.json()
        error(errorData.error || '获取失败')
      }
    } catch (err) {
      error('网络错误')
      console.error(err)
    }
  }

  if (!session) {
    return <div className="p-8">请先登录</div>
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">API 测试页面</h1>
      
      <div className="space-x-4">
        <button 
          onClick={testCreateWordList}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          创建测试单词本
        </button>
        
        <button 
          onClick={testGetWordLists}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          获取单词本列表
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">单词本列表：</h2>
        <ul className="mt-2 space-y-2">
          {wordLists.map((list, index) => (
            <li key={index} className="p-2 bg-gray-100 rounded">
              {list.name} (ID: {list.id}, 单词数: {list.wordCount})
            </li>
          ))}
        </ul>
      </div>

      <ToastContainer />
    </div>
  )
}