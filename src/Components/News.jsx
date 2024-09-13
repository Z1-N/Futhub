import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const options = {
        method: 'GET',
        url: 'https://api.currentsapi.services/v1/latest-news',
        params: {
          category : 'sports',
          language: 'en',
          keywords: 'soccer, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Europa League, UEFA, FIFA, Transfer News, Player Transfers, Football Players, Football Matches, Football Results, Football Highlights, Football News, Football Rumors, Football Injuries, Football Managers, Football Clubs',
          apiKey: '3DMRmLiB2jUVat5OJ_iKOxnXxYmzxYh8t4NSQ_TeApYHX9_4' // Replace with your actual API key
        }
      };

      try {
        const response = await axios.request(options);

        const articlesWithImages = response.data.news
          .filter(article => {
            
            return article.image 
          })
          .slice(0, 104); // Limit to 10 articles

        setNews(articlesWithImages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching news:', error.message);
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <section className="bg-gray-900 text-white py-8 px-4 md:px-8 lg:px-16 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center">Latest News</h2>
      {loading ? (
        <div className="text-center text-xl font-semibold">Loading News...</div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((article, index) => (
            <motion.li
              key={index}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
                {article.image && (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {article.description ? `${article.description.slice(0, 100)}...` : 'No description available'}
                  </p>
                  <div className="text-blue-400 hover:underline flex items-center">
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
    </section>
  );
};

export default News;
