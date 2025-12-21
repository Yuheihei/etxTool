[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [string]$Base64Title,

    [Parameter(Mandatory=$true)]
    [string]$Base64Text,

    # 新增参数：1 代表 Ctrl+V, 2 代表 Ctrl+Shift+V, 3 代表 鼠标中键
    [Parameter(Mandatory=$true)]
    [int]$PasteMethod
)

function Decode-Safe ($base64) {
    $tempId = [Guid]::NewGuid().ToString("N")
    $tmpB64 = "$env:TEMP\b64_$tempId.txt"
    $tmpBin = "$env:TEMP\bin_$tempId.bin"
    try {
        $base64 | Out-File -FilePath $tmpB64 -Encoding ASCII
        certutil -f -decode $tmpB64 $tmpBin > $null
        if (Test-Path $tmpBin) {
            return (Get-Content $tmpBin -Raw -Encoding Unicode).Trim("`0"," ","`r","`n")
        }
    } finally {
        Remove-Item $tmpB64, $tmpBin -ErrorAction SilentlyContinue
    }
}

$WindowTitle = Decode-Safe $Base64Title
$RawText     = Decode-Safe $Base64Text

# 在受限模式下，Set-Clipboard 是最稳妥的中文传递方式
Set-Clipboard -Value $RawText

$wshell = New-Object -ComObject WScript.Shell

if ($wshell.AppActivate($WindowTitle)) {
    Start-Sleep -Milliseconds 500

    switch ($PasteMethod) {
        1 {
            # 模式 1: Ctrl + V
            $wshell.SendKeys("^v")
        }
        2 {
            # 模式 2: Ctrl + Shift + V (常见于终端或 Markdown 编辑器)
            # + 代表 Shift
            $wshell.SendKeys("^+v")
        }
        3 {
            # 模式 3: 模拟鼠标中键 (Linux 风格粘贴)
            # WScript.Shell 无法直接模拟物理鼠标点击
            # 替代方案：发送 Shift + Insert (Windows 通用的中键粘贴替代快捷键)
            $wshell.SendKeys("+{INSERT}")
        }
    }
    Write-Output "DONE"
} else {
    exit 1
}
