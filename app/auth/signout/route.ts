import { signOutAction } from '@/app/actions';

export async function POST() {
  return await signOutAction();
}
