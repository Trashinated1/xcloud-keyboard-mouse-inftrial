import { IconButton, IContextualMenuItem } from '@fluentui/react';
import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { fluentXboxTheme } from './theme';
import { getPayment } from '../state/selectors';
import { showUpsellModalAction } from '../state/actions';
import { useAppSelector } from './hooks/reduxHooks';
import { postGa } from '../utils/ga';

const specialColor = { color: '#D2042D' };

const getMenuItems = (isPaid: boolean, onPay: () => void): IContextualMenuItem[] => [
  {
    key: 'version',
    text: `Version ${chrome.runtime.getManifest().version}`,
    disabled: true,
  },
  {
    key: 'upgrade',
    text: isPaid ? 'Upgraded!' : 'Upgrade',
    style: isPaid ? undefined : specialColor,
    disabled: isPaid,
    onClick: isPaid ? undefined : onPay,
    iconProps: { iconName: 'Diamond', style: isPaid ? undefined : specialColor },
  },
  {
    key: 'about',
    text: 'About',
    href: chrome.runtime.getURL('/about.html'),
    target: '_blank',
    iconProps: { iconName: 'InfoSolid' },
  },
  {
    key: 'issues',
    text: 'File an issue',
    href: 'https://github.com/idolize/xcloud-keyboard-mouse/issues',
    target: '_blank',
    iconProps: { iconName: 'IssueTracking' },
  },
  {
    key: 'testGamepad',
    text: 'Test your preset',
    href: 'https://gamepad-tester.com',
    target: '_blank',
    iconProps: { iconName: 'TestBeakerSolid' },
  },
  {
    key: 'xcloud',
    text: 'Go to xCloud',
    href: 'https://xbox.com/play',
    target: '_blank',
    iconProps: { iconName: 'Cloud' },
  },
];

export default function HeaderMoreOptions() {
  const dispatch = useDispatch();
  const payment = useAppSelector(getPayment);

  const handlePayClick = useCallback(() => {
    postGa('btn_click', { name: 'upgrade-menu-item' });
    dispatch(showUpsellModalAction(true));
  }, [dispatch]);

  const menuItems = useMemo(() => {
    return getMenuItems(payment.paid, handlePayClick);
  }, [payment.paid, handlePayClick]);

  return (
    <div className="relative">
      <IconButton
        menuProps={{
          items: menuItems,
          theme: fluentXboxTheme,
          calloutProps: {
            // Needed to fix issue in Safari
            preventDismissOnEvent: (e) => e.type === 'resize',
          },
        }}
        role="menuitem"
        title="More info"
      />
      {!payment.paid ? <div className="unpaid-dot" /> : null}
    </div>
  );
}
