import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Function to fetch sports news from the API
const fetchSportsNews = async () => {
  const options = {
    method: 'GET',
    origin : true ,  
    url: 'https://newsapi.org/v2/everything',
    params: {
      language: 'en',
      sources: 'bbc-sport, espn, football-italia, four-four-two, fox-sports, google-news, talksport, the-sport-bible, the-telegraph, the-times, the-verge, the-wall-street-journal, the-washington-post, time',
      q: 'Premier League OR La Liga OR Bundesliga OR Serie A OR Ligue 1 OR Champions League OR Europa League OR UEFA OR FIFA OR Transfer News OR Player Transfers OR Football Players OR Football Matches OR Football Results OR Football Highlights OR Football News OR Football Rumors OR Football Injuries OR Football Managers OR Football Clubs', // Search for football news
      sortBy: 'publishedAt', // Sort by published date
      apiKey: 'c82f6250f42f4f92b0518dfd6f60f235' // Replace with your actual API key
    }
  };

  const response = await axios.request(options);
  const today = new Date();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 2); // Get the date 3 days ago

  const articlesWithImages = response.data.articles
    .filter(article => {
      
      return article.urlToImage 
    }) // Filter for articles with images published in the past 3 days
     // Limit to 10 articles

  return articlesWithImages;
};

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsData = await fetchSportsNews();
        setNews(newsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching news:', error.message);
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div style={{
      background:
        "transparent",
    }} className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-white">Latest Sports News</h1>
      <div className="flex flex-wrap justify-center gap-6">
        {loading ? (
          <div className="text-center text-2xl font-semibold text-white">Loading News...</div>
        ) : (
          news.map((article, index) => (
            <motion.div
              key={index}
              className="bg-white shadow-lg rounded-lg p-6 max-w-sm w-full"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={article.urlToImage || 'https://via.placeholder.com/150'}
                alt={article.title}
                className="rounded-lg w-full h-40 object-cover shadow-md"
              />
              <h2 className="text-2xl font-bold mt-4 text-indigo-600">{article.title}</h2>
              <p className="text-md text-gray-700 mt-2">{article.description || 'No description available'}</p>
              <a
                href={article.url}
                className="text-white bg-indigo-500 hover:bg-indigo-600 transition duration-300 ease-in-out rounded-full px-4 py-2 mt-4 inline-block text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read More
              </a>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default News;