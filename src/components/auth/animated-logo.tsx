// Inspired by https://uiverse.io/dexter-st/quiet-lion-33
"use client";

import React from 'react';

export const AnimatedLogo = () => {
  return (
    <>
      <style>
        {`
          .loader-wrapper .absolute {
            position: absolute;
          }

          .loader-wrapper .inline-block {
            display: inline-block;
          }

          .loader-wrapper .loader {
            display: flex;
            margin: 0.25em 0;
            align-items: center;
          }

          .loader-wrapper .w-2 {
            width: 0.5em;
          }

          .loader-wrapper .dash {
            animation: dashArray 2s ease-in-out infinite,
              dashOffset 2s linear infinite;
          }

          .loader-wrapper .spin {
            animation: spinDashArray 2s ease-in-out infinite,
              spin 8s ease-in-out infinite,
              dashOffset 2s linear infinite;
            transform-origin: center;
          }

          @keyframes dashArray {
            0% {
              stroke-dasharray: 0 1 359 0;
            }
            50% {
              stroke-dasharray: 0 359 1 0;
            }
            100% {
              stroke-dasharray: 359 1 0 0;
            }
          }

          @keyframes spinDashArray {
            0% {
              stroke-dasharray: 270 90;
            }
            50% {
              stroke-dasharray: 0 360;
            }
            100% {
              stroke-dasharray: 270 90;
            }
          }

          @keyframes dashOffset {
            0% {
              stroke-dashoffset: 365;
            }
            100% {
              stroke-dashoffset: 5;
            }
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            12.5%,
            25% {
              transform: rotate(270deg);
            }
            37.5%,
            50% {
              transform: rotate(540deg);
            }
            62.5%,
            75% {
              transform: rotate(810deg);
            }
            87.5%,
            100% {
              transform: rotate(1080deg);
            }
          }
        `}
      </style>
      <div className="loader-wrapper">
        <div className="loader">
          <svg height={0} width={0} viewBox="0 0 64 64" className="absolute">
            <defs className="s-xJBuHA073rTt" xmlns="http://www.w3.org/2000/svg">
              <linearGradient className="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2={2} x2={0} y1={62} x1={0} id="b">
                <stop className="s-xJBuHA073rTt" stopColor="#973BED" />
                <stop className="s-xJBuHA073rTt" stopColor="#007CFF" offset={1} />
              </linearGradient>
            </defs>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height={64} width={64} className="inline-block">
            <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={8} stroke="url(#b)" d="M 54.722656,3.9726563 A 2.0002,2.0002 0 0 0 54.941406,4 h 5.007813 C 58.955121,17.046124 49.099667,27.677057 36.121094,29.580078 a 2.0002,2.0002 0 0 0 -1.708985,1.978516 V 60 H 29.587891 V 31.558594 A 2.0002,2.0002 0 0 0 27.878906,29.580078 C 14.900333,27.677057 5.0448787,17.046124 4.0507812,4 H 9.28125 c 1.231666,11.63657 10.984383,20.554048 22.6875,20.734375 a 2.0002,2.0002 0 0 0 0.02344,0 c 11.806958,0.04283 21.70649,-9.003371 22.730469,-20.7617187 z" className="dash" id="y" pathLength={360} />
          </svg>
           <h1 className="font-headline text-4xl font-bold text-primary">MyStudentHub</h1>
        </div>
      </div>
    </>
  );
};
