'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useToast, ToastContainer } from '@/components/ui/toast-notification'
import { useState } from 'react'
import CircularTestimonialsDemo from '@/components/ui/circular-testimonials-demo'
import { LearningMnemonicCard } from '@/components/ui/learning-mnemonic-card'
import { MnemonicLearningStage } from '@/components/ui/mnemonic-learning-stage'

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
      const response = await fetch('/api/me/word-lists', {
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
      const response = await fetch('/api/me/word-lists', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWordLists(data.word_lists || [])
        success('获取单词本成功！')
        console.log('单词本列表:', data.word_lists)
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
    <div className="p-8 space-y-8">
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
              {list.name} (ID: {list.id}, 单词数: {list.word_count})
            </li>
          ))}
        </ul>
      </div>

      {/* 融合版学习舞台（上图风格：左词典卡堆叠 + 右助记） */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">学习舞台（融合动效基座）</h2>
        <MnemonicLearningStage
          word="disparate"
          phonetic="/ˈdɪspərət/"
          definitions={[
            { pos: 'adj.', meaning: '截然不同的，迥异的' },
            { pos: 'adj.', meaning: '多种多样的；各式各样的' },
          ]}
          tags={["CET4", "高考"]}
          senses={["截然不同的；迥异的", "本质上不同而难以比较的"]}
          blueprint={"dis(不) + pa(爸) + rate(同一水准/rate) → 和爸爸不是一个水准的。"}
          scenario={"想象一个分屏画面：左边是成功的银行家父亲(pa)在审阅高回报率(rate)的报告；右边是朋克乐手的儿子，在车库疯狂弹吉他。父亲摇头感叹：完全不(dis)是和爸爸(pa)在同一个水准(rate)上的人——兴趣与追求截然不同。"}
          example={{
            en: "Their tastes in music are so disparate that they rarely attend the same concerts.",
            zh: "他们在音乐品味上截然不同，以至于很少会去同一场演出。",
          }}
        />
      </div>

      {/* 旧版卡片已按要求删除，仅保留融合版舞台 */}

      <ToastContainer />
    </div>
  )
}