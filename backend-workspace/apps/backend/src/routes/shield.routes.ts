import { Router } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';

export const shieldRoutes = Router();

shieldRoutes.post('/toggle', async (req, res, next) => {
  try {
    const { enabled, apps } = req.body;
    
    // Windows hosts file path
    const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    
    if (!fs.existsSync(hostsPath)) {
      return res.json({ success: false, error: 'Hosts file not found on this system.' });
    }

    let content = fs.readFileSync(hostsPath, 'utf8');
    
    // Remove existing blocks
    const lines = content.split('\n').filter(line => !line.includes('# Antigravity Shield Block'));
    
    let blocklistPS = '';

    if (enabled && apps && apps.length > 0) {
      lines.push('\n# Antigravity Shield Block Start');
      
      let index = 1;
      apps.forEach((app: string) => {
        let domain = app.toLowerCase().trim();
        if (domain.includes('twitter')) domain = 'twitter.com';
        else if (domain.includes('youtube')) domain = 'youtube.com';
        else if (domain.includes('instagram')) domain = 'instagram.com';
        else if (domain.includes('reddit')) domain = 'reddit.com';
        else domain = `${domain}.com`;

        // Hosts file block
        lines.push(`127.0.0.1 ${domain} # Antigravity Shield Block`);
        lines.push(`127.0.0.1 www.${domain} # Antigravity Shield Block`);
        lines.push(`::1 ${domain} # Antigravity Shield Block`);
        lines.push(`::1 www.${domain} # Antigravity Shield Block`);
        
        // PowerShell Registry Block (Chrome/Edge URLBlocklist)
        blocklistPS += `Set-ItemProperty -Path $chromeBlockKey -Name "${index}" -Value "*${domain}*" -Force\n`;
        blocklistPS += `Set-ItemProperty -Path $edgeBlockKey -Name "${index}" -Value "*${domain}*" -Force\n`;
        index++;

        if (domain.includes('youtube')) {
          lines.push(`127.0.0.1 m.youtube.com # Antigravity Shield Block`);
          lines.push(`127.0.0.1 youtubei.googleapis.com # Antigravity Shield Block`);
          lines.push(`::1 m.youtube.com # Antigravity Shield Block`);
          lines.push(`::1 youtubei.googleapis.com # Antigravity Shield Block`);
          
          blocklistPS += `Set-ItemProperty -Path $chromeBlockKey -Name "${index}" -Value "*youtu.be*" -Force\n`;
          blocklistPS += `Set-ItemProperty -Path $edgeBlockKey -Name "${index}" -Value "*youtu.be*" -Force\n`;
          index++;
        }
      });
      lines.push('# Antigravity Shield Block End\n');
    }

    const newContent = lines.join('\n').replace(/\n{3,}/g, '\n\n');

    try {
      const tempPath = path.join(os.tmpdir(), 'ag_hosts.tmp');
      const scriptPath = path.join(os.tmpdir(), 'ag_shield.ps1');
      fs.writeFileSync(tempPath, newContent, 'utf8');

      // Create a PowerShell script to handle both the file copy and registry edits for DoH and URLBlocklist
      let psScriptContent = `
Copy-Item -Path "${tempPath}" -Destination "C:\\Windows\\System32\\drivers\\etc\\hosts" -Force
$chromeKey = "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome"
$edgeKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge"
$chromeBlockKey = "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome\\URLBlocklist"
$edgeBlockKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge\\URLBlocklist"
`;

      if (enabled) {
        psScriptContent += `
if (-not (Test-Path $chromeKey)) { New-Item -Path $chromeKey -Force | Out-Null }
Set-ItemProperty -Path $chromeKey -Name "DnsOverHttpsMode" -Value "off" -Force
if (-not (Test-Path $edgeKey)) { New-Item -Path $edgeKey -Force | Out-Null }
Set-ItemProperty -Path $edgeKey -Name "DnsOverHttpsMode" -Value "off" -Force

if (-not (Test-Path $chromeBlockKey)) { New-Item -Path $chromeBlockKey -Force | Out-Null }
if (-not (Test-Path $edgeBlockKey)) { New-Item -Path $edgeBlockKey -Force | Out-Null }
${blocklistPS}
`;
      } else {
        psScriptContent += `
if (Test-Path $chromeKey) { Remove-ItemProperty -Path $chromeKey -Name "DnsOverHttpsMode" -ErrorAction SilentlyContinue }
if (Test-Path $edgeKey) { Remove-ItemProperty -Path $edgeKey -Name "DnsOverHttpsMode" -ErrorAction SilentlyContinue }

if (Test-Path $chromeBlockKey) { Remove-Item -Path $chromeBlockKey -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path $edgeBlockKey) { Remove-Item -Path $edgeBlockKey -Recurse -Force -ErrorAction SilentlyContinue }
`;
      }

      psScriptContent += `\nipconfig /flushdns`;
      
      fs.writeFileSync(scriptPath, psScriptContent.trim(), 'utf8');

      // ALWAYS run elevated to ensure Registry keys are applied, regardless of whether Node.js is admin
      const psCommand = `powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ''${scriptPath}''' -Verb RunAs"`;
      
      return new Promise((resolve) => {
        exec(psCommand, (execErr) => {
          if (execErr) {
            console.error('PowerShell Elevation error:', execErr);
            resolve(res.json({
              success: false,
              permissionRequired: true,
              error: 'Administrator permission prompt declined or failed.'
            }));
          } else {
            setTimeout(() => {
              resolve(res.json({ success: true, enabled }));
            }, 1500);
          }
        });
      });
    } catch (err: any) {
      return res.json({ success: false, error: `Failed to prepare script: ${err.message}` });
    }
  } catch (err) {
    next(err);
  }
});
export default shieldRoutes;
