#!/usr/bin/osascript

on run argv
    set windowTitle to item 1 of argv
    
    try
        tell application "System Events"
            set frontmost of every process whose name contains windowTitle to true
        end tell
        
        log "成功：窗口 '" & windowTitle & "' 已激活。"
    on error errMsg
        log "失败：未找到标题为 '" & windowTitle & "' 的窗口。错误：" & errMsg
    end try
end run