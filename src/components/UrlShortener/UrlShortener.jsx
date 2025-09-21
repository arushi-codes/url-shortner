import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Card, CardContent, Typography, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useUrl } from '../../context/UrlContext';
import { validateUrl, validateShortCode } from '../../utils/validators';

const UrlShortener = ({ onShowNotification }) => {
  const [urls, setUrls] = useState([{ longUrl: '', customShortcode: '', validity: 30 }]);
  const { shortenUrls, loading } = useUrl();

  const handleInputChange = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    setUrls(newUrls);
  };

  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls([...urls, { longUrl: '', customShortcode: '', validity: 30 }]);
    } else {
      onShowNotification('Maximum of 5 URLs allowed', 'warning');
    }
  };

  const removeUrlField = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  const handleShortenUrls = async () => {
    const validUrls = [];
    const errors = [];

    urls.forEach((url, index) => {
      if (!url.longUrl.trim()) {
        errors.push(`URL ${index + 1} is required`);
        return;
      }

      if (!validateUrl(url.longUrl)) {
        errors.push(`URL ${index + 1} is invalid`);
        return;
      }

      if (url.customShortcode && !validateShortCode(url.customShortcode)) {
        errors.push(`Shortcode for URL ${index + 1} can only contain alphanumeric characters and hyphens`);
        return;
      }

      validUrls.push({
        longUrl: url.longUrl,
        customShortcode: url.customShortcode || null,
        validity: parseInt(url.validity) || 30
      });
    });

    if (errors.length > 0) {
      errors.forEach(error => onShowNotification(error, 'error'));
      return;
    }

    try {
      await shortenUrls(validUrls);
      onShowNotification('URLs shortened successfully!', 'success');
      setUrls([{ longUrl: '', customShortcode: '', validity: 30 }]);
    } catch (error) {
      onShowNotification('Failed to shorten URLs', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Shorten up to 5 URLs</Typography>

      {urls.map((url, index) => (
        <Card key={index} sx={{ mb: 2, borderRadius: '12px' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Long URL"
                  placeholder="https://example.com/very-long-url"
                  value={url.longUrl}
                  onChange={(e) => handleInputChange(index, 'longUrl', e.target.value)}
                  error={url.longUrl && !validateUrl(url.longUrl)}
                  helperText={url.longUrl && !validateUrl(url.longUrl) ? 'Please enter a valid URL' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Custom Shortcode (optional)"
                  placeholder="my-custom-link"
                  value={url.customShortcode}
                  onChange={(e) => handleInputChange(index, 'customShortcode', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Validity (minutes)"
                  type="number"
                  value={url.validity}
                  onChange={(e) => handleInputChange(index, 'validity', e.target.value)}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                {urls.length > 1 && (
                  <IconButton color="error" onClick={() => removeUrlField(index)}>
                    <Delete />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant="outlined" startIcon={<Add />} onClick={addUrlField} disabled={urls.length >= 5}>
          Add URL
        </Button>
        <Button variant="contained" onClick={handleShortenUrls} disabled={loading} sx={{ px: 4 }}>
          {loading ? 'Shortening...' : 'Shorten URLs'}
        </Button>
      </Box>
    </Box>
  );
};

export default UrlShortener;