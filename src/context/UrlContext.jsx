import React, { createContext, useContext, useReducer, useEffect } from 'react';

const UrlContext = createContext();

const urlReducer = (state, action) => {
  let newState;
  switch (action.type) {
    case 'ADD_URLS':
      newState = [...state, ...action.payload];
      break;
    case 'INCREMENT_CLICKS':
      newState = state.map(url => 
        url.id === action.payload 
          ? { 
              ...url, 
              clicks: url.clicks + 1,
              clickData: [...url.clickData, {
                timestamp: new Date(),
                location: 'Unknown',
                source: 'Direct'
              }]
            } 
          : url
      );
      break;
    case 'LOAD_URLS':
      return action.payload;
    default:
      return state;
  }
  
  // Save to localStorage whenever state changes
  localStorage.setItem('urlShortenerData', JSON.stringify(newState));
  return newState;
};

export const UrlProvider = ({ children }) => {
  const [urls, dispatch] = useReducer(urlReducer, []);

  // Load URLs from localStorage on component mount
  useEffect(() => {
    const savedUrls = localStorage.getItem('urlShortenerData');
    if (savedUrls) {
      try {
        const parsedUrls = JSON.parse(savedUrls);
        // Convert string dates back to Date objects
        const urlsWithDates = parsedUrls.map(url => ({
          ...url,
          createdAt: new Date(url.createdAt),
          expiresAt: new Date(url.expiresAt),
          clickData: url.clickData.map(click => ({
            ...click,
            timestamp: new Date(click.timestamp)
          }))
        }));
        dispatch({ type: 'LOAD_URLS', payload: urlsWithDates });
      } catch (error) {
        console.error('Error loading saved URLs:', error);
      }
    }
  }, []);

  const shortenUrls = async (urlsData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const newUrls = urlsData.map(urlData => ({
            id: Date.now() + Math.random(),
            longUrl: urlData.longUrl,
            shortCode: urlData.customShortcode || generateShortCode(),
            shortUrl: `${window.location.origin}/${urlData.customShortcode || generateShortCode()}`,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + (urlData.validity || 30) * 60000),
            clicks: 0,
            clickData: []
          }));

          dispatch({ type: 'ADD_URLS', payload: newUrls });
          resolve(newUrls);
        } catch (error) {
          reject(error);
        }
      }, 1000);
    });
  };

  const incrementClicks = (urlId) => {
    dispatch({ type: 'INCREMENT_CLICKS', payload: urlId });
  };

  const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  return (
    <UrlContext.Provider value={{ urls, shortenUrls, incrementClicks }}>
      {children}
    </UrlContext.Provider>
  );
};

export const useUrl = () => {
  const context = useContext(UrlContext);
  if (!context) {
    throw new Error('useUrl must be used within a UrlProvider');
  }
  return context;
};