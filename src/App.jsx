import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Paper, Typography, Tabs, Tab, Box, Alert, Snackbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import UrlShortener from './components/UrlShortener/UrlShortener';
import Statistics from './components/Statistics/Statistics';
import Redirect from './components/Redirect/Redirect';
import { UrlProvider } from './context/UrlContext';
import './App.css';

// Styled components (ADD THESE)
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  minHeight: '80vh'
}));

const HeaderTypography = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  fontWeight: '700',
  textAlign: 'center',
  marginBottom: theme.spacing(2),
}));

// TabPanel component (ADD THIS)
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <UrlProvider>
      <Routes>
        <Route path="/" element={
          <Container maxWidth="lg">
            <StyledPaper elevation={3}>
              <HeaderTypography variant="h3" component="h1">
                URL Shortener
              </HeaderTypography>
              <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
                Shorten your URLs and track their performance
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                  <Tab label="URL Shortener" />
                  <Tab label="Statistics" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <UrlShortener onShowNotification={showNotification} />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Statistics onShowNotification={showNotification} />
              </TabPanel>
            </StyledPaper>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification}>
              <Alert onClose={handleCloseNotification} severity={notification.severity}>
                {notification.message}
              </Alert>
            </Snackbar>
          </Container>
        } />
        
        <Route path="/:shortCode" element={<Redirect />} />
      </Routes>
    </UrlProvider>
  );
}

export default App;