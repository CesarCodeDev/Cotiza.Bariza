$port = 8080
$root = "c:\inetpub\wwwroot\Cotiza.Bariza"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "Listening on http://localhost:$port/"
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $localPath = $request.Url.LocalPath
            if ($localPath -eq "/") { $localPath = "/Index.html" }
            
            $filePath = Join-Path $root $localPath.TrimStart('/')
            
            Write-Host "Request: $localPath -> $filePath"
            
            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                
                # Simple mime type guessing
                if ($filePath.EndsWith(".html")) { $response.ContentType = "text/html" }
                elseif ($filePath.EndsWith(".css")) { $response.ContentType = "text/css" }
                elseif ($filePath.EndsWith(".js")) { $response.ContentType = "application/javascript" }
                elseif ($filePath.EndsWith(".json")) { $response.ContentType = "application/json" }
                elseif ($filePath.EndsWith(".svg")) { $response.ContentType = "image/svg+xml" }
                
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.StatusCode = 200
            } else {
                $response.StatusCode = 404
                Write-Host "404 Not Found: $filePath"
            }
        } catch {
            Write-Host "Error processing request: $_"
            if ($null -ne $response) {
                try { $response.StatusCode = 500 } catch {}
            }
        } finally {
            if ($null -ne $response) {
                $response.Close()
            }
        }
    }
} catch {
    Write-Host "Server stopped: $_"
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
}
