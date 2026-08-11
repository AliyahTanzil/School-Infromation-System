import { useMemo, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Mail,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

/* eslint-disable react/prop-types */
const seedNotifications = [
  {
    id: 1,
    type: 'academic',
    title: 'New feedback released',
    body: 'Ms. Adebayo released feedback on your persuasive essay.',
    time: '8 min ago',
    date: 'Today',
    unread: true,
    priority: 'High',
    icon: Sparkles,
    color: 'mint',
    link: '/feedback',
  },
  {
    id: 2,
    type: 'calendar',
    title: 'Upcoming class reminder',
    body: 'Algebra II begins in 30 minutes in Room 204.',
    time: '42 min ago',
    date: 'Today',
    unread: true,
    priority: 'Normal',
    icon: Clock3,
    color: 'blue',
    link: '/calendar',
  },
  {
    id: 3,
    type: 'announcement',
    title: 'School assembly moved',
    body: 'Friday assembly has moved to the main hall at 10:00 AM.',
    time: 'Yesterday',
    date: 'Yesterday',
    unread: false,
    priority: 'High',
    icon: Megaphone,
    color: 'amber',
    link: '/announcements',
  },
  {
    id: 4,
    type: 'message',
    title: 'New message from Mr. Okafor',
    body: 'Please check the updated science project brief.',
    time: 'Yesterday',
    date: 'Yesterday',
    unread: false,
    priority: 'Normal',
    icon: MessageSquare,
    color: 'violet',
    link: '/communication',
  },
  {
    id: 5,
    type: 'academic',
    title: 'Quiz results are ready',
    body: 'Your World History quiz has been graded: 92%.',
    time: 'Mon, 14 Oct',
    date: 'Earlier',
    unread: false,
    priority: 'Normal',
    icon: CheckCheck,
    color: 'mint',
    link: '/gradebook',
  },
];

const preferences = [
  ['academic', 'Academic updates', 'Grades, feedback, submissions, and assessment results'],
  ['calendar', 'Calendar reminders', 'Classes, deadlines, meetings, and schedule changes'],
  ['announcement', 'School announcements', 'Campus news, events, holidays, and urgent alerts'],
  ['message', 'Direct messages', 'Messages from teachers, staff, and classmates'],
];

function ChannelIcon({ channel }) {
  const Icon = channel === 'email' ? Mail : channel === 'push' ? Smartphone : Bell;
  return <Icon size={14} />;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState(seedNotifications);
  const [tab, setTab] = useState('inbox');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(seedNotifications[0]);
  const [toast, setToast] = useState('');
  const [enabled, setEnabled] = useState(() =>
    Object.fromEntries(preferences.map(([key]) => [key, true]))
  );
  const [channels, setChannels] = useState({ inApp: true, email: true, push: true, sms: false });

  const visible = useMemo(
    () =>
      notifications.filter(
        (item) =>
          filter === 'all' ||
          (filter === 'unread' ? item.unread : item.priority.toLowerCase() === filter)
      ),
    [notifications, filter]
  );
  const unread = notifications.filter((item) => item.unread).length;
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };
  const markRead = (id) => {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };
  const select = (item) => {
    setSelected(item);
    markRead(item.id);
  };

  return (
    <main className="notification-shell">
      <header className="notification-header">
        <div>
          <p className="eyebrow">Module 51.13 · Communication</p>
          <h1>Notification center</h1>
          <p>
            One calm place for academic updates, schedule changes, messages, and school-wide alerts.
            Your preferences apply across every SAIS channel.
          </p>
        </div>
        <div className="notification-header-actions">
          <span className="privacy-chip">
            <ShieldCheck size={14} /> Private to you
          </span>
          <button className="notification-ghost" onClick={() => setTab('preferences')}>
            <Settings2 size={15} /> Preferences
          </button>
        </div>
      </header>
      <nav className="notification-tabs">
        <button className={tab === 'inbox' ? 'active' : ''} onClick={() => setTab('inbox')}>
          <Bell size={15} /> Inbox {unread > 0 && <b>{unread}</b>}
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          <Clock3 size={15} /> History
        </button>
        <button
          className={tab === 'preferences' ? 'active' : ''}
          onClick={() => setTab('preferences')}
        >
          <Settings2 size={15} /> Preferences
        </button>
        <button className={tab === 'analytics' ? 'active' : ''} onClick={() => setTab('analytics')}>
          <Sparkles size={15} /> Delivery health
        </button>
      </nav>
      {tab === 'inbox' || tab === 'history' ? (
        <section className="notification-layout">
          <aside className="notification-list-panel">
            <div className="notification-list-heading">
              <div>
                <span className="section-kicker">
                  {tab === 'inbox' ? 'Your inbox' : 'Notification history'}
                </span>
                <h2>{tab === 'inbox' ? 'Stay in the loop' : 'Every delivery'}</h2>
              </div>
              <button className="icon-button" aria-label="More options">
                <MoreHorizontal size={16} />
              </button>
            </div>
            <div className="notification-filter-row">
              {[
                ['all', 'All'],
                ['unread', 'Unread'],
                ['high', 'Priority'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={filter === value ? 'active' : ''}
                  onClick={() => setFilter(value)}
                >
                  {label}
                  {value === 'unread' && <span>{unread}</span>}
                </button>
              ))}
            </div>
            <div className="notification-items">
              {visible.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`notification-item ${selected?.id === item.id ? 'selected' : ''} ${item.unread ? 'unread' : ''}`}
                    onClick={() => select(item)}
                  >
                    <span className={`notification-icon ${item.color}`}>
                      <Icon size={15} />
                    </span>
                    <span className="notification-copy">
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                      <small>{item.time}</small>
                    </span>
                    <span className="notification-item-meta">
                      {item.unread && <i />}
                      {item.priority === 'High' && <b>Priority</b>}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="notification-list-footer">
              <ShieldCheck size={14} />
              <span>
                <strong>Respecting your focus</strong>
                <small>Quiet hours are active from 9:00 PM to 7:00 AM.</small>
              </span>
            </div>
          </aside>
          <article className="notification-detail">
            <div className="detail-toolbar">
              <span className={`priority-badge ${selected?.priority === 'High' ? 'high' : ''}`}>
                {selected?.priority} priority
              </span>
              <div>
                <button
                  className="icon-button"
                  onClick={() => {
                    if (selected) markRead(selected.id);
                    notify('Marked as read');
                  }}
                  aria-label="Mark as read"
                >
                  <Check size={15} />
                </button>
                <button className="icon-button" aria-label="Close detail">
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className={`large-notification-icon ${selected?.color}`}>
              <selected.icon size={22} />
            </div>
            <p className="section-kicker">
              {selected?.date} · {selected?.type}
            </p>
            <h2>{selected?.title}</h2>
            <p className="notification-message">{selected?.body}</p>
            <div className="notification-source">
              <span className="source-avatar">
                <UserRound size={15} />
              </span>
              <span>
                <strong>SAIS Academic Office</strong>
                <small>Sent through the {selected?.type} channel</small>
              </span>
            </div>
            <div className="notification-actions">
              <button
                className="notification-primary"
                onClick={() => notify(`Opening ${selected?.link}`)}
              >
                Open related page <ChevronRight size={15} />
              </button>
              <button
                className="notification-ghost"
                onClick={() => notify('Notification archived')}
              >
                Archive
              </button>
            </div>
            <div className="delivery-card">
              <div className="card-heading">
                <div>
                  <span className="section-kicker">Delivery record</span>
                  <h3>Sent securely</h3>
                </div>
                <span className="delivered-pill">
                  <CheckCheck size={13} /> Delivered
                </span>
              </div>
              <div className="delivery-channels">
                <span>
                  <ChannelIcon channel="inApp" /> In-app <b>Delivered</b>
                </span>
                <span>
                  <ChannelIcon channel="email" /> Email <b>Delivered</b>
                </span>
                <span>
                  <ChannelIcon channel="push" /> Push <b>Delivered</b>
                </span>
              </div>
            </div>
          </article>
        </section>
      ) : tab === 'preferences' ? (
        <Preferences
          enabled={enabled}
          setEnabled={setEnabled}
          channels={channels}
          setChannels={setChannels}
          notify={notify}
        />
      ) : (
        <DeliveryAnalytics notify={notify} />
      )}
      {toast && (
        <div className="notification-toast">
          <Check size={15} /> {toast}
        </div>
      )}
    </main>
  );
}

