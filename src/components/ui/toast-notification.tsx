'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

interface ToastNotificationProps extends ToastProps {
  isVisible: boolean
}

export function ToastNotification({ 
  message, 
  type, 
  duration = 3000, 
  onClose, 
  isVisible 
}: ToastNotificationProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!mounted) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-surface/80 backdrop-blur-md border border-green-500/30 text-green-400'
      case 'error':
        return 'bg-surface/80 backdrop-blur-md border border-red-500/30 text-red-400'
      case 'info':
        return 'bg-surface/80 backdrop-blur-md border border-blue-500/30 text-blue-400'
      default:
        return 'bg-surface/80 backdrop-blur-md border border-border text-foreground'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'info':
        return 'ℹ'
      default:
        return ''
    }
  }

  const getIconStyles = () => {
    switch (type) {
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'info':
        return 'text-blue-400'
      default:
        return 'text-foreground'
    }
  }

  const toastElement = (
    <div
      className={`
        fixed left-1/2 bottom-20 transform -translate-x-1/2 z-50
        px-6 py-3 rounded-xl shadow-xl font-medium
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${getTypeStyles()}
        min-w-[200px] max-w-[90vw] text-center
      `}
    >
      <div className="flex items-center justify-center gap-2">
        <span className={`text-lg ${getIconStyles()}`}>{getIcon()}</span>
        <span>{message}</span>
      </div>
    </div>
  )

  return createPortal(toastElement, document.body)
}

// Toast 管理器
export class ToastManager {
  private static instance: ToastManager
  private toasts: Map<string, ToastProps> = new Map()
  private listeners: Set<() => void> = new Set()

  static getInstance() {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager()
    }
    return ToastManager.instance
  }

  show(toast: Omit<ToastProps, 'onClose'>) {
    const id = Math.random().toString(36).substr(2, 9)
    this.toasts.set(id, {
      ...toast,
      onClose: () => this.hide(id)
    })
    this.notifyListeners()
    return id
  }

  hide(id: string) {
    this.toasts.delete(id)
    this.notifyListeners()
  }

  getToasts() {
    return Array.from(this.toasts.entries())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }
}

// Hook for using toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<[string, ToastProps]>>([])
  const manager = ToastManager.getInstance()

  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      setToasts(manager.getToasts())
    })
    return () => unsubscribe()
  }, [manager])

  const showToast = (toast: Omit<ToastProps, 'onClose'>) => {
    return manager.show(toast)
  }

  return {
    toasts,
    showToast,
    success: (message: string, duration?: number) => showToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => showToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) => showToast({ message, type: 'info', duration })
  }
}

// Toast Container Component
export function ToastContainer() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(([id, toast]) => (
        <ToastNotification
          key={id}
          {...toast}
          isVisible={true}
        />
      ))}
    </>
  )
}