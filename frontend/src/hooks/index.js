import { useEffect, useState } from 'react';
import { opportunityService } from '../services';

function useAsync(fn, deps) {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);

    fn()
      .then((d) => live && setData(d))
      .catch(() => live && setError(true))
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
  }, deps);

  return { data, loading, error };
}

export const useOpportunities = (q, cat) =>
  useAsync(() => opportunityService.list(q, cat), [q, cat]);

export const useOpportunity = (id) =>
  useAsync(() => opportunityService.get(id), [id]);

export const daysLeft = (d) =>
  Math.ceil((+new Date(d) - Date.now()) / 864e5);

export const useAllOpportunities = () => useOpportunities('', 'All');
