import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const RightAside = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      const options = {
        method: 'GET',
        url: 'https://web-production-6fc64.up.railway.app/newsapi.org/v2/everything',
        params: {
          language : 'en',
          source : 'bbc-sport, espn, football-italia, four-four-two, fox-sports, google-news, talksport, the-sport-bible, the-telegraph, the-times, the-verge, the-wall-street-journal, the-washington-post, time',
          q: 'Premier League OR La Liga OR Bundesliga OR Serie A OR Ligue 1 OR Champions League OR Europa League OR UEFA OR FIFA OR Transfer News OR Player Transfers OR Football Players OR Football Matches OR Football Results OR Football Highlights OR Football News OR Football Rumors OR Football Injuries OR Football Managers OR Football Clubs', // Search for football news          language: 'en', // Filter for English articles
          sortBy: 'publishedAt', // Sort by news
          apiKey: 'c82f6250f42f4f92b0518dfd6f60f235' // Replace with your actual API key
        }
      };

      try {
        const response = await axios.request(options);
        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 2); // Get the date 3 days ago

        const articlesWithImages = response.data.articles
          .filter(article => {
            const articleDate = new Date(article.publishedAt);
            return article.urlToImage && articleDate >= threeDaysAgo && articleDate <= today;
          }) // Filter for articles with images published in the past 3 days
          .slice(0, 10); // Limit to 4 articles
        setNews(articlesWithImages);
      } catch (error) {
        console.error('Error fetching news:', error.message);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="bg-gray-800 m-8 text-white p-4 rounded-lg shadow-lg w-full md:w-64">
      <h2 className="text-2xl font-anton mb-4">Latest News</h2>
      <ul>
        {news.map((article, index) => (
          <motion.li
            key={index}
            className="mb-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 font-roboto cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
              {article.urlToImage && (
                <img src={article.urlToImage} alt={article.title} className="w-full h-32 object-cover rounded-lg mb-2" />
              )}
              <h3 className="text-lg font-semibold">{article.title}</h3>
              <p className="text-sm font-roboto text-gray-400">
                {article.description ? `${article.description.slice(0, 100)}...` : ''}
              </p>
              <div className="text-blue-400 hover:underline flex items-center mt-2">
                <span>Read more</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </a>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default RightAside;