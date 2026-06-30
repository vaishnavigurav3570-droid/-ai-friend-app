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
    
    if (enabled && apps && apps.length > 0) {
      lines.push('\n# Antigravity Shield Block Start');
      apps.forEach((app: string) => {
        let domain = app.toLowerCase().trim();
        if (domain.includes('twitter')) {
          domain = 'twitter.com';
        } else if (domain.includes('youtube')) {
          domain = 'youtube.com';
        } else if (domain.includes('instagram')) {
          domain = 'instagram.com';
        } else if (domain.includes('reddit')) {
          domain = 'reddit.com';
        } else {
          domain = `${domain}.com`;
        }

        lines.push(`127.0.0.1 ${domain} # Antigravity Shield Block`);
        lines.push(`127.0.0.1 www.${domain} # Antigravity Shield Block`);
        lines.push(`::1 ${domain} # Antigravity Shield Block`);
        lines.push(`::1 www.${domain} # Antigravity Shield Block`);
        
        if (domain.includes('youtube')) {
          lines.push(`127.0.0.1 m.youtube.com # Antigravity Shield Block`);
          lines.push(`127.0.0.1 youtubei.googleapis.com # Antigravity Shield Block`);
          lines.push(`::1 m.youtube.com # Antigravity Shield Block`);
          lines.push(`::1 youtubei.googleapis.com # Antigravity Shield Block`);
        }
      });
      lines.push('# Antigravity Shield Block End\n');
    }

    const newContent = lines.join('\n').replace(/\n{3,}/g, '\n\n');

    try {
      fs.writeFileSync(hostsPath, newContent, 'utf8');
      return res.json({ success: true, enabled });
    } catch (writeErr: any) {
      if (writeErr.code === 'EACCES' || writeErr.code === 'EPERM') {
        try {
          const tempPath = path.join(os.tmpdir(), 'ag_hosts.tmp');
          const scriptPath = path.join(os.tmpdir(), 'ag_shield.ps1');
          fs.writeFileSync(tempPath, newContent, 'utf8');

          // Create a PowerShell script to handle both the file copy and registry edits for DoH
          const psScriptContent = `
Copy-Item -Path "${tempPath}" -Destination "C:\\Windows\\System32\\drivers\\etc\\hosts" -Force
$chromeKey = "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome"
if (-not (Test-Path $chromeKey)) { New-Item -Path $chromeKey -Force | Out-Null }
Set-ItemProperty -Path $chromeKey -Name "DnsOverHttpsMode" -Value "off" -Force
$edgeKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge"
if (-not (Test-Path $edgeKey)) { New-Item -Path $edgeKey -Force | Out-Null }
Set-ItemProperty -Path $edgeKey -Name "DnsOverHttpsMode" -Value "off" -Force
ipconfig /flushdns
          `.trim();
          fs.writeFileSync(scriptPath, psScriptContent, 'utf8');

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
        } catch (tempWriteErr: any) {
          return res.json({ success: false, error: `Failed to write temp file: ${tempWriteErr.message}` });
        }
      }
      throw writeErr;
    }
  } catch (err) {
    next(err);
  }
});
export default shieldRoutes;
