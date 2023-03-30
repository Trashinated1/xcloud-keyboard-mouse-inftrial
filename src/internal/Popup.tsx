import { Spinner, SpinnerSize } from '@fluentui/react';
import classnames from 'classnames';
import React, { useEffect } from 'react';
import Header from './components/Header';
import { useAppSelector } from './components/hooks/reduxHooks';
import useGamepadConfigs from './components/hooks/useGamepadConfigs';
import useGameName from './components/hooks/useGameStatus';
import MainConfigEditor from './components/MainConfigEditor';
import UpsellModal from './components/UpsellModal';
import { getPaymentStatus } from './state/selectors';
import { postGa } from './utils/ga';

export default function Popup() {
  const { activeConfig, status, isEnabled, configs, error } = useGamepadConfigs();
  const { gameName } = useGameName();
  const paymentStatus = useAppSelector(getPaymentStatus);
  useEffect(() => {
    postGa('page_view', { page_title: 'Popup config editor', page_location: '/popup' });
  }, []);

  return (
    <div className={classnames('popup vertical', paymentStatus !== 'success' && 'centered')}>
      {paymentStatus === 'success' ? (
        <>
          <Header activeConfig={activeConfig} isEnabled={isEnabled} gameName={gameName} />
          <MainConfigEditor
            activeConfig={activeConfig}
            isEnabled={isEnabled}
            status={status}
            configs={configs}
            error={error}
          />
          <UpsellModal />
        </>
      ) : paymentStatus === 'failure' ? (
        <div className="error">
          <p>Unable to load payment details. Please close and reopen this window to try again.</p>
        </div>
      ) : (
        <Spinner size={SpinnerSize.large} />
      )}
    </div>
  );
}
