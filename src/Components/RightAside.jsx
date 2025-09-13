import { useEffect, useState } from 'react';
import { ESPN_SITE_BASE, fetchJSON } from '../utils/espn';
import { motion } from 'framer-motion';

const RightAside = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
  const response = await fetchJSON(`${ESPN_SITE_BASE}/eng.1/news`);
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
  const articles = response?.articles || [];
        const withImagesRecent = articles
          .filter(article => article?.images?.[0]?.url)
          .filter(article => {
            const published = article?.published || article?.lastModified;
            return published ? new Date(published) >= twoDaysAgo : true;
          })
          .slice(0, 10);
        setNews(withImagesRecent);
      } catch (error) {
        console.error('Error fetching news:', error.message);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="m-4 md:m-0 w-full">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-4 md:p-4 lg:p-5 shadow-sm text-gray-900 dark:text-white">
        <h2 className="text-lg md:text-xl font-anton mb-3">Latest News</h2>
        <ul>
          {news.map((article, index) => (
            <motion.li
              key={index}
              className="mb-4"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <a href={article.links?.web?.href || article?.link} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {article?.images?.[0]?.url && (
                  <img src={article.images[0].url} alt={article.headline} className="w-full h-28 object-cover" />
                )}
                <div className="p-2.5">
                  <h3 className="text-xs md:text-sm font-semibold leading-snug line-clamp-2">{article.headline || article.title}</h3>
                  <p className="text-[11px] md:text-xs font-roboto text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {article.description ? `${article.description.slice(0, 100)}...` : ''}
                  </p>
                  <div className="text-blue-600 dark:text-blue-400 hover:underline flex items-center mt-1.5 text-[11px] md:text-xs">
                    <span>Read more</span>
                    <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </a>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RightAside;
