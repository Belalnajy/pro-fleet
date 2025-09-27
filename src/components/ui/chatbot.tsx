'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/hooks/useTranslation'

interface Message {
  id: string
  content: string
  isBot: boolean
  timestamp: Date
  userRole?: string
  userName?: string
}

interface ChatbotProps {
  className?: string
  position?: 'fixed' | 'relative'
  defaultOpen?: boolean
}

export function Chatbot({ 
  className, 
  position = 'fixed',
  defaultOpen = false 
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { t } = useTranslation()

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  // Add welcome message when chat first opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: t('chatbot.welcome'),
        isBot: true,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isBot: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      // Simulate typing delay for better UX
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.botResponse,
          isBot: true,
          timestamp: new Date(data.timestamp),
          userRole: data.userRole,
          userName: data.userName
        }

        setMessages(prev => [...prev, botMessage])
        setIsTyping(false)
      }, 1000)

    } catch (error) {
      console.error('Error sending message:', error)
      setIsTyping(false)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: t('chatbot.errorMessage'),
        isBot: true,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: t('chatbot.connectionError'),
        description: t('chatbot.connectionErrorDesc'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ))
  }

  if (position === 'fixed') {
    return (
      <>
        {/* Chat Toggle Button */}
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-all duration-300 hover:scale-110",
              className
            )}
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <Card className={cn(
            "fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50",
            "flex flex-col transition-all duration-300",
            className
          )}>
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Bot className="h-5 w-5" />
                <CardTitle className="text-lg">{t('chatbot.title')}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {t('chatbot.connected')}
                </Badge>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex items-start space-x-2 rtl:space-x-reverse",
                            message.isBot ? "justify-start" : "justify-end"
                          )}
                        >
                          {message.isBot && (
                            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                          
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                              message.isBot
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary text-primary-foreground"
                            )}
                          >
                            <div className="whitespace-pre-wrap">
                              {formatMessageContent(message.content)}
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          {!message.isBot && (
                            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex items-start space-x-2 rtl:space-x-reverse">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <div className="bg-muted rounded-lg px-3 py-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                </CardContent>

                {/* Input Area */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('chatbot.placeholder')}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setInputValue('تتبع الشحنة')}
                      disabled={isLoading}
                    >
                      تتبع الشحنة
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setInputValue('الأسعار')}
                      disabled={isLoading}
                    >
                      الأسعار
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setInputValue('خدماتكم')}
                      disabled={isLoading}
                    >
                      الخدمات
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={clearChat}
                      disabled={isLoading}
                    >
                      مسح المحادثة
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}
      </>
    )
  }

  // Relative positioned version for embedding in pages
  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle>مساعد PRO FLEET الذكي</CardTitle>
            <Badge variant="secondary">متصل</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={isLoading}
          >
            مسح المحادثة
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Messages */}
        <ScrollArea className="h-96 w-full border rounded-lg p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p>مرحباً! أنا مساعد PRO FLEET الذكي</p>
                <p className="text-sm mt-2">اسأل عن أي شيء متعلق بخدمات النقل والشحن</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-2 rtl:space-x-reverse",
                  message.isBot ? "justify-start" : "justify-end"
                )}
              >
                {message.isBot && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.isBot
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <div className="whitespace-pre-wrap">
                    {formatMessageContent(message.content)}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {!message.isBot && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-2 rtl:space-x-reverse">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('تتبع الشحنة')}
              disabled={isLoading}
            >
              تتبع الشحنة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('الأسعار')}
              disabled={isLoading}
            >
              الأسعار
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('خدماتكم')}
              disabled={isLoading}
            >
              الخدمات
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('معلومات الشركة')}
              disabled={isLoading}
            >
              معلومات الشركة
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
