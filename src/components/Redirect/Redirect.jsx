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
  const hasIncremented = useRef(false); // Prevent multiple click increments

  useEffect(() => {
    // Skip if already processed this shortCode
    if (hasIncremented.current) return;

    const findAndRedirect = (urlList, isFromContext = false) => {
      const redirectUrl = urlList.find(url => url.shortCode === shortCode);
      
      if (redirectUrl) {
        // Check if URL is expired
        if (new Date(redirectUrl.expiresAt) < new Date()) {
          setError('This shortened URL has expired');
          setLoading(false);
          return;
        }
        
        // Store the destination URL
        setDestinationUrl(redirectUrl.longUrl);
        
        // Mark as processed to prevent duplicate increments
        hasIncremented.current = true;
        
        // Update click count in localStorage (ALWAYS)
        updateClickCountInStorage(redirectUrl);
        
        // Also update React Context if available
        if (isFromContext && incrementClicks) {
          incrementClicks(redirectUrl.id);
        }
        
        // Redirect to original URL after a brief delay
        setTimeout(() => {
          window.location.href = redirectUrl.longUrl;
        }, 2000);
        
      } else {
        setError(`Shortened URL "${shortCode}" not found`);
        setLoading(false);
      }
    };

    // First check context (in-memory)
    if (urls && urls.length > 0) {
      findAndRedirect(urls, true);
    } else {
      // Fallback: check localStorage
      const savedUrls = localStorage.getItem('urlShortenerData');
      if (savedUrls) {
        try {
          const parsedUrls = JSON.parse(savedUrls);
          findAndRedirect(parsedUrls, false);
        } catch (error) {
          setError('Error loading URL data from storage');
          setLoading(false);
        }
      } else {
        setError('URL data not available. Please shorten a URL first.');
        setLoading(false);
      }
    }
  }, [shortCode, urls, incrementClicks]);

  // Function to update click count in localStorage
  const updateClickCountInStorage = (redirectUrl) => {
    try {
      const savedUrls = localStorage.getItem('urlShortenerData');
      if (savedUrls) {
        const parsedUrls = JSON.parse(savedUrls);
        const updatedUrls = parsedUrls.map(url => {
          if (url.id === redirectUrl.id) {
            return {
              ...url,
              clicks: (url.clicks || 0) + 1, // Ensure clicks exists
              clickData: [
                ...(url.clickData || []),
                {
                  timestamp: new Date(),
                  location: 'Unknown',
                  source: 'Direct'
                }
              ]
            };
          }
          return url;
        });
        
        // Save updated URLs back to localStorage
        localStorage.setItem('urlShortenerData', JSON.stringify(updatedUrls));
      }
    } catch (error) {
      console.error('Error updating click count in storage:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" p={3}>
        <CircularProgress size={60} />
        <Typography variant="h5" sx={{ mt: 3, mb: 1 }} align="center">
          Redirecting you to...
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary" align="center">
          {destinationUrl || 'Loading destination...'}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          You will be automatically redirected in 2 seconds
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" p={3}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            ⚠️ Redirect Error
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }} color="text.secondary">
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }} color="text.secondary">
            This usually happens if:
            <br />• The URL was shortened in a different session
            <br />• The browser was refreshed
            <br />• The URL has been deleted or expired
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<Home />}
            onClick={() => window.location.href = '/'}
            sx={{ mt: 2 }}
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