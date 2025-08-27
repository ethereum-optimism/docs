/**
 * Banner component for chain operators pages promoting LocalChain.dev
 *
 * @format
 * @returns {ReactElement} The ChainOperatorsBanner component
 */

import type { ReactElement } from 'react';

export function ChainOperatorsBanner(): ReactElement {

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        className='banner-container'
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Info icon */}
          <div style={{ flexShrink: 0 }}>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              style={{ color: 'rgb(59, 130, 246)' }}
              className='banner-icon'
            >
              <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
              <path
                d='M12 16V12M12 8H12.01'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>

          {/* Text content */}
          <div className='banner-text'>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', lineHeight: '1.25', margin: 0 }}>
              One-click deploy is live!
            </h3>
            <p style={{ 
              fontSize: '0.875rem', 
              marginTop: '0.125rem', 
              margin: 0,
              color: 'rgb(59, 130, 246)',
              opacity: 0.8
            }} className='banner-subtitle'>
              Spin up a devnet in seconds—no infra, no config.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <a
          href='https://localchain.dev/'
          target='_blank'
          rel='noopener noreferrer'
          style={{
            flexShrink: 0,
            backgroundColor: 'rgb(59, 130, 246)',
            color: 'white',
            padding: '10px 24px',
            borderRadius: '6px',
            fontWeight: '500',
            fontSize: '14px',
            textDecoration: 'none',
            transition: 'background-color 0.2s'
          }}
          className='banner-button'
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(37, 99, 235)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(59, 130, 246)'
          }}
        >
          Try now
        </a>
      </div>

      <style jsx>{`
        .banner-container {
          background-color: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </div>
  );
}
