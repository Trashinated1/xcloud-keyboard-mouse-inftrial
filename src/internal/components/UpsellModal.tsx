import { CompoundButton, IButtonStyles, IStackTokens, Link, Stack } from '@fluentui/react';
import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Modal } from 'react-responsive-modal';
import { getExtPay } from '../../shared/payments';
import { trialDays } from '../../shared/trial';
import { showUpsellModalAction } from '../state/actions';
import { getIsAllowed, getTrialState, getUpsellModalVisibility } from '../state/selectors';
import { postGa } from '../utils/ga';
import { useAppSelector } from './hooks/reduxHooks';

const extpay = getExtPay();

// TODO pull this from a server
const price = '$0.00';

const stackTokens: IStackTokens = { childrenGap: 40 };
const buttonStyles: IButtonStyles = { root: { width: '100%' }, textContainer: { textAlign: 'center' } };

const doAndThenCloseWindow = async (promise: Promise<void>) => {
  await promise;
  setTimeout(() => {
    window.close();
  }, 100);
};

export default function UpsellModal() {
  const dispatch = useDispatch();
  const show = useAppSelector(getUpsellModalVisibility);
  const trialState = useAppSelector(getTrialState);
  const isAllowed = useAppSelector(getIsAllowed);
  useEffect(() => {
    if (show) {
      postGa('page_view', { page_title: 'Upsell modal', page_location: '/popup/upsell' });
    }
  }, [show]);

  const openPaymentPage = useCallback(() => {
    postGa('page_view', { page_title: 'Payment page', page_location: '/popup/upsell/payment' });
    postGa('begin_checkout', { currency: 'USD', value: 0.00, items: [{ item_name: 'Full Version' }] });
    doAndThenCloseWindow(extpay.openPaymentPage());
  }, []);

  const openTrialPage = useCallback(() => {
    postGa('page_view', { page_title: 'Trial page', page_location: '/popup/upsell/trial' });
    doAndThenCloseWindow(extpay.openTrialPage(`${trialDays} day`));
  }, []);

  const openLoginPage = useCallback(() => {
    postGa('page_view', { page_title: 'Login page', page_location: '/popup/upsell/login' });
    doAndThenCloseWindow(extpay.openLoginPage());
  }, []);

  const handleClose = useCallback(async () => {
    postGa('dismiss', { modal: 'upsell' });
    dispatch(showUpsellModalAction(false));
  }, [dispatch]);

  return (
    <Modal
      center
      open={show || !isAllowed}
      onClose={handleClose}
      showCloseIcon={isAllowed}
      focusTrapped={true}
      closeOnEsc={isAllowed}
    >
      <div className="explanation-modal-xmnk">
        <h2 style={{ lineHeight: '1.3em' }}>Control any game on xCloud with keyboard and mouse</h2>
        <p>
          <strong>Pay once — use all features, forever!</strong>
        </p>
        <ul>
          <li>Switch between mouse/keyboard and controller with one click of a toggle</li>
          <li>
            Create your own presets for different games, or import{' '}
            <Link
              underline
              href="https://discord.gg/5Jp9drge9m"
              target="_blank"
              rel="external nofollow noopener noreferrer"
            >
              community-made presets
            </Link>
          </li>
          <li>Manage mouse sensitivity per profile</li>
          <li>No added input delay - all keyboard/mouse input is instantly translated into virtual controller input</li>
          <li>More features coming soon</li>
        </ul>
        <Stack horizontal tokens={stackTokens} style={{ marginTop: '20px' }}>
          <Stack.Item grow>
            <CompoundButton
              disabled={trialState.status !== 'inactive'}
              secondaryText={`${trialState.remainingDays} day(s) remaining`}
              onClick={openTrialPage}
              styles={buttonStyles}
            >
              {trialState.status === 'inactive'
                ? 'Start Trial'
                : trialState.status === 'expired'
                ? 'Trial Expired'
                : 'Trial Active'}
            </CompoundButton>
          </Stack.Item>
          <Stack.Item grow>
            <CompoundButton primary secondaryText={`Only ${price}`} onClick={openPaymentPage} styles={buttonStyles}>
              Upgrade Now
            </CompoundButton>
          </Stack.Item>
        </Stack>
        <div style={{ fontSize: '0.8em', display: 'flex', justifyContent: 'space-between' }}>
          <Link href="https://davididol.com/xcloud-keyboard-mouse/tos.html" target="_blank" style={{ color: '#666' }}>
            Terms of Service
          </Link>
          <Link onClick={openLoginPage}>Already paid?</Link>
        </div>
      </div>
    </Modal>
  );
}
