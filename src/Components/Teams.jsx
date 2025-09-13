import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ESPN_SITE_BASE, fetchJSON } from '../utils/espn';
import PropTypes from 'prop-types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const leagueMap = [
  { id: 'PL', code: 'eng.1', name: 'Premier League' },
  { id: 'BL1', code: 'ger.1', name: 'Bundesliga' },
  { id: 'SA', code: 'ita.1', name: 'Serie A' },
  { id: 'PD', code: 'esp.1', name: 'La Liga' },
  { id: 'FL1', code: 'fra.1', name: 'Ligue 1' },
  { id: 'CL', code: 'uefa.champions', name: 'Champions League' },
];

const espnBase = ESPN_SITE_BASE;

export default function Teams({ leagueId }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(leagueId || 'PL');
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (leagueId && leagueId !== selected) setSelected(leagueId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  const league = useMemo(() => leagueMap.find((l) => l.id === selected) || leagueMap[0], [selected]);

  const fetchTeams = async (signal) => {
    setError('');
    setTeams(null); // reset to trigger skeleton
    try {
  const data = await fetchJSON(`${espnBase}/${league.code}/teams`, { signal });
  const nodes = data?.sports?.[0]?.leagues?.[0]?.teams || [];
      const mapped = nodes.map((t) => ({
        id: t?.team?.id,
        name: t?.team?.displayName || t?.team?.name,
        shortName: t?.team?.shortDisplayName || t?.team?.abbreviation,
        logo: t?.team?.logos?.[0]?.href || t?.team?.logo,
        color: t?.team?.color,
        altColor: t?.team?.alternateColor,
        link: t?.team?.links?.[0]?.href,
      }));
      setTeams(mapped);
    } catch (e) {
      if (e?.name !== 'AbortError') setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchTeams(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league.code]);

  const onSelect = (id) => {
    setSelected(id);
    try { localStorage.setItem('league', id); } catch {}
  };

  return (
  <div className="rounded-2xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900 dark:text-white">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="font-anton text-lg md:text-xl">Teams</h2>
        <div className="flex flex-wrap gap-1.5">
          {leagueMap.map((l) => (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className={`px-2 py-1 rounded-full text-xs md:text-sm border ${selected === l.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent border-gray-300 dark:border-gray-700'}`}
            >
              {l.id}
            </button>
          ))}
        </div>
      </div>

  {(loading || teams === null) ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-2.5 flex items-center gap-2">
              <Skeleton circle width={24} height={24} />
              <div className="min-w-0 flex-1">
                <Skeleton height={14} width={120} />
                <div className="mt-1">
                  <Skeleton height={10} width={80} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : teams.length === 0 ? (
        <div className="text-sm opacity-80">No teams found.</div>
      ) : (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {teams.map((t) => (
      <div key={t.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-2.5 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900" onClick={() => navigate(`/team/${selected}/${t.id}`)}>
              {t.logo && <img src={t.logo} alt={t.name} className="w-6 h-6" />}
              <div className="min-w-0">
                <div className="text-sm truncate">{t.name}</div>
                {t.shortName && <div className="text-[11px] opacity-70 truncate">{t.shortName}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Teams.propTypes = {
  leagueId: PropTypes.string,
};
