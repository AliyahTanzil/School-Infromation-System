import { ManagementList } from '../components/management/ManagementList';

const people = [{ id: 'p1', title: 'School administrator', subtitle: 'administrator · active', status: 'Active' }, { id: 'p2', title: 'Teaching staff', subtitle: 'teacher · active', status: 'Active' }, { id: 'p3', title: 'Operations staff', subtitle: 'staff · invited', status: 'Invited' }];
export default function PeopleRoute() { return <ManagementList title="People" description="Search people assigned to your current school context." items={people} />; }
