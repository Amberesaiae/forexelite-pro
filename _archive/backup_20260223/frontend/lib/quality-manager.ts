// Quality manager for adaptive Three.js rendering
// Provides device-aware quality settings to balance performance and visual fidelity

export interface DeviceProfile {
  tier: 1 | 2 | 3; // 1=high-end, 2=mid-range, 3=low-end
  memoryGB: number;
  cpuCores: number;
  webGL2: boolean;
  isMobile: boolean;
  batteryLevel?: number; // 0-1, if available
}

export interface QualitySettings {
  particleCount: number;
  pixelRatio: number;
  antialias: boolean;
  shadowMap: boolean;
  postProcessing: boolean;
  maxPolygons: number;
  lodBias: number;
  maxFPS: number;
}

const QUALITY_PRESETS: Record<number, QualitySettings> = {
  1: { // High-end (gaming PC, modern flagship phone)
    particleCount: 8000,
    pixelRatio: 2,
    antialias: true,
    shadowMap: true,
    postProcessing: true,
    maxPolygons: 20000,
    lodBias: 1.0,
    maxFPS: 60,
  },
  2: { // Mid-range (typical desktop, mid-tier phone)
    particleCount: 3000,
    pixelRatio: 1.5,
    antialias: false,
    shadowMap: false,
    postProcessing: false,
    maxPolygons: 10000,
    lodBias: 0.75,
    maxFPS: 60,
  },
  3: { // Low-end (budget phone, old hardware)
    particleCount: 1000,
    pixelRatio: 1,
    antialias: false,
    shadowMap: false,
    postProcessing: false,
    maxPolygons: 5000,
    lodBias: 0.5,
    maxFPS: 45, // Accept lower FPS on low-end
  },
};

export function detectDeviceProfile(): DeviceProfile {
  // Return default for SSR
  if (typeof window === 'undefined') {
    return { tier: 2, memoryGB: 8, cpuCores: 4, webGL2: true, isMobile: false };
  }
  
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cpuCores = navigator.hardwareConcurrency || 4;
  const memoryGB = (navigator as any).deviceMemory || 8; // Chrome only

  // Detect WebGL2 support
  const canvas = document.createElement('canvas');
  const webGL2 = !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));

  // Try to get battery level (may be denied)
  let batteryLevel: number | undefined;
  if ('getBattery' in navigator) {
    (navigator as any).getBattery?.().then((battery: any) => {
      if (battery.level !== undefined) {
        batteryLevel = battery.level;
      }
    }).catch(() => {
      // Battery API not available or permission denied
    });
  }

  // Determine device tier based on specs
  let tier: 1 | 2 | 3;

  if (isMobile) {
    // Mobile detection
    if (cpuCores >= 8 && memoryGB >= 6 && webGL2) {
      tier = 1; // Flagship phone
    } else if (cpuCores >= 4 && memoryGB >= 4) {
      tier = 2; // Mid-tier phone
    } else {
      tier = 3; // Budget/old phone
    }
  } else {
    // Desktop detection
    if (cpuCores >= 8 && memoryGB >= 16 && webGL2) {
      tier = 1; // High-end desktop
    } else if (cpuCores >= 4 && memoryGB >= 8) {
      tier = 2; // Mid-range desktop
    } else {
      tier = 3; // Low-end/budget desktop
    }
  }

  // Battery saver: downgrade if battery low (<20%) and not plugged in
  if (batteryLevel !== undefined && batteryLevel < 0.2) {
    tier = Math.min(3, tier + 1) as 1 | 2 | 3;
  }

  return { tier, memoryGB, cpuCores, webGL2, isMobile, batteryLevel };
}

export function getQualitySettings(profile?: DeviceProfile): QualitySettings {
  // Return default for SSR
  if (typeof profile === 'undefined') {
    return QUALITY_PRESETS[2];
  }
  const deviceProfile = profile;
  return QUALITY_PRESETS[deviceProfile.tier];
}

export function getCanvasDPROptimized(profile?: DeviceProfile): number[] {
  const settings = getQualitySettings(profile);
  // Return [min, max] for React Three Fiber dpr prop
  return [1, settings.pixelRatio];
}

// Types are already exported via interface declarations above
