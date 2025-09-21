import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Chip
} from '@mui/material';
import { ContentCopy, Search, Schedule, LocationOn } from '@mui/icons-material';
import { useUrl } from '../../context/UrlContext';

const Statistics = ({ onShowNotification }) => {
  const { urls } = useUrl();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrl, setSelectedUrl] = useState(null);

  const filteredUrls = urls.filter(url => 
    url.longUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    url.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    onShowNotification('Copied to clipboard!', 'success');
  };

  const handleRowClick = (url) => {
    setSelectedUrl(selectedUrl?.id === url.id ? null : url);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getStatus = (expiresAt) => {
    return new Date(expiresAt) > new Date() ? 'Active' : 'Expired';
  };

  const getStatusColor = (expiresAt) => {
    return new Date(expiresAt) > new Date() ? 'success' : 'error';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>URL Analytics</Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" component="div" gutterBottom>
                {urls.length}
              </Typography>
              <Typography variant="body2">Total Short URLs</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" component="div" gutterBottom>
                {urls.reduce((total, url) => total + url.clicks, 0)}
              </Typography>
              <Typography variant="body2">Total Clicks</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" component="div" gutterBottom>
                {new Set(urls.flatMap(url => url.clickData.map(click => click.location))).size}
              </Typography>
              <Typography variant="body2">Unique Locations</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TextField
        fullWidth
        placeholder="Search URLs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
        }}
      />

      <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Short URL</TableCell>
              <TableCell>Original URL</TableCell>
              <TableCell align="center">Clicks</TableCell>
              <TableCell align="center">Created</TableCell>
              <TableCell align="center">Expires</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUrls.map((url) => (
              <React.Fragment key={url.id}>
                <TableRow hover onClick={() => handleRowClick(url)} sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {url.shortUrl}
                      </Typography>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); copyToClipboard(url.shortUrl); }}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {url.longUrl}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={url.clicks} color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{formatDate(url.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{formatDate(url.expiresAt)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={getStatus(url.expiresAt)} color={getStatusColor(url.expiresAt)} size="small" />
                  </TableCell>
                </TableRow>
                {selectedUrl?.id === url.id && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: '8px' }}>
                        <Typography variant="h6" gutterBottom>Click Details</Typography>
                        {url.clickData.length > 0 ? (
                          url.clickData.map((click, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" sx={{ mr: 2 }}>
                                {formatDate(click.timestamp)}
                              </Typography>
                              <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{click.location}</Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="textSecondary">No clicks yet</Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredUrls.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="textSecondary">
            No URLs found. Create your first shortened URL to see statistics.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Statistics;