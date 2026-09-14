import { Prisma } from '@prisma/client';

/** Return only fixed diagnostic labels, never database messages or metadata. */
export default function transactionDiagnostic(error) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2028') {
    return {};
  }
  const detail = typeof error.meta?.error === 'string' ? error.meta.error : '';
  const message = `${error.message}\n${detail}`;
  let category = 'unknown';
  if (/unable to start a transaction in the given time/i.test(message)) {
    category = 'start_timeout';
  } else if (
    /expired transaction|transaction.*timed out|transaction.*timeout.*exceeded/i.test(message)
  ) {
    category = 'execution_timeout';
  } else if (/connection.*closed|connection.*terminated|connection.*reset/i.test(message)) {
    category = 'connection_closed';
  } else if (/transaction already closed/i.test(message)) {
    category = 'transaction_closed';
  }
  return { transactionFailure: category };
}
