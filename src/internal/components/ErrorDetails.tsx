import { SerializedError } from '@reduxjs/toolkit';
import React, { useEffect } from 'react';
import { postGa } from '../utils/ga';

interface ErrorDetailsProps {
  error?: SerializedError;
}

export default function ErrorDetails({ error }: ErrorDetailsProps) {
  useEffect(() => {
    postGa('exception', {
      description: 'ext storage read' + (error ? `: ${error.message}` : ''),
      fatal: true,
    });
  }, [error]);
  return (
    <div className="error">
      <p>Unable to access settings from storage</p>
      {error ? <p>Error: &quot;{error.message}&quot;</p> : null}
      <p>
        Please post this{' '}
        <a href="https://github.com/idolize/xcloud-keyboard-mouse/issues/" target="_blank" rel="noreferrer">
          issue to GitHub
        </a>
      </p>
    </div>
  );
}