function Preferences({ enabled, setEnabled, channels, setChannels, notify }) {
  return (
    <section className="preferences-layout">
      <div className="preferences-main">
        <span className="section-kicker">Control your signal</span>
        <h2>Notification preferences</h2>
        <p className="preferences-intro">
          Choose what reaches you and where it appears. Urgent school alerts always remain enabled.
        </p>
        <div className="preference-card">
          <h3>Topics</h3>
          {preferences.map(([key, title, description]) => (
            <label className="preference-row" key={key}>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <input
                type="checkbox"
                checked={enabled[key]}
                onChange={() => {
                  setEnabled((state) => ({ ...state, [key]: !state[key] }));
                  notify(`${title} preference updated`);
                }}
              />
            </label>
          ))}
        </div>
        <div className="preference-card">
          <h3>Delivery channels</h3>
          {Object.entries(channels).map(([key, value]) => (
            <label className="preference-row channel-row" key={key}>
              <span>
                <ChannelIcon channel={key} />
                <strong>
                  {key === 'inApp' ? 'In-app inbox' : key[0].toUpperCase() + key.slice(1)}
                </strong>
              </span>
              <input
                type="checkbox"
                checked={value}
                onChange={() => setChannels((state) => ({ ...state, [key]: !state[key] }))}
              />
            </label>
          ))}
        </div>
      </div>
      <aside className="preference-aside">
        <ShieldCheck size={22} />
        <h3>Your privacy, by design</h3>
        <p>
          Notification preferences are stored with your account and never shared with classmates or
          external services.
        </p>
        <div className="quiet-hours">
          <Clock3 size={16} />
          <span>
            <strong>Quiet hours</strong>
            <small>9:00 PM – 7:00 AM</small>
          </span>
        </div>
      </aside>
    </section>
  );
}
function DeliveryAnalytics({ notify }) {
  return (
    <section className="analytics-layout">
      <div className="analytics-hero">
        <div>
          <span className="section-kicker">Last 30 days</span>
          <h2>Delivery health</h2>
          <p>Communication is moving reliably across your school community.</p>
        </div>
        <span className="health-score">
          98.7<small>%</small>
        </span>
      </div>
      <div className="analytics-stats">
        <article>
          <span>Delivered</span>
          <strong>12,842</strong>
          <b>+8.4% vs last month</b>
        </article>
        <article>
          <span>Read rate</span>
          <strong>84.6%</strong>
          <b>+3.1% vs last month</b>
        </article>
        <article>
          <span>Failed deliveries</span>
          <strong>23</strong>
          <b className="warning">0.18% of total</b>
        </article>
      </div>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Channel performance</span>
              <h3>Delivery by channel</h3>
            </div>
            <button onClick={() => notify('Export queued')}>Export report</button>
          </div>
          {[
            ['In-app', '6,420', '100%', 'mint'],
            ['Email', '4,218', '98.9%', 'blue'],
            ['Push', '2,104', '97.4%', 'violet'],
            ['SMS', '100', '94.2%', 'amber'],
          ].map(([label, value, rate, color]) => (
            <div className="health-row" key={label}>
              <span className={`health-dot ${color}`} />
              <strong>{label}</strong>
              <span className="health-bar">
                <i style={{ width: rate }} />
              </span>
              <b>{value}</b>
              <small>{rate}</small>
            </div>
          ))}
        </div>
        <div className="analytics-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Operations</span>
              <h3>Queue activity</h3>
            </div>
            <span className="live-pill">Live</span>
          </div>
          <div className="queue-status">
            <span>Processing queue</span>
            <strong>0 pending</strong>
          </div>
          <div className="queue-status">
            <span>Scheduled messages</span>
            <strong>18 upcoming</strong>
          </div>
          <div className="queue-status">
            <span>Retry queue</span>
            <strong>4 recovering</strong>
          </div>
          <div className="queue-status">
            <span>Dead-letter queue</span>
            <strong className="warning">0 blocked</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
