import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ESPN_SITE_BASE, fetchJSON } from '../utils/espn';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      // Default league: Premier League (eng.1)
  const primary = `${ESPN_SITE_BASE}/eng.1/news`;
  const fallback = `${ESPN_SITE_BASE}/news`;
      try {
  const data1 = await fetchJSON(primary);
        let items = [];
        if (Array.isArray(data1.articles)) items = data1.articles;
        else if (Array.isArray(data1.headlines)) items = data1.headlines;
        else if (Array.isArray(data1.feed)) items = data1.feed;
        else if (Array.isArray(data1.items)) items = data1.items;

        if (!items.length) {
          const data2 = await fetchJSON(fallback);
          if (Array.isArray(data2.articles)) items = data2.articles;
          else if (Array.isArray(data2.headlines)) items = data2.headlines;
          else if (Array.isArray(data2.feed)) items = data2.feed;
          else if (Array.isArray(data2.items)) items = data2.items;
        }

        const normalized = (items || []).map((it) => ({
          headline: it.headline || it.title || it?.text || '',
          description: it.description || it?.summary || '',
          links: it.links || { web: { href: it?.link || it?.url } },
          images: it.images || (it?.images?.length ? it.images : (it?.image ? [{ url: it.image?.url || it.image }] : [])),
        }));

        const withImages = normalized.filter(a => a?.images?.[0]?.url).slice(0, 30);
        setNews(withImages);
      } catch (error) {
        console.error('Error fetching news:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <section className="py-8 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-anton text-center mb-6 text-gray-900 dark:text-white">Latest News</h2>
        {loading ? (
          <div className="text-center text-xl font-semibold text-gray-900 dark:text-gray-200">Loading News...</div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((article, index) => (
              <motion.li
                key={index}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 backdrop-blur hover:shadow-md transition-shadow duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <a href={article.links?.web?.href || article?.link} target="_blank" rel="noopener noreferrer" className="block">
                  {article?.images?.[0]?.url && (
                    <img
                      src={article.images[0].url}
                      alt={article.headline}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{article.headline || article.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {article.description ? `${article.description.slice(0, 100)}...` : article?.description || 'No description available'}
                    </p>
                    <div className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                      <span>Read more</span>
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </a>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default News;
