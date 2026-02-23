import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const UrlContext = createContext();

const urlReducer = (state, action) => {
  let newState;
  
  switch (action.type) {
    case 'ADD_URLS':
      // Prevent duplicate shortcodes
      const existingShortCodes = new Set(state.map(url => url.shortCode));
      const uniqueNewUrls = action.payload.filter(url => !existingShortCodes.has(url.shortCode));
      newState = [...state, ...uniqueNewUrls];
      break;
      
    case 'INCREMENT_CLICKS':
      newState = state.map(url => 
        url.id === action.payload 
          ? { 
              ...url, 
              clicks: (url.clicks || 0) + 1,
              lastClicked: new Date().toISOString(),
              clickData: [
                ...(url.clickData || []),
                {
                  timestamp: new Date().toISOString(),
                  location: action.payload.location || 'Unknown',
                  source: action.payload.source || 'Direct',
                  userAgent: navigator.userAgent
                }
              ]
            } 
          : url
      );
      break;
      
    case 'LOAD_URLS':
      return action.payload;
      
    case 'DELETE_URL':
      newState = state.filter(url => url.id !== action.payload && url.shortCode !== action.payload);
      break;
      
    case 'UPDATE_URL':
      newState = state.map(url => 
        url.id === action.payload.id ? { ...url, ...action.payload.updates } : url
      );
      break;
      
    default:
      return state;
  }
  
  // Save to localStorage whenever state changes
  if (newState) {
    try {
      localStorage.setItem('urlShortenerData', JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  return newState || state;
};

export const UrlProvider = ({ children }) => {
  const [urls, dispatch] = useReducer(urlReducer, []);

  // Load URLs from localStorage on mount
  useEffect(() => {
    const savedUrls = localStorage.getItem('urlShortenerData');
    if (savedUrls) {
      try {
        const parsedUrls = JSON.parse(savedUrls);
        // Convert string dates back to Date objects
        const urlsWithDates = parsedUrls.map(url => ({
          ...url,
          id: url.id || `${Date.now()}-${Math.random()}`,
          createdAt: url.createdAt ? new Date(url.createdAt) : new Date(),
          expiresAt: url.expiresAt ? new Date(url.expiresAt) : new Date(Date.now() + 30*24*60*60*1000),
          clicks: url.clicks || 0,
          clickData: (url.clickData || []).map(click => ({
            ...click,
            timestamp: click.timestamp ? new Date(click.timestamp) : new Date()
          }))
        }));
        dispatch({ type: 'LOAD_URLS', payload: urlsWithDates });
      } catch (error) {
        console.error('Error loading saved URLs:', error);
        // If data is corrupted, clear it
        localStorage.removeItem('urlShortenerData');
      }
    }
  }, []);

  const shortenUrls = async (urlsData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const baseUrl = window.location.origin;
          const newUrls = urlsData.map(urlData => {
            // Generate shortcode
            const shortCode = urlData.customShortcode?.trim() || generateShortCode();
            
            // Check if shortcode already exists
            if (urls.some(url => url.shortCode === shortCode)) {
              throw new Error(`Shortcode "${shortCode}" already exists`);
            }

            // Ensure URL has protocol
            let longUrl = urlData.longUrl;
            if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
              longUrl = 'https://' + longUrl;
            }

            // Calculate expiry date properly
            let expiryDate;
            if (urlData.validity) {
              // If validity is a date string (from input type="datetime-local")
              if (typeof urlData.validity === 'string') {
                expiryDate = new Date(urlData.validity);
              } 
              // If validity is a number (minutes from now)
              else if (typeof urlData.validity === 'number') {
                expiryDate = new Date(Date.now() + urlData.validity * 60000);
              }
              // If validity is a Date object
              else if (urlData.validity instanceof Date) {
                expiryDate = urlData.validity;
              }
              // If validity is an object with getTime (like from date picker)
              else if (urlData.validity && typeof urlData.validity.getTime === 'function') {
                expiryDate = urlData.validity;
              }
              else {
                expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
              }
            } else {
              expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
            }

            // Ensure expiryDate is valid
            if (isNaN(expiryDate.getTime())) {
              expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }

            return {
              id: `${Date.now()}-${Math.random()}`,
              longUrl: longUrl,
              shortCode: shortCode,
              shortUrl: `${baseUrl}/${shortCode}`,
              createdAt: new Date().toISOString(),
              expiresAt: expiryDate.toISOString(),
              clicks: 0,
              clickData: [],
              active: true,
              title: urlData.title || longUrl.substring(0, 50)
            };
          });

          dispatch({ type: 'ADD_URLS', payload: newUrls });
          
          // Return URLs with proper Date objects for immediate use
          resolve(newUrls.map(url => ({
            ...url,
            createdAt: new Date(url.createdAt),
            expiresAt: new Date(url.expiresAt)
          })));
        } catch (error) {
          console.error('Error creating short URLs:', error);
          reject(error);
        }
      }, 500);
    });
  };

  const incrementClicks = useCallback((urlId, metadata = {}) => {
    dispatch({ 
      type: 'INCREMENT_CLICKS', 
      payload: { 
        id: urlId,
        location: metadata.location || 'Unknown',
        source: metadata.source || window.location.href
      }
    });
  }, []);

  const deleteUrl = useCallback((urlId) => {
    dispatch({ type: 'DELETE_URL', payload: urlId });
  }, []);

  const updateUrl = useCallback((urlId, updates) => {
    dispatch({ type: 'UPDATE_URL', payload: { id: urlId, updates } });
  }, []);

  const getUrlByShortCode = useCallback((shortCode) => {
    return urls.find(url => url.shortCode === shortCode);
  }, [urls]);

  const generateShortCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let shortCode;
    do {
      shortCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (urls.some(url => url.shortCode === shortCode));
    return shortCode;
  };

  const value = {
    urls,
    shortenUrls,
    incrementClicks,
    deleteUrl,
    updateUrl,
    getUrlByShortCode
  };

  return (
    <UrlContext.Provider value={value}>
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