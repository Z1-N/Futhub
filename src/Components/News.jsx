import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const options = {
        method: 'GET',
        url: 'https://web-production-6fc64.up.railway.app/newsapi.org/v2/everything',
        params: {
          language: 'en',
          sources: 'bbc-sport, espn, football-italia, four-four-two, fox-sports, google-news, talksport, the-sport-bible, the-telegraph, the-times, the-verge, the-wall-street-journal, the-washington-post, time',
          q: 'Premier League OR La Liga OR Bundesliga OR Serie A OR Ligue 1 OR Champions League OR Europa League OR UEFA OR FIFA OR Transfer News OR Player Transfers OR Football Players OR Football Matches OR Football Results OR Football Highlights OR Football News OR Football Rumors OR Football Injuries OR Football Managers OR Football Clubs',
          sortBy: 'publishedAt',
          apiKey: 'c82f6250f42f4f92b0518dfd6f60f235'
        }
      };

      try {
        const response = await axios.request(options);
        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 2);

        const articlesWithImages = response.data.articles
          .filter(article => {
            
            return article.urlToImage
          })
          .slice(0, 103);

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
                {article.urlToImage && (
                  <img
                    src={article.urlToImage}
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