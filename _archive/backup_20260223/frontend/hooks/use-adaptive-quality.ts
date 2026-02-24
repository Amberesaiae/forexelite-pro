'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { detectDeviceProfile, getQualitySettings, QualitySettings, DeviceProfile } from '@/lib/quality-manager';

// FPS monitoring threshold (samples)
const FPS_SAMPLE_SIZE = 60;
const FPS_DROP_THRESHOLD = 45; // Reduce quality if below this
const FPS_SUSTAIN_THRESHOLD = 55; // Increase quality if above this for X seconds
const FPS_SUSTAIN_DURATION = 5000; // ms

export function useAdaptiveQuality() {
  // Initialize with default values for SSR
  const [profile, setProfile] = useState<DeviceProfile>(() => ({ tier: 2, memoryGB: 8, cpuCores: 4, webGL2: true, isMobile: false }));
  const [quality, setQuality] = useState<QualitySettings>(() => getQualitySettings({ tier: 2, memoryGB: 8, cpuCores: 4, webGL2: true, isMobile: false }));
  const [fps, setFps] = useState<number>(60);

  // FPS tracking
  const frameTimes = useRef<number[]>([]);
  const lastFrameTime = useRef<number>(performance.now());
  const highFPSTimer = useRef<NodeJS.Timeout | null>(null);

  // Detect device profile on client side only
  useEffect(() => {
    const detectedProfile = detectDeviceProfile();
    setProfile(detectedProfile);
    setQuality(getQualitySettings(detectedProfile));
  }, []);

  // Measure FPS
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const currentFPS = frames;
        setFps(currentFPS);
        frames = 0;
        lastTime = currentTime;

        // Auto-adjust quality based on FPS
        if (currentFPS < FPS_DROP_THRESHOLD) {
          // Immediately downgrade if FPS too low
          downgradeQuality();
        } else if (currentFPS > FPS_SUSTAIN_THRESHOLD) {
          // Upgrade if FPS high for sustained period
          if (!highFPSTimer.current) {
            highFPSTimer.current = setTimeout(() => {
              upgradeQuality();
              highFPSTimer.current = null;
            }, FPS_SUSTAIN_DURATION);
          }
        } else {
          // Cancel upgrade timer if FPS not consistently high
          if (highFPSTimer.current) {
            clearTimeout(highFPSTimer.current);
            highFPSTimer.current = null;
          }
        }
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (highFPSTimer.current) {
        clearTimeout(highFPSTimer.current);
      }
    };
  }, [profile.tier]);

  const downgradeQuality = useCallback(() => {
    setProfile(prev => {
      const currentTier = prev.tier;
      if (currentTier === 3) return prev; // Already lowest

      const newTier = (currentTier + 1) as 2 | 3;
      const newProfile = { ...prev, tier: newTier };
      setQuality(getQualitySettings(newProfile));
      return newProfile;
    });
  }, []);

  const upgradeQuality = useCallback(() => {
    setProfile(prev => {
      const currentTier = prev.tier;
      if (currentTier === 1) return prev; // Already highest

      const newTier = (currentTier - 1) as 1 | 2;
      const newProfile = { ...prev, tier: newTier };
      setQuality(getQualitySettings(newProfile));
      return newProfile;
    });
  }, []);

  const manualQualityOverride = useCallback((tier: 1 | 2 | 3) => {
    setProfile(prev => ({ ...prev, tier }));
    setQuality(getQualitySettings({ ...profile, tier }));
  }, [profile]);

  return {
    profile,
    quality,
    fps,
    manualQualityOverride,
    downgradeQuality,
    upgradeQuality,
  };
}

export type { QualitySettings, DeviceProfile };
