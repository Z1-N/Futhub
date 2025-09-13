import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ESPN_SITE_BASE, fetchJSON, yyyymmdd } from '../utils/espn';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const idToCode = {
  PL: 'eng.1', BL1: 'ger.1', SA: 'ita.1', PD: 'esp.1', FL1: 'fra.1', CL: 'uefa.champions'
};

export default function TeamPage() {
  const { leagueId, teamId } = useParams();
  const navigate = useNavigate();
  const leagueCode = useMemo(() => idToCode[leagueId] || leagueId, [leagueId]);
  const [data, setData] = useState({ team: null, recent: null, upcoming: null, performance: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
  setLoading(true); setError('');
  // reset lists to show skeletons while fetching
  setData({ team: null, recent: null, upcoming: null, performance: null });
      try {
        // Minimal client-side recreation of recent/upcoming using ESPN scoreboard
        const today = new Date();
        const days = [...Array(14)].map((_, i) => { const d = new Date(today); d.setDate(today.getDate() - i); return d; });
        const futDays = [...Array(14)].map((_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d; });
  const pastJsons = await Promise.all(days.map(d => fetchJSON(`${ESPN_SITE_BASE}/${leagueCode}/scoreboard?dates=${yyyymmdd(d)}`, { signal: controller.signal }).catch(()=>null)));
  const futJsons = await Promise.all(futDays.map(d => fetchJSON(`${ESPN_SITE_BASE}/${leagueCode}/scoreboard?dates=${yyyymmdd(d)}`, { signal: controller.signal }).catch(()=>null)));
        const toMatch = (ev) => {
          const comp = ev.competitions?.[0];
          const [home, away] = (comp?.competitors || []).sort((a,b)=> (a.homeAway === 'home' ? -1 : 1));
          const isHome = home?.team?.id === teamId;
          const self = isHome ? home : away;
          const opp = isHome ? away : home;
          const status = ev.status?.type?.state;
          const score = status !== 'pre' ? `${home?.score ?? 0}-${away?.score ?? 0}` : null;
          let result = 'U';
          if (status === 'post') {
            const hs = Number(home?.score ?? 0), as = Number(away?.score ?? 0);
            if (isHome ? hs > as : as > hs) result = 'W';
            else if (hs === as) result = 'D'; else result = 'L';
          }
          return { id: ev.id, date: ev.date, status: status === 'pre' ? 'SCHEDULED' : (status === 'in' ? 'LIVE' : 'FINISHED'), home: { id: home?.team?.id, name: home?.team?.displayName || home?.team?.name, logo: home?.team?.logo }, away: { id: away?.team?.id, name: away?.team?.displayName || away?.team?.name, logo: away?.team?.logo }, isHome, score, result };
        };
        const filterByTeam = (arr) => (arr?.events || []).filter(ev => (ev.competitions?.[0]?.competitors || []).some(c => c?.team?.id === teamId));
        const recentEvents = pastJsons.flatMap(j => filterByTeam(j)).filter(ev => ev.status?.type?.state === 'post').slice(0, 5);
        const upcomingEvents = futJsons.flatMap(j => filterByTeam(j)).filter(ev => ev.status?.type?.state === 'pre').slice(0, 5);
        const recent = recentEvents.map(toMatch);
        const upcoming = upcomingEvents.map(toMatch);
        let teamInfo = null;
        const sample = recent[0] || upcoming[0];
        if (sample) {
          const t = sample.isHome ? sample.home : sample.away;
          teamInfo = { id: t.id, name: t.name, logo: t.logo };
        }
        // Performance over last 5
        let performance = { last5: '', points: 0, gf: 0, ga: 0, gd: 0, winRate: 0 };
        if (recent.length) {
          const last5 = recent.slice(0, 5);
          let pts = 0, gf = 0, ga = 0, wins = 0;
          for (const m of last5) {
            const [hs, as] = (m.score || '0-0').split('-').map((n) => Number(n) || 0);
            gf += m.isHome ? hs : as; ga += m.isHome ? as : hs;
            if (m.result === 'W') { pts += 3; wins += 1; } else if (m.result === 'D') { pts += 1; }
          }
          performance = { last5: last5.map(m => m.result).join(''), points: pts, gf, ga, gd: gf - ga, winRate: Math.round((wins / last5.length) * 100) };
        }
        setData({ team: teamInfo, recent, upcoming, performance });
      } catch (e) {
        if (e?.name !== 'AbortError') setError('Failed to load team data');
      } finally { setLoading(false); }
    })();
    return () => controller.abort();
  }, [leagueCode, teamId]);

  const TeamHeader = () => {
    const c1 = data.team?.color ? `#${data.team.color}` : '#1e293b';
    const c2 = data.team?.altColor ? `#${data.team.altColor}` : '#0f172a';
    return (
      <div className="mb-4 rounded-2xl overflow-hidden border border-white/10">
        <div
          className="p-4 md:p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${c1} 0%, ${c2} 60%)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {data.team?.logo && (
                <img src={data.team.logo} alt={data.team.name} className="w-12 h-12 object-contain drop-shadow" />
              )}
              <div className="min-w-0">
                <h1 className="font-anton text-2xl md:text-3xl truncate leading-tight">
                  {data.team?.name || 'Team'}
                </h1>
              </div>
            </div>
            <button onClick={() => navigate(-1)} className="text-sm md:text-[13px] px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 border border-white/20">Back</button>
          </div>
        </div>
      </div>
    );
  };

  const Perf = () => {
    const p = data.performance;
    if (!p) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="rounded-xl bg-gradient-to-br from-white/60 to-white/30 dark:from-white/5 dark:to-white/0 border border-white/10 p-3 text-sm">
          <div className="text-xs opacity-75">Last 5</div>
          <div className="mt-1 flex items-center gap-1.5">
            {(p.last5 || '').split('').map((c, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${
                  c === 'W' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-emerald-500/30' :
                  c === 'L' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30' :
                  'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/30'
                }`}
              >{c}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-white/60 to-white/30 dark:from-white/5 dark:to-white/0 border border-white/10 p-3 text-sm"><div className="text-xs opacity-75">Points</div><div className="font-anton text-xl">{p.points}</div></div>
        <div className="rounded-xl bg-gradient-to-br from-white/60 to-white/30 dark:from-white/5 dark:to-white/0 border border-white/10 p-3 text-sm"><div className="text-xs opacity-75">GF</div><div className="font-anton text-xl">{p.gf}</div></div>
        <div className="rounded-xl bg-gradient-to-br from-white/60 to-white/30 dark:from-white/5 dark:to-white/0 border border-white/10 p-3 text-sm"><div className="text-xs opacity-75">GA</div><div className="font-anton text-xl">{p.ga}</div></div>
        <div className="rounded-xl bg-gradient-to-br from-white/60 to-white/30 dark:from-white/5 dark:to-white/0 border border-white/10 p-3 text-sm"><div className="text-xs opacity-75">Win %</div><div className="font-anton text-xl">{p.winRate}%</div></div>
      </div>
    );
  };

  const MatchList = ({ title, items = [], loading: listLoading = false }) => (
    <div className="rounded-2xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-3.5 md:p-5">
      <h3 className="font-anton text-lg mb-2 flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full" style={{ background: data.team?.color ? `#${data.team.color}` : undefined }} />
        {title}
      </h3>
      {listLoading ? (
        <ul className="space-y-3 md:space-y-4">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="rounded-xl border border-white/10 bg-gray-50 dark:bg-gray-900/60 p-3.5 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2 min-w-0 basis-0 flex-1 overflow-hidden">
                  <Skeleton circle width={24} height={24} />
                  <div className="min-w-0 flex-1">
                    <Skeleton height={14} width={140} />
                  </div>
                </div>
                <div className="shrink-0 text-center min-w-[90px]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-gray-900/5 dark:bg-white/10 border-white/10">
                    <Skeleton width={56} height={18} />
                  </div>
                  <div className="mt-1">
                    <Skeleton width={80} height={10} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 min-w-0 basis-0 flex-1 overflow-hidden">
                  <div className="min-w-0 flex-1 text-right">
                    <Skeleton height={14} width={140} style={{ marginLeft: 'auto' }} />
                  </div>
                  <Skeleton circle width={24} height={24} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="text-sm opacity-80">No matches.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id} className="rounded-xl border border-white/10 bg-gray-50 dark:bg-gray-900/60 p-3.5 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2 min-w-0 basis-0 flex-1 ">
                  {m.home.logo && <img src={m.home.logo} alt={m.home.name} className="w-6 h-6 object-contain" />}
                  <span className="text-xs leading-tight whitespace-normal " title={m.home.name}>{m.home.name}</span>
                </div>
                <div className="shrink-0 text-center min-w-[90px]">
                  {m.status === 'SCHEDULED' ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-gray-900/5 dark:bg-white/10 border-white/10 font-anton text-sm">
                      <span>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-gray-900/5 dark:bg-white/10 border-white/10 font-anton text-sm">
                      <span>{m.score || '-'}</span>
                      {m.result && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full ring-1 ring-inset ${m.result === 'W' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-emerald-500/30' : m.result === 'D' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30'}`}>{m.result}</span>
                      )}
                    </div>
                  )}
                  <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{new Date(m.date).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center justify-end gap-2 min-w-0 basis-0 flex-1 overflow-hidden">
                  <span className="text-xs leading-tight text-right whitespace-normal" title={m.away.name}>{m.away.name}</span>
                  {m.away.logo && <img src={m.away.logo} alt={m.away.name} className="w-6 h-6 object-contain" />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-3 text-gray-900 dark:text-white">
      <TeamHeader />
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {loading ? (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-white/10 p-4"><Skeleton height={28} width={240} /><div className="mt-2"><Skeleton height={16} width={120} /></div></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[...Array(5)].map((_,i)=>(<div key={i} className="rounded-xl border border-white/10 p-3"><Skeleton height={20} /></div>))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[...Array(2)].map((_,i)=>(
              <div key={i} className="rounded-2xl border border-white/10 p-3">
                <div className="mb-2"><Skeleton height={18} width={120} /></div>
                {[...Array(3)].map((__,j)=>(<div key={j} className="mb-2"><Skeleton height={54} /></div>))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <Perf />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6">
            <MatchList title="Recent" items={data.recent || []} loading={loading || data.recent === null} />
            <MatchList title="Upcoming" items={data.upcoming || []} loading={loading || data.upcoming === null} />
          </div>
        </div>
      )}
    </div>
  );
}
