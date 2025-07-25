import React from 'react';
import './LoadingPet.css';

interface LoadingPetProps {
  message?: string;
}

export default function LoadingPet({ message = "Đang tải tệp..." }: LoadingPetProps) {
  return (
    <div className="loading-pet-container">
      {/* 3D Cat Animation */}
      <div className="pet-wrapper">
        <div className="pet-container">
          {/* Cat Body */}
          <div className="cat-body">
            {/* Head */}
            <div className="cat-head">
              {/* Ears */}
              <div className="cat-ear cat-ear-left"></div>
              <div className="cat-ear cat-ear-right"></div>
              
              {/* Eyes */}
              <div className="cat-eyes">
                <div className="cat-eye cat-eye-left">
                  <div className="cat-pupil"></div>
                </div>
                <div className="cat-eye cat-eye-right">
                  <div className="cat-pupil"></div>
                </div>
              </div>
              
              {/* Nose */}
              <div className="cat-nose"></div>
              
              {/* Mouth */}
              <div className="cat-mouth"></div>
            </div>
            
            {/* Body */}
            <div className="cat-torso"></div>
            
            {/* Legs */}
            <div className="cat-leg cat-leg-1"></div>
            <div className="cat-leg cat-leg-2"></div>
            <div className="cat-leg cat-leg-3"></div>
            <div className="cat-leg cat-leg-4"></div>
            
            {/* Tail */}
            <div className="cat-tail"></div>
          </div>
          
          {/* Loading dots */}
          <div className="loading-dots">
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
          </div>
        </div>
      </div>
      
      {/* Loading Message */}
      <div className="loading-message">
        <h3 className="loading-title">{message}</h3>
        <p className="loading-subtitle">Vui lòng đợi trong giây lát...</p>
      </div>
    </div>
  );
}