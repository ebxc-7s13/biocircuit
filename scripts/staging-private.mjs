import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { access } from 'node:fs/promises'

const paths = {
  A: '.cloud/email-staging-credentials.xml',
  B: '.cloud/email-staging-account-b.xml',
}
export async function readStagingCredential(label) {
  if (!Object.hasOwn(paths, label)) throw Error('Unknown private account label')
  try {
    await access(paths[label])
  } catch {
    return null
  }
  try {
    const { stdout } = await promisify(execFile)(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); $c = Import-Clixml -LiteralPath '${paths[label]}'; @{email=$c.UserName;password=$c.GetNetworkCredential().Password} | ConvertTo-Json -Compress`,
      ],
      { windowsHide: true, maxBuffer: 4096 },
    )
    const value = JSON.parse(stdout)
    if (!value.email || !value.password) throw Error('Invalid private input')
    return value
  } catch {
    throw Error(
      'Private credentials could not be read; no sensitive diagnostic is permitted',
    )
  }
}
export async function protectStagingBaseline(value, stamp) {
  if (!/^[0-9TZ-]+$/.test(stamp)) throw Error('Invalid private backup label')
  const file = `.cloud/phase2-baseline-${stamp}.xml`
  const command = `[Console]::InputEncoding = [Text.UTF8Encoding]::new($false); $text = [Console]::In.ReadToEnd(); $secure = ConvertTo-SecureString -String $text -AsPlainText -Force; $secure | Export-Clixml -LiteralPath '${file}'`
  await new Promise((resolve, reject) => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', command],
      { windowsHide: true, stdio: ['pipe', 'ignore', 'ignore'] },
    )
    child.once('error', () =>
      reject(Error('Encrypted baseline could not be saved')),
    )
    child.once('exit', (code) =>
      code === 0
        ? resolve()
        : reject(Error('Encrypted baseline could not be saved')),
    )
    child.stdin.end(JSON.stringify(value))
    child.stdin.on('error', () =>
      reject(Error('Encrypted baseline input failed')),
    )
  })
  return file
}

export async function readProtectedBaseline(file) {
  if (!/^\.cloud\/phase2-baseline-[0-9TZ-]+\.xml$/.test(file))
    throw Error('Invalid encrypted baseline location')
  try {
    const { stdout } = await promisify(execFile)(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); $s = Import-Clixml -LiteralPath '${file}'; $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try { [Console]::Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }`,
      ],
      { windowsHide: true, maxBuffer: 8 * 1024 * 1024, timeout: 15000 },
    )
    return JSON.parse(stdout)
  } catch {
    throw Error(
      'Encrypted baseline could not be read; private diagnostics suppressed',
    )
  }
}
