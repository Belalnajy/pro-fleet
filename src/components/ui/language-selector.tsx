"use client"

import { Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/providers/language-provider"
import { languages, availableLanguages } from '@/lib/translations'
import { cn } from "@/lib/utils"

interface LanguageSelectorProps {
  variant?: "default" | "compact"
  showLabel?: boolean
  align?: "start" | "center" | "end"
}

export function LanguageSelector({ 
  variant = "default", 
  showLabel = true, 
  align = "end" 
}: LanguageSelectorProps) {
  const { language, setLanguage, t, dir } = useLanguage()

  const currentLanguage = languages[language]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={variant === "compact" ? "sm" : "default"}
          className={cn(
            "gap-2",
            dir === "rtl" && "flex-row-reverse"
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="flex items-center gap-1">
            {currentLanguage.flag}
            {showLabel && (
              <span className={variant === "compact" ? "hidden sm:inline" : ""}>
                {currentLanguage.name}
              </span>
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          {t('selectLanguage') || 'Select Language'}
        </div>
        <DropdownMenuSeparator />
        {availableLanguages.map((code) => {
          const config = languages[code]
          const isSelected = language === code
          
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setLanguage(code)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                isSelected && "bg-accent",
                dir === "rtl" && "flex-row-reverse"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{config.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {config.dir === 'rtl' ? 'Right to Left' : 'Left to Right'}
                  </span>
                </div>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}