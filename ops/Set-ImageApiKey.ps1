param([switch]$Replace)
$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'Titans - Verify replacement OpenAI key'
$secureImageKey = Read-Host 'Paste your new OpenAI key (hidden), then press Enter' -AsSecureString
$keyPointer = [IntPtr]::Zero
try {
    $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureImageKey)
    $imageKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
    if ($imageKey -cnotmatch '^sk-[A-Za-z0-9_-]{40,300}$') { throw 'Invalid key format. Nothing was sent.' }
    $connection = New-Object System.Diagnostics.ProcessStartInfo
    $connection.FileName = 'ssh.exe'
    $connection.Arguments = '-T -i C:/Users/gages/.ssh/titans_contabo -o BatchMode=yes root@85.239.242.45 node /opt/titans-whop-auth/install-image-key.mjs'
    if ($Replace) { $connection.Arguments += ' --replace' }
    $connection.UseShellExecute = $false
    $connection.CreateNoWindow = $true
    $connection.RedirectStandardInput = $true
    $process = [System.Diagnostics.Process]::Start($connection)
    $process.StandardInput.WriteLine($imageKey)
    $process.StandardInput.Close()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) { throw 'Server setup did not finish. Tell Codex; do not paste the key into chat.' }
    Write-Host 'Done. You can close this window and tell Codex to continue.' -ForegroundColor Green
} finally {
    $imageKey = $null
    if ($keyPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer) }
    $secureImageKey.Dispose()
}
