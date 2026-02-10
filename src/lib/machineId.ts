import { createHash } from 'crypto';
import { networkInterfaces, hostname, cpus, platform, arch } from 'os';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Lock file path - stored in project root
const LOCK_FILE_PATH = join(process.cwd(), 'machine.lock');

/**
 * Get the primary MAC address from network interfaces
 */
function getMacAddress(): string {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netInterface = interfaces[name];
    if (netInterface) {
      for (const iface of netInterface) {
        // Skip internal and loopback interfaces
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          return iface.mac;
        }
      }
    }
  }
  return 'unknown-mac';
}

/**
 * Generate a unique machine ID based on hardware characteristics
 */
export function generateMachineId(): string {
  const components = [
    getMacAddress(),
    hostname(),
    cpus()[0]?.model || 'unknown-cpu',
    platform(),
    arch(),
    // Adding CPU count as additional identifier
    cpus().length.toString(),
  ];

  // Combine all components and hash them
  const combinedString = components.join('|');
  const hash = createHash('sha256').update(combinedString).digest('hex');
  
  // Return first 32 characters for a shorter ID
  return hash.substring(0, 32);
}

/**
 * Get the saved machine ID from lock file
 */
export function getSavedMachineId(): string | null {
  try {
    if (existsSync(LOCK_FILE_PATH)) {
      const content = readFileSync(LOCK_FILE_PATH, 'utf-8').trim();
      // Parse the lock file content
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.startsWith('MACHINE_ID=')) {
          return line.replace('MACHINE_ID=', '').trim();
        }
      }
    }
  } catch (error) {
    console.error('Error reading lock file:', error);
  }
  return null;
}

/**
 * Save machine ID to lock file
 */
export function saveMachineId(machineId: string): boolean {
  try {
    const lockContent = `# Machine Lock File - DO NOT DELETE OR MODIFY
# This file binds the application to this computer
# Generated: ${new Date().toISOString()}

MACHINE_ID=${machineId}
HOSTNAME=${hostname()}
PLATFORM=${platform()}
REGISTERED_AT=${new Date().toISOString()}
`;
    writeFileSync(LOCK_FILE_PATH, lockContent, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving lock file:', error);
    return false;
  }
}

/**
 * Verify if current machine is authorized
 */
export function verifyMachine(): { 
  authorized: boolean; 
  currentId: string; 
  savedId: string | null;
  isFirstRun: boolean;
  message: string;
} {
  const currentId = generateMachineId();
  const savedId = getSavedMachineId();

  // First run - no lock file exists
  if (!savedId) {
    const saved = saveMachineId(currentId);
    if (saved) {
      return {
        authorized: true,
        currentId,
        savedId: currentId,
        isFirstRun: true,
        message: 'Machine registered successfully. This computer is now authorized.',
      };
    } else {
      return {
        authorized: false,
        currentId,
        savedId: null,
        isFirstRun: true,
        message: 'Failed to create lock file. Please check file permissions.',
      };
    }
  }

  // Check if current machine matches saved machine
  if (currentId === savedId) {
    return {
      authorized: true,
      currentId,
      savedId,
      isFirstRun: false,
      message: 'Machine verified successfully.',
    };
  }

  // Machine ID mismatch - unauthorized access
  return {
    authorized: false,
    currentId,
    savedId,
    isFirstRun: false,
    message: 'Unauthorized access. This application is registered to a different computer.',
  };
}

/**
 * Get machine info for display purposes
 */
export function getMachineInfo(): {
  hostname: string;
  platform: string;
  arch: string;
  cpuModel: string;
  machineId: string;
} {
  return {
    hostname: hostname(),
    platform: platform(),
    arch: arch(),
    cpuModel: cpus()[0]?.model || 'Unknown',
    machineId: generateMachineId(),
  };
}
