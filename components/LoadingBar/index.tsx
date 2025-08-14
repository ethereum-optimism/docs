import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const LoadingBar = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let finishTimer: NodeJS.Timeout;

    const handleStart = () => {
      setLoading(true);
      setProgress(0);
      
      progressTimer = setTimeout(() => {
        setProgress(70);
      }, 200);
    };

    const handleComplete = () => {
      setProgress(100);
      finishTimer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
      clearTimeout(progressTimer);
      clearTimeout(finishTimer);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="nx-fixed nx-top-0 nx-left-0 nx-right-0 nx-z-50 nx-h-1 nx-bg-transparent">
      <div 
        className="nx-h-full nx-bg-primary-500 nx-transition-all nx-duration-300 nx-ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default LoadingBar;