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
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Star
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
  rating?: 'helpful' | 'not_helpful' | null
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
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [sessionId] = useState(() => Date.now().toString())
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

  // Add welcome message and load suggestions when chat first opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Try to load chat history first
      loadChatHistory().then(() => {
        // If no history, show welcome message
        if (messages.length === 0) {
          const welcomeMessage: Message = {
            id: 'welcome',
            content: t('welcome' as any),
            isBot: true,
            timestamp: new Date()
          }
          setMessages([welcomeMessage])
        }
      })
      
      // Load smart suggestions
      loadSuggestions()
    }
  }, [isOpen, messages.length, t])

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/chat/simple', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const saveChatHistory = async (userMessage: string, botResponse: string) => {
    // Temporarily disabled until database is fixed
    return Promise.resolve()
  }

  const loadChatHistory = async () => {
    // Temporarily disabled until database is fixed
    return Promise.resolve()
  }

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      isBot: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSend }),
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
        
        // Save chat history
        saveChatHistory(textToSend, data.botResponse)
      }, 1000)

    } catch (error) {
      console.error('Error sending message:', error)
      setIsTyping(false)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: t('errorMessage' as any),
        isBot: true,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: t('connectionError' as any),
        description: t('connectionErrorDesc' as any),
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

  const sendQuickMessage = (message: string) => {
    sendMessage(message)
  }

  const clearChat = () => {
    // Clear from UI
    setMessages([])
    
    // Show welcome message again
    const welcomeMessage: Message = {
      id: 'welcome-new',
      content: t('welcome' as any),
      isBot: true,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
    
    toast({
      title: t('clearChat' as any),
      description: t('clearChat' as any),
    })
  }

  const rateMessage = async (messageId: string, rating: 'helpful' | 'not_helpful') => {
    try {
      // Update message rating in UI
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, rating } : msg
      ))

      // Here you could also send the rating to the server
      // await fetch('/api/chat/rating', { ... })

      toast({
        title: rating === 'helpful' ? "شكراً لك!" : "شكراً للتقييم",
        description: rating === 'helpful' ? "سعداء أن الإجابة كانت مفيدة" : "سنعمل على تحسين إجاباتنا",
      })
    } catch (error) {
      console.error('Error rating message:', error)
    }
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
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]">
            {/* Floating Animation Ring */}
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping pointer-events-none"></div>
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse pointer-events-none"></div>
            
            {/* Main Button */}
            <Button
              onClick={() => setIsOpen(true)}
              className={cn(
                "relative h-12 w-12 sm:h-16 sm:w-16 rounded-full shadow-2xl z-10",
                "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                "text-primary-foreground border-2 border-white/20",
                "transition-all duration-500 ease-out",
                "hover:scale-110 hover:shadow-3xl hover:rotate-12",
                "active:scale-95 active:rotate-0",
                "group overflow-hidden",
                className
              )}
              size="icon"
            >
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              {/* Icon with Animation */}
              <MessageCircle className="h-5 w-5 sm:h-7 sm:w-7 relative z-10 transition-transform duration-300 group-hover:scale-110" />
              
              {/* Notification Dot */}
              <div className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 rounded-full border-2 border-white animate-bounce pointer-events-none">
                <div className="h-full w-full bg-red-400 rounded-full animate-ping pointer-events-none"></div>
              </div>
            </Button>
            
            {/* Simple Tooltip */}
            <div className="hidden sm:block absolute -top-12 right-0 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              {t('chatWithUs' as any) || 'تحدث معنا'}
            </div>
          </div>
        )}

        {/* Mobile Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/20 sm:hidden" 
            onClick={(e) => {
              // Only close if clicking the backdrop, not the chat content
              if (e.target === e.currentTarget) {
                setIsOpen(false)
              }
            }}
          />
        )}

        {/* Chat Window */}
        {isOpen && (
          <Card 

            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              bottom: '1.5rem',
              right: '0.5rem',
              width: '25rem',
            
              zIndex: 99999,
            }}
            className="shadow-2xl h-[36rem] md:h-[45rem]  flex flex-col py-0 bg-white border border-gray-200 rounded-lg gap-0"
          >
            {/* Header */}
            <CardHeader className={cn(
              "flex flex-row items-center justify-between space-y-0",
              "px-3 py-3 sm:px-6 sm:py-4",
              "bg-gradient-to-r from-primary via-primary/90 to-primary/80",
              "text-primary-foreground rounded-t-lg",
              "border-b border-white/10",
              "flex-shrink-0"
            )}>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="relative">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="absolute -top-1 -right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <CardTitle className="text-base sm:text-lg font-semibold truncate">{t('title')}</CardTitle>
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0 animate-pulse hidden sm:inline-flex">
                  {t('connected' as any)}
                </Badge>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground hover:bg-white/20 transition-all duration-200 hover:scale-110"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground hover:bg-red-500/20 hover:text-red-100 transition-all duration-200 hover:scale-110"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                <CardContent className="flex-1 p-0 bg-gradient-to-b from-gray-50/50 to-white/80 overflow-hidden">
                  <ScrollArea className="h-full p-1 sm:p-1">
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
                            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md ring-1 sm:ring-2 ring-white">
                              <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                            </div>
                          )}
                          
                          <div
                            className={cn(
                              "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm shadow-sm",
                              "transition-all duration-200 hover:shadow-md",
                              message.isBot
                                ? "bg-white border border-gray-100 text-gray-700 rounded-tl-sm"
                                : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-tr-sm"
                            )}
                          >
                            <div className="whitespace-pre-wrap">
                              {formatMessageContent(message.content)}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-xs opacity-70">
                                {message.timestamp.toLocaleTimeString('ar-SA', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {message.isBot && message.id !== 'welcome' && (
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "h-6 w-6 p-0",
                                      message.rating === 'helpful' && "text-green-600 bg-green-50"
                                    )}
                                    onClick={() => rateMessage(message.id, 'helpful')}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "h-6 w-6 p-0",
                                      message.rating === 'not_helpful' && "text-red-600 bg-red-50"
                                    )}
                                    onClick={() => rateMessage(message.id, 'not_helpful')}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {!message.isBot && (
                            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md ring-1 sm:ring-2 ring-white">
                              <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex items-start space-x-2 rtl:space-x-reverse animate-in fade-in duration-300">
                          <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md ring-1 sm:ring-2 ring-white">
                            <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground animate-pulse" />
                          </div>
                          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
                            <div className="flex space-x-1 items-center">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/60 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <span className="text-xs text-gray-500 ml-1 sm:ml-2">يكتب...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                </CardContent>

                {/* Input Area - Fixed at bottom */}
                <div className="p-2 sm:p-4 border-t border-gray-100 bg-white/90 backdrop-blur-sm flex-shrink-0 sticky bottom-0">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('placeholder' as any)}
                      disabled={isLoading}
                      className="flex-1 rounded-full border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm sm:text-base"
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="rounded-full h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Smart Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mt-2 sm:mt-3">
                      <div className="text-xs text-gray-500 mb-1.5 sm:mb-2 font-medium">💡 اقتراحات ذكية:</div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {suggestions.slice(0, 2).map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className={`text-xs rounded-full border-2 transition-all duration-200 hover:scale-105 px-2 sm:px-3 py-1.5 h-auto ${
                              suggestion.priority === 'high' ? 'border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300' :
                              suggestion.priority === 'medium' ? 'border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300' :
                              'border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                            onClick={() => sendQuickMessage(suggestion.action)}
                            disabled={isLoading}
                          >
                            {suggestion.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions - Compact for mobile */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-full border-2 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 hover:scale-105 px-1.5 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-auto min-h-0"
                      onClick={() => sendQuickMessage(t('trackShipment'))}
                      disabled={isLoading}
                    >
                      <span className="hidden sm:inline">🚚 </span>{t('trackShipment')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-full border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200 hover:scale-105 px-1.5 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-auto min-h-0"
                      onClick={() => sendQuickMessage(t('pricing'))}
                      disabled={isLoading}
                    >
                      <span className="hidden sm:inline">💰 </span>{t('pricing')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105 px-1.5 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-auto min-h-0"
                      onClick={() => sendQuickMessage(t('services' as any))}
                      disabled={isLoading}
                    >
                      <span className="hidden sm:inline">⚙️ </span>{t('services' as any)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-full border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105 px-1.5 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-auto min-h-0"
                      onClick={clearChat}
                      disabled={isLoading}
                    >
                      <span className="hidden sm:inline">🗑️ </span>{t('clearChat' as any)}
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
            <CardTitle>{t('subtitle')}</CardTitle>
            <Badge variant="secondary">{t('connected' as any  )}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={isLoading}
          >
            {t('clearChat' as any)}
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
                <p>{t('subtitle')}</p>
                <p className="text-sm mt-2">{t('emptyState' as any)}</p>
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
              placeholder={t('placeholder' as any)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
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
              onClick={() => sendQuickMessage(t('trackShipment'))}
              disabled={isLoading}
            >
              {t('trackShipment')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendQuickMessage(t('pricing' as any))}
              disabled={isLoading}
            >
              {t('pricing' as any)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendQuickMessage(t('services' as any))}
              disabled={isLoading}
            >
              {t('services' as any)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendQuickMessage(t('companyInfo' as any))}
              disabled={isLoading}
            >
              {t('companyInfo' as any)}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
