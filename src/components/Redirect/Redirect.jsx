import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUrl } from '../../context/UrlContext';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import { Home } from '@mui/icons-material';

const Redirect = () => {
  const { shortCode } = useParams();
  const { urls, incrementClicks } = useUrl();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const hasIncremented = useRef(false);
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Prevent multiple execution
    if (redirectAttempted.current) return;
    redirectAttempted.current = true;

    const findUrlAndRedirect = async () => {
      try {
        // Strategy 1: Check context first (fastest)
        if (urls && urls.length > 0) {
          const foundUrl = urls.find(url => url.shortCode === shortCode);
          if (foundUrl) {
            await processRedirect(foundUrl, true);
            return;
          }
        }

        // Strategy 2: Check localStorage (persistent storage)
        const savedUrls = localStorage.getItem('urlShortenerData');
        if (savedUrls) {
          try {
            const parsedUrls = JSON.parse(savedUrls);
            const foundUrl = parsedUrls.find(url => url.shortCode === shortCode);
            
            if (foundUrl) {
              await processRedirect(foundUrl, false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
          }
        }

        // If we get here, no URL was found
        setError(`Shortened URL "${shortCode}" not found`);
        setLoading(false);

      } catch (error) {
        console.error('Redirect error:', error);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    const processRedirect = async (urlData, fromContext) => {
      // Check if URL is expired with proper date handling
      const now = new Date();
      let expiryDate;
      
      // Handle different date formats
      if (urlData.expiresAt) {
        if (typeof urlData.expiresAt === 'string') {
          expiryDate = new Date(urlData.expiresAt);
        } else if (urlData.expiresAt instanceof Date) {
          expiryDate = urlData.expiresAt;
        } else if (typeof urlData.expiresAt === 'number') {
          expiryDate = new Date(urlData.expiresAt);
        } else {
          expiryDate = new Date();
        }
      } else {
        expiryDate = new Date();
      }

      // Add a 1-minute buffer to account for any delays
      const bufferMs = 60 * 1000; // 1 minute buffer
      const expiryWithBuffer = new Date(expiryDate.getTime() + bufferMs);

      console.log('Current time:', now.toISOString());
      console.log('Expiry time:', expiryDate.toISOString());
      console.log('Expiry with buffer:', expiryWithBuffer.toISOString());

      if (now > expiryWithBuffer) {
        setError('This shortened URL has expired');
        setLoading(false);
        return;
      }
      
      // Store destination URL for display
      setDestinationUrl(urlData.longUrl);
      
      // Mark as processed to prevent duplicate increments
      if (!hasIncremented.current) {
        hasIncremented.current = true;
        
        // Update click count
        await updateClickCount(urlData, fromContext);
      }
      
      // Redirect after brief delay
      setTimeout(() => {
        // Ensure URL has protocol
        let redirectUrl = urlData.longUrl;
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
          redirectUrl = 'https://' + redirectUrl;
        }
        window.location.href = redirectUrl;
      }, 1500);
    };

    const updateClickCount = async (urlData, fromContext) => {
      try {
        // Update in localStorage
        const savedUrls = localStorage.getItem('urlShortenerData');
        if (savedUrls) {
          const parsedUrls = JSON.parse(savedUrls);
          const updatedUrls = parsedUrls.map(url => {
            if (url.id === urlData.id || url.shortCode === urlData.shortCode) {
              const currentClicks = typeof url.clicks === 'number' ? url.clicks : 0;
              return {
                ...url,
                clicks: currentClicks + 1,
                lastClicked: new Date().toISOString(),
                clickData: [
                  ...(url.clickData || []),
                  {
                    timestamp: new Date().toISOString(),
                    location: 'Direct',
                    source: window.location.href,
                    userAgent: navigator.userAgent
                  }
                ]
              };
            }
            return url;
          });
          
          localStorage.setItem('urlShortenerData', JSON.stringify(updatedUrls));
          
          // Update context to keep UI in sync
          if (fromContext && incrementClicks) {
            incrementClicks(urlData.id);
          }
          
          // Dispatch storage event for other tabs
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'urlShortenerData',
            newValue: JSON.stringify(updatedUrls),
            oldValue: savedUrls
          }));
        }
      } catch (error) {
        console.error('Error updating click count:', error);
      }
    };

    // Start the redirect process
    findUrlAndRedirect();

  }, [shortCode, urls, incrementClicks]);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" p={3}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h5" sx={{ mt: 3, mb: 1 }} align="center">
          🔄 Redirecting you to...
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, wordBreak: 'break-all' }} color="text.secondary" align="center">
          {destinationUrl || 'Loading...'}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          You will be automatically redirected in 1.5 seconds
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" p={3}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h4" color="error" gutterBottom>
            ⚠️ Redirect Error
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, color: '#666' }}>
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#888' }}>
            This usually happens if:
            <br />• The URL has expired
            <br />• The short code is incorrect
            <br />• The URL was deleted
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<Home />}
            onClick={() => window.location.href = '/'}
            sx={{ 
              mt: 2,
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            Return to URL Shortener
          </Button>
        </Paper>
      </Box>
    );
  }

  return null;
};

export default Redirect;