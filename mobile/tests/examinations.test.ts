import { validateScore } from '../services/examinations/contracts';

if (validateScore(75, 100) !== null) throw new Error('valid score rejected');
if (!validateScore(101, 100)) throw new Error('overscore accepted');
if (!validateScore(null, 100)) throw new Error('missing score accepted');
