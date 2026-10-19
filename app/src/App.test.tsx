import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const btn = (name: string | RegExp) => screen.getByRole('button', { name });

it('walks through onboarding into the food check', async () => {
  const u = userEvent.setup();
  render(<App />);

  await u.click(btn('Get started'));
  expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  expect(btn('Continue')).toBeDisabled();
  expect(screen.getByRole('radio', { name: /High blood pressure/ })).toBeDisabled();
  await u.click(screen.getByRole('radio', { name: /Type 2 diabetes/ }));
  await u.click(btn('Continue'));

  await u.click(screen.getByRole('checkbox', { name: /Gliclazide/ }));
  expect(screen.queryByText('How often do you take metformin?')).not.toBeInTheDocument();
  await u.click(screen.getByRole('checkbox', { name: /Metformin/ }));
  await u.click(screen.getByRole('radio', { name: 'Once a day' }));
  await u.click(btn('Continue'));

  await u.click(btn('Caribbean'));
  await u.click(btn('Continue'));

  await u.click(screen.getByRole('radio', { name: /Fasting/ }));
  await u.type(screen.getByLabelText(/What should we call you/), 'Kofi');
  await u.click(btn('Continue'));

  expect(screen.getByRole('heading', { name: 'You’re all set, Kofi.' })).toBeInTheDocument();
  expect(screen.getByText('Gliclazide, Metformin (once a day)')).toBeInTheDocument();
  expect(screen.getByText('5 foods')).toBeInTheDocument();
  await u.click(btn('Start checking foods'));

  expect(screen.getByRole('heading', { name: 'Can I eat this?' })).toBeInTheDocument();
  expect(screen.getByText(/Talk to your GP before you fast/)).toBeInTheDocument();
  const rum = btn(/Rum punch/);
  expect(rum).toHaveTextContent('BEST AVOIDED · MEDICINE WARNING');

  await u.click(rum);
  expect(screen.getByText('Alcohol and metformin')).toBeInTheDocument();
  await u.click(btn('Save'));
  expect(btn('Saved ✓')).toHaveAttribute('aria-pressed', 'true');

  await u.click(screen.getByRole('tab', { name: 'Saved' }));
  expect(btn(/Rum punch/)).toHaveTextContent('If you drink, keep it small');

  await u.click(screen.getByRole('tab', { name: 'Medicines' }));
  const met = screen.getByRole('region', { name: 'Metformin' });
  expect(within(met).getByText('Diabetes · once a day, with food')).toBeInTheDocument();
  expect(within(met).getByText('Vitamin B12')).toBeInTheDocument();

  await u.click(screen.getByRole('tab', { name: 'Me' }));
  expect(screen.getByRole('heading', { name: 'Kofi' })).toBeInTheDocument();
  await u.click(btn('Change my answers'));
  expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
});

it('searches for foods and admits when one is missing', async () => {
  const u = userEvent.setup();
  render(<App start="app" />);
  const q = screen.getByLabelText('Type a food or drink');
  await u.type(q, 'wa');
  expect(within(document.getElementById('nf-sug')!).getByRole('button', { name: /Waakye/ })).toHaveTextContent('FINE IN PORTIONS');
  await u.clear(q);
  await u.type(q, 'egusi');
  expect(screen.getByRole('status')).toHaveTextContent("We don't have that food yet.");
  await u.clear(q);
  await u.type(q, 'palm{Enter}');
  expect(screen.getByRole('heading', { name: 'Palm wine' })).toBeInTheDocument();
  await u.click(btn('‹ Check'));
  expect(screen.getByLabelText('Type a food or drink')).toHaveValue('');
});

it('hides the plate diagram when asked', async () => {
  const u = userEvent.setup();
  render(<App start="app" showPlate={false} />);
  await u.click(btn(/Moi moi/));
  expect(screen.queryByRole('img', { name: /Plate/ })).not.toBeInTheDocument();
  expect(screen.getByText('One or two wraps, as your protein')).toBeInTheDocument();
});

it('remembers answers between launches', async () => {
  localStorage.clear();
  const u = userEvent.setup();
  const first = render(<App remember />);
  await u.click(btn('I already have an account'));
  await u.click(btn(/Jollof rice/));
  await u.click(btn('Save'));
  first.unmount();

  render(<App remember />);
  expect(screen.getByRole('heading', { name: 'Jollof rice' })).toBeInTheDocument();
  await u.click(screen.getByRole('tab', { name: 'Me' }));
  await u.click(btn('Restart prototype'));
  expect(btn('Get started')).toBeInTheDocument();
});
