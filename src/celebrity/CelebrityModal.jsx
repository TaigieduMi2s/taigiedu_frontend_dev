import React from 'react';
import { UnifiedModal, InfoRow } from '../components/UnifiedModal/UnifiedModal';

const CelebrityModal = ({ isOpen, onClose, celebrity }) => {
  if (!isOpen || !celebrity) return null;

  return (
    <UnifiedModal isOpen={isOpen} onClose={onClose} className="celebrity-modal">
      <div className="celebrity-modal-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {celebrity.name}
          <span style={{ fontSize: '18px', color: '#666', fontWeight: 'normal' }}>{celebrity.pron}</span>
        </h2>
        <div style={{ fontSize: '15px', color: '#4b5563', marginTop: '4px', fontWeight: '500' }}>{celebrity.subtitle}</div>
      </div>

      <div className="celebrity-modal-body">
        <InfoRow label="簡介">
          {celebrity.intro}
        </InfoRow>
        
        <InfoRow label="作品導讀">
          {celebrity.portfolio}
        </InfoRow>

        <div style={{ textAlign: 'right', marginTop: '20px', color: '#666', fontSize: '13px' }}>
           此為台文課學生XXX作業授權
        </div>
      </div>
    </UnifiedModal>
  );
};

export default CelebrityModal;