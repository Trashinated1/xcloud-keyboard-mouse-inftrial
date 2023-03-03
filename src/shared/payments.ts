import ExtPay from 'extpay';
import { postGa } from '../internal/utils/ga';
import { Payment } from './types';

export function getExtPay() {
  return ExtPay('keyboard-and-mouse-for-xbox-xcloud');
}

export async function getPayment() {
  try {
    return await getExtPay().getUser();
  } catch (error) {
    postGa('exception', {
      description: 'extpay.getUser failure' + (error ? `: ${(error as any).message}` : ''),
      fatal: true,
    });
    throw error;
  }
}

export const notPaidPayment: Payment = {
  paid: false,
  paidAt: null,
  installedAt: new Date().getTime(),
  trialStartedAt: null,
};
