export interface Job {
  id: string;
  unit: string;
  issue: string;
  status: string;
  completed: boolean;
  invoice?: string;
  followUp?: string;
}

/** Fictional examples supplied for demonstration; never customer records. */
export const jobs: readonly Job[] = [
  {
    id: '001',
    unit: '2184',
    issue: 'Trailer air leak',
    status: 'Repair completed',
    completed: true,
    invoice: 'Awaiting client review',
  },
  {
    id: '002',
    unit: '405',
    issue: 'Brake chamber replacement',
    status: 'Awaiting parts approval',
    completed: false,
    followUp: 'Contact repair manager',
  },
  {
    id: '003',
    unit: '7201',
    issue: 'Electrical system issue',
    status: 'Technician inspection pending',
    completed: false,
    followUp: 'Confirm ETA',
  },
];
