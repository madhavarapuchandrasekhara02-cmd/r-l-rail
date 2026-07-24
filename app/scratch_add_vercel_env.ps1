# Read .env file line by line
Get-Content .env | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $idx = $line.IndexOf("=")
        $name = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim()
        
        # Remove surrounding quotes if any
        if ($val.StartsWith('"') -and $val.EndsWith('"')) {
            $val = $val.Substring(1, $val.Length - 2)
        } elseif ($val.StartsWith("'") -and $val.EndsWith("'")) {
            $val = $val.Substring(1, $val.Length - 2)
        }
        
        if ($name -and $val) {
            Write-Output "Adding $name to Vercel storefront..."
            # Execute vercel env add non-interactively for all three targets
            & vercel env add $name production --value $val --yes --force
            & vercel env add $name preview --value $val --yes --force
            & vercel env add $name development --value $val --yes --force
        }
    }
}
